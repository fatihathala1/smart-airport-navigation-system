import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { categories, floors, qrLocations, routeEdges, routeNodes, spaces, terminals } from "../src/data/demo-wayfinding";

const connectionString = process.env.DATABASE_URL;
const seedPassword = process.env.SEED_ADMIN_PASSWORD;
if (!connectionString) throw new Error("DATABASE_URL is required");
if (!seedPassword || seedPassword.length < 12) throw new Error("SEED_ADMIN_PASSWORD must contain at least 12 characters");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  const passwordHash = await bcrypt.hash(seedPassword!, 12);
  const categoryRows = new Map<string, { id: string }>();
  for (const category of categories.filter((item) => item.id !== "all")) {
    const row = await prisma.category.upsert({
      where: { slug: category.id },
      update: { name: category.label },
      create: { slug: category.id, name: category.label, icon: category.id, color: "#00649b", sortOrder: categoryRows.size },
      select: { id: true },
    });
    categoryRows.set(category.id, row);
  }

  const floorRows = new Map<string, { id: string }>();
  for (const terminal of terminals) {
    const terminalRow = await prisma.terminal.upsert({ where: { code: terminal.code }, update: { name: terminal.name }, create: { code: terminal.code, name: terminal.name } });
    for (const floor of floors.filter((item) => item.terminal === terminal.code)) {
      const mapAsset = terminal.floorMaps[floor.id]?.asset ?? terminal.mapAsset;
      const row = await prisma.floor.upsert({
        where: { code: floor.id },
        update: { label: floor.label, mapAsset },
        create: { terminalId: terminalRow.id, code: floor.id, number: floor.number, label: floor.label, mapAsset, viewBox: "0 0 1000 700", sortOrder: floor.number },
        select: { id: true },
      });
      floorRows.set(floor.id, row);
    }
  }

  const nodeRows = new Map<string, { id: string }>();
  for (const node of routeNodes) {
    const row = await prisma.routeNode.upsert({
      where: { code: node.id },
      update: { x: node.x, y: node.y, active: node.active !== false },
      create: { floorId: floorRows.get(node.floorId)!.id, code: node.id, x: node.x, y: node.y, label: node.id, active: node.active !== false },
      select: { id: true },
    });
    nodeRows.set(node.id, row);
  }

  for (const edge of routeEdges) {
    await prisma.routeEdge.upsert({
      where: { id: edge.id },
      update: { distanceMeters: edge.distanceMeters, type: edge.type, direction: edge.direction, publicAccess: edge.publicAccess, accessible: edge.accessible, active: edge.active },
      create: { id: edge.id, fromNodeId: nodeRows.get(edge.fromNodeId)!.id, toNodeId: nodeRows.get(edge.toNodeId)!.id, distanceMeters: edge.distanceMeters, type: edge.type, direction: edge.direction, publicAccess: edge.publicAccess, accessible: edge.accessible, active: edge.active },
    });
  }

  const fallbackCategoryId = categoryRows.values().next().value?.id;
  if (!fallbackCategoryId) throw new Error("At least one facility category is required");

  for (const space of spaces) {
    const spaceRow = await prisma.space.upsert({
      where: { code: space.code },
      update: { label: space.label, status: space.status, geometry: { type: "polygon", points: space.polygon }, routingAnchorNodeId: nodeRows.get(space.anchorNodeId)!.id },
      create: { floorId: floorRows.get(space.floorId)!.id, code: space.code, label: space.label, type: space.type, status: space.status, geometry: { type: "polygon", points: space.polygon }, routingAnchorNodeId: nodeRows.get(space.anchorNodeId)!.id },
    });
    if (space.tenant) {
      const slug = `${space.terminal.toLowerCase()}-${space.code.toLowerCase()}-demo`;
      const tenant = await prisma.tenant.upsert({ where: { slug }, update: { name: space.tenant.name, description: space.description, status: space.tenant.status }, create: { slug, name: space.tenant.name, description: space.description, status: space.tenant.status } });
      const assignment = await prisma.spaceAssignment.findFirst({ where: { spaceId: spaceRow.id, tenantId: tenant.id, active: true } });
      if (!assignment) await prisma.spaceAssignment.create({ data: { spaceId: spaceRow.id, tenantId: tenant.id, active: true } });
    } else {
      const categoryId = categoryRows.get(space.category)?.id ?? fallbackCategoryId;
      await prisma.facility.upsert({
        where: { code: `${space.code}-POI` },
        update: { name: space.label, description: space.description, status: space.status },
        create: { floorId: floorRows.get(space.floorId)!.id, spaceId: spaceRow.id, categoryId, anchorNodeId: nodeRows.get(space.anchorNodeId)!.id, code: `${space.code}-POI`, name: space.label, description: space.description, status: space.status },
      });
    }
  }

  const users = [
    { email: "superadmin@juanda-airport.local", name: "Super Administrator Juanda", role: "SUPER_ADMIN" as const },
    { email: "admin.komersil@juanda-airport.local", name: "Admin Komersil Juanda", role: "AIRPORT_ADMIN" as const },
  ];
  for (const user of users) await prisma.user.upsert({ where: { email: user.email }, update: { passwordHash, name: user.name, role: user.role }, create: { ...user, passwordHash } });

  for (const location of qrLocations) await prisma.qRLocation.upsert({ where: { locationId: location.locationId }, update: { label: location.label }, create: { locationId: location.locationId, label: location.label, floorId: floorRows.get(location.floorId)!.id, nodeId: nodeRows.get(location.nodeId)!.id, isMock: true } });

  console.info("Seed completed with DEMO data only. No location is claimed as official Juanda data.");
}

main().finally(() => prisma.$disconnect());

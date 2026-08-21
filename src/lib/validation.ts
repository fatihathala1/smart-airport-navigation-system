import { z } from "zod";

const webUrl = z.url().max(2_048).refine((value) => value.startsWith("https://") || value.startsWith("http://"), "URL harus menggunakan HTTP atau HTTPS");
const optionalUrl = z.union([webUrl, z.literal(""), z.null()]).optional();
export const routeRequestSchema = z.object({
  startNodeId: z.string().trim().min(1).max(100),
  endNodeId: z.string().trim().min(1).max(100),
  accessibleOnly: z.boolean().optional().default(false),
  walkingSpeedMetersPerMinute: z.number().min(40).max(110).optional(),
});
export const tenantUpdateSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().min(1).max(2_000).nullable().optional(),
  logoUrl: optionalUrl,
  photoUrl: optionalUrl,
  contact: z.string().trim().max(160).nullable().optional(),
  website: optionalUrl,
  status: z.enum(["ACTIVE", "INACTIVE", "TEMPORARILY_CLOSED"]).optional(),
}).strict();
export const imageUploadPolicy = { allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"] as const, maxBytes: 5 * 1024 * 1024 };

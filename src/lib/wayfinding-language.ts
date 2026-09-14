import type { LanguageCode } from "@/store/mapStore";
import type { MapSpace } from "@/types";

const categoryLabels: Record<string, { ID: string; EN: string }> = {
  all: { ID: "Semua", EN: "All" },
  entrance: { ID: "Pintu Masuk", EN: "Entrance" },
  office: { ID: "Kantor & Layanan", EN: "Offices & Services" },
  food: { ID: "Makanan & Minuman", EN: "Food & Beverage" },
  shop: { ID: "Toko & Fashion", EN: "Shops & Fashion" },
  prayer: { ID: "Musala", EN: "Prayer Room" },
  restroom: { ID: "Toilet", EN: "Restrooms" },
  atm: { ID: "ATM", EN: "ATMs" },
  lounge: { ID: "Lounge", EN: "Lounges" },
  assistance: { ID: "Bantuan", EN: "Assistance" },
};

const officeNames: Record<string, string> = {
  "Kantor Operasional Apron": "Apron Operations Office",
  "Kantor Administrasi Terminal": "Terminal Administration Office",
  "Kantor Layanan Maskapai": "Airline Service Office",
  "Kantor Keamanan Penerbangan": "Airport Security Office",
  "Kantor Informasi Bandara": "Airport Information Office",
  "Kantor Pengelola Fasilitas": "Facility Management Office",
  "Kantor Operasional Bagasi": "Baggage Operations Office",
  "Kantor Pelayanan Penumpang": "Passenger Service Office",
  "Kantor Koordinasi Gate": "Gate Coordination Office",
  "Kantor Pengendali Terminal": "Terminal Control Office",
  "Kantor Teknik Gedung": "Building Maintenance Office",
  "Kantor Kebersihan Terminal": "Terminal Cleaning Office",
};

export function getCategoryLabel(categoryId: string, lang: LanguageCode) {
  return categoryLabels[categoryId]?.[lang] ?? categoryId;
}

export function getSpaceLabel(space: MapSpace, lang: LanguageCode) {
  const label = space.tenant?.name ?? space.label;
  if (lang === "ID") return label;

  const entranceMatch = label.match(/^Pintu Masuk T(\d)$/);
  if (entranceMatch) return `Terminal ${entranceMatch[1]} Entrance`;

  if (label.startsWith("Mushola ")) {
    return label.replace(/^Mushola /, "Prayer Room ");
  }

  for (const [indonesian, english] of Object.entries(officeNames)) {
    if (label.startsWith(indonesian)) {
      return label.replace(indonesian, english);
    }
  }

  return label;
}

export function getSpaceDescription(space: MapSpace, lang: LanguageCode) {
  if (lang === "ID") return space.description;

  if (space.category === "entrance") return "The starting point for terminal navigation.";
  if (space.category === "office") return "Airport operations and service office.";
  if (space.category === "food") return "Food and drink outlet.";
  if (space.category === "shop") return "Clothing and accessories shop.";
  if (space.category === "prayer") return "Prayer room.";
  return space.description;
}

export function getQrLocationLabel(label: string, lang: LanguageCode) {
  if (lang === "ID") return label;
  const entranceMatch = label.match(/^Pintu Masuk T(\d)$/);
  return entranceMatch ? `Terminal ${entranceMatch[1]} Entrance` : label;
}

export function getRouteInstruction(instruction: string, lang: LanguageCode) {
  if (lang === "ID") return instruction;

  return instruction
    .replace(/^Gunakan tangga/, "Use the stairs")
    .replace(/^Gunakan lift/, "Use the elevator")
    .replace(/^Gunakan escalator/, "Use the escalator")
    .replace(/ dari /, " from ")
    .replace(/ ke /, " to ")
    .replace(/Lantai (\d)/g, "Floor $1");
}

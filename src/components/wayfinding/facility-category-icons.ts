import {
  Banknote,
  Building2,
  CircleHelp,
  Compass,
  MapPin,
  ShoppingBag,
  Sofa,
  Sparkles,
  Toilet,
  Utensils,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { poiCategoryIds } from "@/lib/facility-search";

type FacilityCategoryId = (typeof poiCategoryIds)[number] | "entrance";

export const facilityCategoryIcons: Record<FacilityCategoryId, LucideIcon> = {
  all: Sparkles,
  entrance: MapPin,
  office: Building2,
  food: Utensils,
  shop: ShoppingBag,
  restroom: Toilet,
  prayer: Compass,
  atm: Banknote,
  lounge: Sofa,
  assistance: CircleHelp,
};

export function getFacilityCategoryIcon(category: string): LucideIcon | undefined {
  if (!Object.prototype.hasOwnProperty.call(facilityCategoryIcons, category)) return undefined;
  return facilityCategoryIcons[category as FacilityCategoryId];
}

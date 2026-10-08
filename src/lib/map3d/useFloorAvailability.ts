"use client";

import { useEffect, useState } from "react";
import {
  EMPTY_FLOOR_AVAILABILITY,
  FLOOR_DEFINITIONS,
  probeFloorModel,
  type FloorAvailability,
  type FloorView,
} from "@/lib/map3d/floors";

/** Memeriksa file GLB mana yang sudah ada di server. `ready` false selama pemeriksaan berjalan. */
export function useFloorAvailability() {
  const [availability, setAvailability] = useState<FloorAvailability>(EMPTY_FLOOR_AVAILABILITY);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const views = Object.keys(FLOOR_DEFINITIONS) as FloorView[];
    Promise.all(views.map((view) => probeFloorModel(FLOOR_DEFINITIONS[view].candidates, controller.signal))).then((urls) => {
      if (controller.signal.aborted) return;
      setAvailability(Object.fromEntries(views.map((view, index) => [view, urls[index]])) as FloorAvailability);
      setReady(true);
    });
    return () => controller.abort();
  }, []);

  return { availability, ready };
}

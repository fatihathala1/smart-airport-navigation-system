"use client";

import { useCallback, useEffect, useState } from "react";

export type PassengerLocationStatus =
  | "checking"
  | "tracking"
  | "denied"
  | "unavailable"
  | "timeout";

export type PassengerLocationReading = {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
  timestamp: number;
};

export function usePassengerGeolocation() {
  const [status, setStatus] = useState<PassengerLocationStatus>("checking");
  const [reading, setReading] = useState<PassengerLocationReading | null>(null);
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => {
    setStatus("checking");
    setAttempt((value) => value + 1);
  }, []);

  useEffect(() => {
    if (!window.isSecureContext || !("geolocation" in navigator)) {
      const frame = window.requestAnimationFrame(() => setStatus("unavailable"));
      return () => window.cancelAnimationFrame(frame);
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setReading({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          timestamp: position.timestamp,
        });
        setStatus("tracking");
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) setStatus("denied");
        else if (error.code === error.TIMEOUT) setStatus("timeout");
        else setStatus("unavailable");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 3_000,
        timeout: 15_000,
      },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [attempt]);

  return { status, reading, retry };
}

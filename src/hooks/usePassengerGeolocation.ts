"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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
  const samplesRef = useRef<PassengerLocationReading[]>([]);

  const refresh = useCallback(() => {
    samplesRef.current = [];
    setReading(null);
    setStatus("checking");
    setAttempt((value) => value + 1);
  }, []);

  const retry = refresh;

  useEffect(() => {
    if (!window.isSecureContext || !("geolocation" in navigator)) {
      const frame = window.requestAnimationFrame(() => setStatus("unavailable"));
      return () => window.cancelAnimationFrame(frame);
    }

    const acceptPosition = (position: GeolocationPosition) => {
        const next: PassengerLocationReading = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          timestamp: position.timestamp,
        };
        // GPS indoor sering mengirim loncatan besar. Abaikan pembacaan yang
        // terlalu kasar atau tidak masuk akal dibanding sampel sebelumnya.
        if (!Number.isFinite(next.latitude) || !Number.isFinite(next.longitude) || next.accuracy > 150) return;
        const previous = samplesRef.current.at(-1);
        if (previous) {
          const dLat = (next.latitude - previous.latitude) * 111_320;
          const dLon = (next.longitude - previous.longitude) * 111_320 * Math.cos(next.latitude * Math.PI / 180);
          const jumpMeters = Math.hypot(dLat, dLon);
          const elapsedSeconds = Math.max(0.5, (next.timestamp - previous.timestamp) / 1000);
          if (jumpMeters > Math.max(45, next.accuracy * 1.5) && jumpMeters / elapsedSeconds > 8) return;
        }
        samplesRef.current = [...samplesRef.current.slice(-4), next];
        const samples = samplesRef.current;
        if (samples.length < 3) {
          setStatus("checking");
          return;
        }
        const latitude = samples.reduce((sum, sample) => sum + sample.latitude, 0) / samples.length;
        const longitude = samples.reduce((sum, sample) => sum + sample.longitude, 0) / samples.length;
        setReading({ ...next, latitude, longitude, accuracy: Math.max(next.accuracy, 12) });
        setStatus("tracking");
      };
    const handleError = (error: GeolocationPositionError) => {
        if (error.code === error.PERMISSION_DENIED) setStatus("denied");
        else if (error.code === error.TIMEOUT) setStatus("timeout");
        else setStatus("unavailable");
      };
    const watchId = navigator.geolocation.watchPosition(
      acceptPosition,
      handleError,
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 20_000,
      },
    );
    navigator.geolocation.getCurrentPosition(acceptPosition, handleError, {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 20_000,
    });
    return () => navigator.geolocation.clearWatch(watchId);
  }, [attempt]);

  return { status, reading, retry, refresh };
}

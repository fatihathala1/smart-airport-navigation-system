"use client";

import { useEffect, useRef, useState } from "react";
import { DepartureList } from "./DepartureList";
import { useMapStore } from "@/store/mapStore";

type GateAnswer = "yes" | "no" | null;

type PassengerRoadmapProps = {
  /** false selama model dan grid jalan belum siap. */
  routeReady?: boolean;
  /** Nomor gate yang ada pada model Lantai 2. */
  gates?: readonly number[];
  onRouteToDeparture?: (departure: number) => void;
  /** `departure` adalah area check-in yang dipilih, dipakai sebagai titik awal. */
  onRouteToGate?: (gate: number, departure: number | null) => void;
};

/** Ambil nomor gate dari isian bebas: "5", "Gate 5", "G05". */
export function parseGateNumber(value: string): number | null {
  const match = /\d+/.exec(value);
  if (!match) return null;
  const gate = Number.parseInt(match[0], 10);
  return Number.isFinite(gate) && gate > 0 ? gate : null;
}

function gateRangeText(gates: readonly number[]) {
  if (!gates.length) return "";
  const sorted = [...gates].sort((left, right) => left - right);
  return `${sorted[0]}–${sorted.at(-1)}`;
}

export function PassengerRoadmap({ routeReady = false, gates = [], onRouteToDeparture, onRouteToGate }: PassengerRoadmapProps) {
  const lang = useMapStore((state) => state.lang);
  const en = lang === "EN";
  const [open, setOpen] = useState(false);
  const [departure, setDeparture] = useState<number | null>(null);
  const [gateAnswer, setGateAnswer] = useState<GateAnswer>(null);
  const [gate, setGate] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const gateNumber = parseGateNumber(gate);
  const gateOnMap = gateNumber !== null && gates.includes(gateNumber);

  useEffect(() => {
    if (!open) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  // Panel ditutup supaya rute di peta langsung terlihat.
  const showRoute = (run: () => void) => {
    run();
    setOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <div className="passenger-map-guide">
      <button
        ref={triggerRef}
        type="button"
        className="passenger-map-link"
        aria-expanded={open}
        aria-controls="passenger-roadmap"
        onClick={() => setOpen((current) => !current)}
      >
        {en ? "Are you a passenger?" : "Apakah kamu penumpang?"}
        <span aria-hidden="true">{open ? "−" : "+"}</span>
      </button>
      <section className="passenger-roadmap" id="passenger-roadmap" hidden={!open} aria-labelledby="passenger-roadmap-title">
      <div className="passenger-roadmap-inner">
        <div className="passenger-roadmap-intro">
          <span className="passenger-roadmap-kicker">Panduan penumpang · Terminal 1</span>
          <h2 id="passenger-roadmap-title">{en ? "From check-in to your gate" : "Dari check-in sampai ke gate"}</h2>
          <p>{en ? "Follow the departure sequence. Departure is a check-in area, not a counter number." : "Ikuti urutan keberangkatan. Area Departure adalah area check-in, bukan nomor loket."}</p>
          <div className="passenger-roadmap-summary" aria-live="polite">
            <span>{en ? "Your journey plan" : "Rencana perjalananmu"}</span>
            <strong>{departure ? `Departure ${departure}` : (en ? "Choose a Departure area" : "Pilih area Departure")}</strong>
            <span>{gateAnswer === "yes" && gateNumber !== null ? `Gate ${gateNumber}` : "Nomor gate menunggu informasi di tiket"}</span>
          </div>
        </div>

        <ol className="passenger-roadmap-steps">
          <li className="passenger-roadmap-step">
            <span className="passenger-step-number" aria-hidden="true">01</span>
            <div>
              <h3>{en ? "Go to your check-in area" : "Menuju area check-in"}</h3>
              <p>{en ? "Which Departure area will you use for check-in?" : "Di area Departure berapa kamu akan check-in untuk mengambil tiket?"}</p>
              <DepartureList value={departure} onChange={setDeparture} />
              {departure !== null && onRouteToDeparture && (
                <button
                  type="button"
                  className="passenger-route-button"
                  disabled={!routeReady}
                  onClick={() => showRoute(() => onRouteToDeparture(departure))}
                >
                  {en ? "Show route to Departure" : "Tunjukkan rute ke Departure"} {departure}
                </button>
              )}
              {departure !== null && !routeReady && <p className="passenger-data-note">Peta masih dimuat. Rute dapat dibuka setelah peta siap.</p>}
            </div>
          </li>

          <li className="passenger-roadmap-step">
            <span className="passenger-step-number" aria-hidden="true">02</span>
            <div>
              <h3>{en ? "Check your gate information" : "Cek informasi gate"}</h3>
              <p>{en ? "After check-in, go to the second floor. Your gate number is on the ticket or airport display." : "Setelah mendapat tiket, naik ke lantai 2. Nomor gate tercantum di tiket atau layar informasi bandara."}</p>
              <fieldset className="passenger-gate-fieldset">
                <legend>{en ? "Do you have your gate information?" : "Sudah mendapatkan informasi gate?"}</legend>
                <div className="passenger-gate-options">
                  <label className={gateAnswer === "yes" ? "is-selected" : ""}>
                    <input type="radio" name="passenger-gate-known" checked={gateAnswer === "yes"} onChange={() => setGateAnswer("yes")} />
                    {en ? "Yes" : "Sudah"}
                  </label>
                  <label className={gateAnswer === "no" ? "is-selected" : ""}>
                    <input type="radio" name="passenger-gate-known" checked={gateAnswer === "no"} onChange={() => setGateAnswer("no")} />
                    {en ? "Not yet" : "Belum"}
                  </label>
                </div>
              </fieldset>
              {gateAnswer === "yes" && (
                <label className="passenger-gate-input">
                  {en ? "Which gate?" : "Gate berapa?"}
                  <input type="text" inputMode="numeric" value={gate} onChange={(event) => setGate(event.target.value)} placeholder={en ? "Enter the gate number from your ticket" : "Masukkan nomor gate dari tiket"} maxLength={20} />
                </label>
              )}
              {gateAnswer === "yes" && gateOnMap && onRouteToGate && (
                <button
                  type="button"
                  className="passenger-route-button"
                  disabled={!routeReady}
                  onClick={() => showRoute(() => onRouteToGate(gateNumber, departure))}
                >
                  {en ? "Show route to Gate" : "Tunjukkan rute ke Gate"} {gateNumber}
                  <small>{departure ? `Dari Departure ${departure}, naik ke Lantai 2` : "Naik ke Lantai 2"}</small>
                </button>
              )}
              {gateAnswer === "yes" && gate.trim() !== "" && !gateOnMap && (
                <p className="passenger-gate-hint" role="status">
                  {gates.length
                    ? `Gate ${gateNumber ?? gate.trim()} tidak ada di peta Lantai 2. Gate yang tersedia: ${gateRangeText(gates)}.`
                    : "Peta Lantai 2 belum tersedia, jadi rute ke gate belum bisa ditampilkan."}
                </p>
              )}
              {gateAnswer === "no" && <p className="passenger-gate-hint" role="status">Lanjutkan check-in dahulu, lalu lihat nomor gate pada tiket atau layar informasi.</p>}
            </div>
          </li>

          <li className="passenger-roadmap-step passenger-roadmap-finish">
            <span className="passenger-step-number" aria-hidden="true">03</span>
            <div>
              <h3>{en ? "Ready to depart" : "Siap berangkat"}</h3>
              <p>{en ? "Enjoy your journey. Recheck the boarding time and gate number on your ticket or airport display." : "Selamat menikmati keberangkatan Anda. Pastikan kembali waktu boarding dan nomor gate pada tiket atau layar informasi."}</p>
            </div>
          </li>
        </ol>
      </div>
      </section>
    </div>
  );
}

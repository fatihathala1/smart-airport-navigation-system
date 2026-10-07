"use client";

import { useEffect, useRef, useState } from "react";
import { DepartureList } from "./DepartureList";

type GateAnswer = "yes" | "no" | null;

export function PassengerRoadmap() {
  const [open, setOpen] = useState(false);
  const [departure, setDeparture] = useState<number | null>(null);
  const [gateAnswer, setGateAnswer] = useState<GateAnswer>(null);
  const [gate, setGate] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);

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
        Apakah kamu penumpang?
        <span aria-hidden="true">{open ? "−" : "+"}</span>
      </button>
      <section className="passenger-roadmap" id="passenger-roadmap" hidden={!open} aria-labelledby="passenger-roadmap-title">
      <div className="passenger-roadmap-inner">
        <div className="passenger-roadmap-intro">
          <span className="passenger-roadmap-kicker">Panduan penumpang · Terminal 1</span>
          <h2 id="passenger-roadmap-title">Dari check-in sampai ke gate</h2>
          <p>Ikuti urutan keberangkatan. Area Departure adalah area check-in, bukan nomor loket.</p>
          <div className="passenger-roadmap-summary" aria-live="polite">
            <span>Rencana perjalananmu</span>
            <strong>{departure ? `Departure ${departure}` : "Pilih area Departure"}</strong>
            <span>{gateAnswer === "yes" && gate.trim() ? `Gate ${gate.trim()}` : "Nomor gate menunggu informasi di tiket"}</span>
          </div>
        </div>

        <ol className="passenger-roadmap-steps">
          <li className="passenger-roadmap-step">
            <span className="passenger-step-number" aria-hidden="true">01</span>
            <div>
              <h3>Menuju area check-in</h3>
              <p>Di area Departure berapa kamu akan check-in untuk mengambil tiket?</p>
              <DepartureList value={departure} onChange={setDeparture} />
              <p className="passenger-data-note">Pilihan area ini belum terhubung ke peta 3D.</p>
            </div>
          </li>

          <li className="passenger-roadmap-step">
            <span className="passenger-step-number" aria-hidden="true">02</span>
            <div>
              <h3>Cek informasi gate</h3>
              <p>Setelah mendapat tiket, naik ke lantai 2. Nomor gate tercantum di tiket atau layar informasi bandara.</p>
              <fieldset className="passenger-gate-fieldset">
                <legend>Sudah mendapatkan informasi gate?</legend>
                <div className="passenger-gate-options">
                  <label className={gateAnswer === "yes" ? "is-selected" : ""}>
                    <input type="radio" name="passenger-gate-known" checked={gateAnswer === "yes"} onChange={() => setGateAnswer("yes")} />
                    Sudah
                  </label>
                  <label className={gateAnswer === "no" ? "is-selected" : ""}>
                    <input type="radio" name="passenger-gate-known" checked={gateAnswer === "no"} onChange={() => setGateAnswer("no")} />
                    Belum
                  </label>
                </div>
              </fieldset>
              {gateAnswer === "yes" && (
                <label className="passenger-gate-input">
                  Gate berapa?
                  <input type="text" value={gate} onChange={(event) => setGate(event.target.value)} placeholder="Masukkan nomor gate dari tiket" maxLength={20} />
                </label>
              )}
              {gateAnswer === "no" && <p className="passenger-gate-hint" role="status">Lanjutkan check-in dahulu, lalu lihat nomor gate pada tiket atau layar informasi.</p>}
              <p className="passenger-data-note">Peta dan rute menuju gate di lantai 2 belum tersedia.</p>
            </div>
          </li>

          <li className="passenger-roadmap-step passenger-roadmap-finish">
            <span className="passenger-step-number" aria-hidden="true">03</span>
            <div>
              <h3>Siap berangkat</h3>
              <p>Selamat menikmati keberangkatan Anda. Pastikan kembali waktu boarding dan nomor gate pada tiket atau layar informasi.</p>
            </div>
          </li>
        </ol>
      </div>
      </section>
    </div>
  );
}

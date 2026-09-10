"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Banknote, Building2, CircleHelp, Compass, Sofa, Toilet, Utensils, X } from "lucide-react";
import { spaces } from "@/data/demo-wayfinding";
import { facilityShortcuts, findFacilities, mapSearchHref } from "@/lib/facility-search";
import { useMapStore } from "@/store/mapStore";
import type { TerminalCode } from "@/types";
import styles from "./FacilityShortcuts.module.css";

const icons = { restroom: Toilet, prayer: Compass, food: Utensils, atm: Banknote, lounge: Sofa, assistance: CircleHelp };

export function FacilityShortcuts() {
  const store = useMapStore();
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [pending, setPending] = useState("all");
  const lang = store.lang;
  const open = (terminal: TerminalCode, category: string) => {
    store.setTerminal(terminal);
    dialog.current?.close();
    router.push(mapSearchHref(terminal, category));
  };

  return (
    <section className={styles.section} id="facility-shortcuts" aria-labelledby="facility-title" data-scroll-reveal>
      <div className={styles.heading} data-reveal-child>
        <div>
          <span className={styles.eyebrow}>{lang === "ID" ? "FASILITAS BANDARA" : "AIRPORT FACILITIES"}</span>
          <h2 id="facility-title">{lang === "ID" ? "Mau cari apa?" : "What are you looking for?"}</h2>
          <p>{lang === "ID" ? "Pilih fasilitas yang kamu butuhkan, lalu temukan lokasinya di peta terminal." : "Choose a facility, then find its location on the terminal map."}</p>
        </div>
        <label className={styles.terminal}>
          <Building2 size={19} aria-hidden="true" />
          <span className="sr-only">{lang === "ID" ? "Terminal fasilitas" : "Facility terminal"}</span>
          <select value={store.terminalSelected ? store.terminal : ""} onChange={(event) => store.setTerminal(event.target.value as TerminalCode)}>
            <option value="" disabled>{lang === "ID" ? "Pilih terminal" : "Choose terminal"}</option>
            <option value="T1">Terminal 1</option><option value="T2">Terminal 2</option>
          </select>
        </label>
      </div>
      <div className={styles.grid} data-reveal-child>
        {facilityShortcuts.map((item) => {
          const Icon = icons[item.id];
          const count = findFacilities(spaces, store.terminal, item.id).length;
          return (
            <button key={item.id} type="button" className={styles.card} onClick={() => {
              if (store.terminalSelected) open(store.terminal, item.id);
              else { setPending(item.id); dialog.current?.showModal(); }
            }}>
              <span className={styles.icon}><Icon size={26} aria-hidden="true" /></span>
              <strong>{item[lang]}</strong>
              <span className={styles.description}>{!store.terminalSelected
                ? (lang === "ID" ? "Pilih terminal untuk melihat lokasi" : "Choose a terminal to see locations")
                : count ? `${count} ${lang === "ID" ? "lokasi di" : "locations in"} ${store.terminal}`
                : (lang === "ID" ? "Lokasi belum tersedia" : "Locations not yet available")}</span>
              <ArrowRight size={18} className={styles.arrow} aria-hidden="true" />
            </button>
          );
        })}
      </div>
      <p className={styles.note} data-reveal-child>{lang === "ID" ? "Pilih lokasi tujuan di peta, lalu tentukan titik awal untuk mendapatkan petunjuk arah." : "Select a destination on the map, then choose your starting point for directions."}</p>
      <dialog ref={dialog} className={styles.dialog} aria-labelledby="terminal-dialog-title" onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
        <button type="button" className={styles.close} onClick={() => dialog.current?.close()} aria-label={lang === "ID" ? "Tutup pilihan terminal" : "Close terminal selection"}><X size={20} /></button>
        <span className={styles.eyebrow}>{facilityShortcuts.find((item) => item.id === pending)?.[lang]}</span>
        <h2 id="terminal-dialog-title">{lang === "ID" ? "Kamu di terminal mana?" : "Which terminal are you in?"}</h2>
        <p>{lang === "ID" ? "Kami akan menampilkan fasilitas di terminal pilihanmu." : "We will show facilities in your chosen terminal."}</p>
        {(["T1", "T2"] as const).map((terminal) => <button type="button" className={styles.terminalOption} key={terminal} onClick={() => open(terminal, pending)}><Building2 size={22} /> Terminal {terminal.slice(1)} <ArrowRight size={18} /></button>)}
      </dialog>
    </section>
  );
}

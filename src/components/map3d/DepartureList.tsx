"use client";

import { DEPARTURE_AREAS, formatCounterRange } from "@/lib/map3d/departures";
import { AirlineLogo } from "./AirlineLogo";

type DepartureListProps = {
  value: number | null;
  onChange: (departure: number) => void;
};

export function DepartureList({ value, onChange }: DepartureListProps) {
  return (
    <fieldset className={"departure-fieldset"}>
      <legend className={"departure-legend"}>Pilih area Departure</legend>
      <ul className={"departure-list"}>
        {DEPARTURE_AREAS.map((area) => {
          const selected = value === area.number;
          return (
            <li key={area.number}>
              <label className={["departure-card", selected ? "is-selected" : "", area.active ? "" : "is-inactive"].filter(Boolean).join(" ")}>
                <input
                  className={"departure-radio"}
                  type="radio"
                  name="passenger-departure"
                  value={area.number}
                  checked={selected}
                  disabled={!area.active}
                  onChange={() => onChange(area.number)}
                />
                <span className={"departure-head"}>
                  <strong>Departure {area.number}</strong>
                  <span className={"departure-range"}>{formatCounterRange(area.counters)}</span>
                </span>
                {area.note && <span className={"departure-note"}>{area.note}</span>}
                {!area.active && <span className={"departure-note"}>Tidak beroperasi</span>}
                {area.airlines.length > 0 && (
                  <ul className={"departure-airlines"} aria-label={`Maskapai Departure ${area.number}`}>
                    {area.airlines.map((airline) => (
                      <li key={airline.slug} className={"departure-airline"}>
                        <AirlineLogo slug={airline.slug} name={airline.name} />
                        <span className={"departure-airline-name"}>{airline.name}</span>
                        {airline.counters && <span className={"departure-airline-range"}>{airline.counters.from}–{airline.counters.to}</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </label>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}

"use client";

import { useState } from "react";
import HistoricalBars from "./historical-bars";
import YearDailyChart from "./year-daily-chart";
import {
  HISTORICAL_APRIL,
  APRIL_DAILY_HISTORY,
  KMA_VERIFIED_YEARS,
} from "./data";

type HistoryRow = (typeof HISTORICAL_APRIL)[number];

export default function PastSection() {
  // Default expanded year: the most recent one the reader would recognize
  const [selected, setSelected] = useState<string | null>(null);

  const selectedYear = selected ? parseInt(selected, 10) : null;
  const selectedRow: HistoryRow | undefined = selectedYear
    ? HISTORICAL_APRIL.find((h) => h.year === selectedYear)
    : undefined;
  const selectedDaily = selectedYear ? APRIL_DAILY_HISTORY[selectedYear] : null;

  return (
    <div>
      <HistoricalBars
        data={HISTORICAL_APRIL.map((h) => ({
          label: String(h.year),
          value: h.totalMm,
          detail: `máx ${h.maxDailyDate.slice(5)} · ${h.maxDailyMm} mm`,
          highlight: h.totalMm < 40,
        }))}
        unit="mm"
        threshold={{ value: 40, label: "40 mm" }}
        max={140}
        splitTone={{
          above: "rgba(var(--steel-blue-rgb), 0.35)",
          below: "rgba(91, 170, 124, 0.55)",
        }}
        activeLabel={selected ?? undefined}
        onBarClick={(label) => {
          setSelected((prev) => (prev === label ? null : label));
        }}
      />

      {!selected && (
        <p
          style={{
            marginTop: 10,
            fontFamily: "var(--font-jetbrains), monospace",
            fontSize: 10,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
            textAlign: "center",
          }}
        >
          Click sobre un año para ver el detalle diario
        </p>
      )}

      {selectedRow && selectedDaily && (
        <YearDailyChart
          year={selectedRow.year}
          daily={selectedDaily}
          monthlyTotal={selectedRow.totalMm}
          maxDailyDate={selectedRow.maxDailyDate}
          maxDailyValue={selectedRow.maxDailyMm}
          note={
            KMA_VERIFIED_YEARS.has(selectedRow.year)
              ? "Datos diarios oficiales de KMA (estación 108 Seúl)."
              : "Total mensual oficial de KMA. Detalle diario estimado vía ERA5 reanalysis — puede diferir del oficial por unos milímetros."
          }
        />
      )}
    </div>
  );
}


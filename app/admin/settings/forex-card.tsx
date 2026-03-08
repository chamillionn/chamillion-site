"use client";

import { useState, useTransition } from "react";
import { useToast } from "@/components/admin-toast";
import { refreshEurUsdRate } from "./actions";

interface Props {
  initialRate: number | null;
  initialUpdatedAt: string | null;
}

export default function ForexCard({ initialRate, initialUpdatedAt }: Props) {
  const { toast } = useToast();
  const [rate, setRate] = useState(initialRate);
  const [updatedAt, setUpdatedAt] = useState(initialUpdatedAt);
  const [isPending, startTransition] = useTransition();

  function handleRefresh() {
    startTransition(async () => {
      const result = await refreshEurUsdRate();
      if (result.error) {
        toast(result.error, "error");
      } else if (result.rate) {
        setRate(result.rate);
        setUpdatedAt(new Date().toISOString());
        toast(`EUR/USD actualizado: ${result.rate.toFixed(4)}`, "success");
      }
    });
  }

  const formattedDate = updatedAt
    ? new Date(updatedAt).toLocaleString("es-ES", {
        day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
      })
    : null;

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        padding: "20px 24px",
        maxWidth: 480,
        marginTop: 16,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Tipo de cambio EUR/USD</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>
            Los valores de las APIs (USD) se convierten a EUR en cada sync.
            {" "}Fuente: Banco Central Europeo.
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isPending}
          style={{
            background: "none",
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: "6px 12px",
            cursor: isPending ? "wait" : "pointer",
            color: "var(--text-secondary)",
            fontSize: 12,
            fontFamily: "var(--font-dm-mono), monospace",
            transition: "border-color 0.2s, color 0.2s",
            flexShrink: 0,
            opacity: isPending ? 0.5 : 1,
          }}
        >
          {isPending ? "..." : "Actualizar"}
        </button>
      </div>

      <div
        style={{
          marginTop: 12,
          display: "flex",
          alignItems: "baseline",
          gap: 10,
          fontFamily: "var(--font-dm-mono), monospace",
        }}
      >
        <span style={{ fontSize: 20, fontWeight: 600, color: "var(--text-primary)" }}>
          {rate ? rate.toFixed(4) : "—"}
        </span>
        {formattedDate && (
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
            {formattedDate}
          </span>
        )}
        {!rate && (
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
            Sin datos — se obtendra en el proximo sync
          </span>
        )}
      </div>
    </div>
  );
}

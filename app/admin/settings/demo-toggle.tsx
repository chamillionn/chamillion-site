"use client";

import { useState, useTransition } from "react";
import { useToast } from "@/components/admin-toast";
import { toggleDemoMode } from "./actions";

export default function DemoToggle({ initialEnabled }: { initialEnabled: boolean }) {
  const { toast } = useToast();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    const next = !enabled;
    setEnabled(next);
    startTransition(async () => {
      const result = await toggleDemoMode(next);
      if (result.error) {
        setEnabled(!next);
        toast(result.error, "error");
      } else {
        toast(next ? "Modo demo activado" : "Modo demo desactivado", "success");
      }
    });
  }

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        padding: "20px 24px",
        maxWidth: 480,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Modo Demo</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>
            Muestra datos ficticios en la homepage publica.
            Los datos reales siguen visibles en el admin.
          </div>
        </div>
        <button
          onClick={handleToggle}
          disabled={isPending}
          style={{
            position: "relative",
            width: 44,
            height: 24,
            borderRadius: 12,
            border: "none",
            cursor: isPending ? "wait" : "pointer",
            background: enabled ? "#5BAA7C" : "var(--border)",
            transition: "background 0.2s",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              position: "absolute",
              top: 2,
              left: enabled ? 22 : 2,
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: "#fff",
              transition: "left 0.2s",
            }}
          />
        </button>
      </div>
      {enabled && (
        <div
          style={{
            marginTop: 12,
            fontSize: 11,
            fontFamily: "var(--font-dm-mono), monospace",
            color: "#C9A84C",
            background: "rgba(201, 168, 76, 0.08)",
            border: "1px solid rgba(201, 168, 76, 0.2)",
            borderRadius: 6,
            padding: "6px 10px",
          }}
        >
          La homepage muestra datos demo. Los visitantes ven el portfolio ficticio.
        </div>
      )}
    </div>
  );
}

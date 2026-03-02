"use client";

import { useState } from "react";
import DemoToggle from "./demo-toggle";
import DebugView from "../debug/debug-view";
import crudStyles from "../crud.module.css";

interface Props {
  demoEnabled: boolean;
}

type Tab = "general" | "database";

export default function SettingsTabs({ demoEnabled }: Props) {
  const [tab, setTab] = useState<Tab>("general");
  const [debugData, setDebugData] = useState<{
    tables: Record<string, { rows: Record<string, unknown>[]; count: number }>;
    views: Record<string, { rows: Record<string, unknown>[]; count: number }>;
    env: { supabaseUrl: string; isDev: boolean };
  } | null>(null);
  const [debugLoading, setDebugLoading] = useState(false);

  async function loadDebug() {
    setTab("database");
    if (debugData) return;
    setDebugLoading(true);
    try {
      const res = await fetch("/api/debug");
      const data = await res.json();
      setDebugData(data);
    } catch {
      setDebugData(null);
    }
    setDebugLoading(false);
  }

  return (
    <div>
      {/* Tab bar */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24 }}>
        <button
          onClick={() => setTab("general")}
          className={crudStyles.btnSecondary}
          style={tab === "general" ? { borderColor: "var(--steel-blue)", color: "var(--steel-blue)" } : undefined}
        >
          General
        </button>
        <button
          onClick={loadDebug}
          className={crudStyles.btnSecondary}
          style={tab === "database" ? { borderColor: "var(--steel-blue)", color: "var(--steel-blue)" } : undefined}
        >
          Base de datos
        </button>
      </div>

      {/* General tab */}
      {tab === "general" && <DemoToggle initialEnabled={demoEnabled} />}

      {/* Database tab */}
      {tab === "database" && debugLoading && (
        <div style={{ padding: 40, textAlign: "center", fontFamily: "var(--font-dm-mono), monospace", fontSize: 12, color: "var(--text-muted)" }}>
          Cargando datos...
        </div>
      )}
      {tab === "database" && !debugLoading && debugData && (
        <DebugView
          tables={debugData.tables}
          views={debugData.views}
          env={debugData.env}
        />
      )}
      {tab === "database" && !debugLoading && !debugData && (
        <div style={{ padding: 40, textAlign: "center", fontFamily: "var(--font-dm-mono), monospace", fontSize: 12, color: "var(--text-muted)" }}>
          Error al cargar datos
        </div>
      )}
    </div>
  );
}

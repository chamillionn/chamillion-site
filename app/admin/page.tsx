import { requireAdmin } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { getPortfolioSummary, getPositions, getPlatforms, isDemoMode } from "@/lib/supabase/queries";
import Dashboard from "./dashboard";

export default async function AdminDashboard() {
  const admin = await requireAdmin();
  if (!admin) redirect("/login");

  const dc = admin.dataClient;
  const [summary, positions, platforms, demo] = await Promise.all([
    getPortfolioSummary(dc),
    getPositions(dc),
    getPlatforms(dc),
    isDemoMode(dc),
  ]);

  return (
    <>
      {demo && (
        <div
          style={{
            fontFamily: "var(--font-dm-mono), monospace",
            fontSize: 12,
            padding: "8px 14px",
            background: "rgba(201, 168, 76, 0.08)",
            border: "1px solid rgba(201, 168, 76, 0.2)",
            borderRadius: 8,
            color: "#C9A84C",
            marginBottom: 16,
          }}
        >
          Modo demo activo — la homepage muestra datos ficticios.{" "}
          <a href="/admin/settings" style={{ color: "#C9A84C", textDecoration: "underline" }}>
            Desactivar
          </a>
        </div>
      )}
      <Dashboard
        summary={summary}
        positions={positions}
        platforms={platforms}
      />
    </>
  );
}

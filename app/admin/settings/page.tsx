import { requireAdmin } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { isDemoMode } from "@/lib/supabase/queries";
import SettingsTabs from "./settings-tabs";
import crudStyles from "../crud.module.css";

export default async function SettingsPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/login");

  const demoEnabled = await isDemoMode(admin.dataClient);

  // Fetch cached EUR/USD rate + timestamp
  const { data: rateRow } = await admin.dataClient
    .from("site_settings")
    .select("value, updated_at")
    .eq("key", "eurusd_rate")
    .single();

  const eurUsdRate = typeof rateRow?.value === "number" ? rateRow.value : null;
  const eurUsdUpdatedAt = rateRow?.updated_at ?? null;

  return (
    <div>
      <h1 className={crudStyles.heading}>Ajustes</h1>
      <SettingsTabs
        demoEnabled={demoEnabled}
        eurUsdRate={eurUsdRate}
        eurUsdUpdatedAt={eurUsdUpdatedAt}
      />
    </div>
  );
}

import { requireAdmin } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { isDemoMode } from "@/lib/supabase/queries";
import SettingsTabs from "./settings-tabs";
import crudStyles from "../crud.module.css";

export default async function SettingsPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/login");

  const demoEnabled = await isDemoMode(admin.dataClient);

  return (
    <div>
      <h1 className={crudStyles.heading}>Ajustes</h1>
      <SettingsTabs demoEnabled={demoEnabled} />
    </div>
  );
}

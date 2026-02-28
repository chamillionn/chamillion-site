import { requireAdmin } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { isDemoMode } from "@/lib/supabase/queries";
import DemoToggle from "./demo-toggle";
import styles from "../page.module.css";

export default async function SettingsPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/login");

  const demoEnabled = await isDemoMode(admin.dataClient);

  return (
    <div>
      <h1 className={styles.heading}>Ajustes</h1>
      <DemoToggle initialEnabled={demoEnabled} />
    </div>
  );
}

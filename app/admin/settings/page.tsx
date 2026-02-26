import { isDemoMode } from "@/lib/supabase/queries";
import DemoToggle from "./demo-toggle";
import styles from "../page.module.css";

export default async function SettingsPage() {
  const demoEnabled = await isDemoMode();

  return (
    <div>
      <h1 className={styles.heading}>Ajustes</h1>
      <DemoToggle initialEnabled={demoEnabled} />
    </div>
  );
}

import { requireAdmin } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { getStrategies } from "@/lib/supabase/queries";
import StrategiesTable from "./strategies-table";
import styles from "../crud.module.css";

export default async function StrategiesPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/login");

  const strategies = await getStrategies(admin.dataClient);

  return (
    <div>
      <h1 className={styles.heading}>Estrategias</h1>
      <StrategiesTable strategies={strategies} />
    </div>
  );
}

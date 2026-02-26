import { getStrategies } from "@/lib/supabase/queries";
import StrategiesTable from "./strategies-table";
import styles from "../crud.module.css";

export default async function StrategiesPage() {
  const strategies = await getStrategies();

  return (
    <div>
      <h1 className={styles.heading}>Estrategias</h1>
      <StrategiesTable strategies={strategies} />
    </div>
  );
}

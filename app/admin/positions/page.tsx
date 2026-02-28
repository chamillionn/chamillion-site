import { requireAdmin } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { getAllPositions, getPlatforms, getStrategies } from "@/lib/supabase/queries";
import PositionsTable from "./positions-table";
import styles from "./page.module.css";

export default async function PositionsPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/login");

  const dc = admin.dataClient;
  const [positions, platforms, strategies] = await Promise.all([
    getAllPositions(dc),
    getPlatforms(dc),
    getStrategies(dc),
  ]);

  return (
    <div>
      <h1 className={styles.heading}>Posiciones</h1>
      <PositionsTable
        positions={positions}
        platforms={platforms}
        strategies={strategies}
      />
    </div>
  );
}

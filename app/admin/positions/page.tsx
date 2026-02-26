import { getAllPositions, getPlatforms, getStrategies } from "@/lib/supabase/queries";
import PositionsTable from "./positions-table";
import styles from "./page.module.css";

export default async function PositionsPage() {
  const [positions, platforms, strategies] = await Promise.all([
    getAllPositions(),
    getPlatforms(),
    getStrategies(),
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

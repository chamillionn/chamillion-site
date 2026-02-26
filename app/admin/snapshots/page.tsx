import { getSnapshots } from "@/lib/supabase/queries";
import SnapshotsTable from "./snapshots-table";
import crudStyles from "../crud.module.css";

export default async function SnapshotsPage() {
  const snapshots = await getSnapshots(500);

  return (
    <div>
      <h1 className={crudStyles.heading}>Historial</h1>
      <SnapshotsTable snapshots={snapshots} />
    </div>
  );
}

import { requireAdmin } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { getSnapshots } from "@/lib/supabase/queries";
import SnapshotsTable from "./snapshots-table";
import crudStyles from "../crud.module.css";

export default async function SnapshotsPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/login");

  const snapshots = await getSnapshots(500, admin.dataClient);

  return (
    <div>
      <h1 className={crudStyles.heading}>Historial</h1>
      <SnapshotsTable snapshots={snapshots} />
    </div>
  );
}

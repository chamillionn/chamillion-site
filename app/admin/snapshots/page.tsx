import { requireAdmin } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { getSnapshotsPaged, getSnapshotsForChart } from "@/lib/supabase/queries";
import SnapshotsTable from "./snapshots-table";
import crudStyles from "../crud.module.css";

const INITIAL_PAGE_SIZE = 500;

export default async function SnapshotsPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/login");

  const [pageResult, chartData] = await Promise.all([
    getSnapshotsPaged(0, INITIAL_PAGE_SIZE, admin.dataClient),
    getSnapshotsForChart(30, admin.dataClient),
  ]);

  return (
    <div>
      <h1 className={crudStyles.heading}>Historial</h1>
      <SnapshotsTable
        initialSnapshots={pageResult.rows}
        total={pageResult.total}
        pageSize={INITIAL_PAGE_SIZE}
        chartData={chartData}
      />
    </div>
  );
}

import { requireAdmin } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { getPlatforms } from "@/lib/supabase/queries";
import PlatformsTable from "./platforms-table";
import styles from "../crud.module.css";

export default async function PlatformsPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/login");

  const platforms = await getPlatforms(admin.dataClient);

  // Count positions per platform for delete warning
  const { data: counts } = await admin.dataClient
    .from("positions")
    .select("platform_id")
    .eq("is_active", true);

  const positionCounts: Record<string, number> = {};
  for (const row of counts ?? []) {
    if (row.platform_id) {
      positionCounts[row.platform_id] = (positionCounts[row.platform_id] ?? 0) + 1;
    }
  }

  return (
    <div>
      <h1 className={styles.heading}>Plataformas</h1>
      <PlatformsTable platforms={platforms} positionCounts={positionCounts} />
    </div>
  );
}

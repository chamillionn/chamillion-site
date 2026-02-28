import { requireAdmin } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { getPlatforms } from "@/lib/supabase/queries";
import PlatformsTable from "./platforms-table";
import styles from "../crud.module.css";

export default async function PlatformsPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/login");

  const platforms = await getPlatforms(admin.dataClient);

  return (
    <div>
      <h1 className={styles.heading}>Plataformas</h1>
      <PlatformsTable platforms={platforms} />
    </div>
  );
}

import { getPlatforms } from "@/lib/supabase/queries";
import PlatformsTable from "./platforms-table";
import styles from "../crud.module.css";

export default async function PlatformsPage() {
  const platforms = await getPlatforms();

  return (
    <div>
      <h1 className={styles.heading}>Plataformas</h1>
      <PlatformsTable platforms={platforms} />
    </div>
  );
}

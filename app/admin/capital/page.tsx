import { requireAdmin } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { getCapitalFlows, getCostBasis } from "@/lib/supabase/queries";
import CapitalTable from "./capital-table";
import crudStyles from "../crud.module.css";

export default async function CapitalPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/login");

  const dc = admin.dataClient;
  const [flows, costBasis] = await Promise.all([
    getCapitalFlows(undefined, dc),
    getCostBasis(dc),
  ]);

  return (
    <div>
      <h1 className={crudStyles.heading}>Capital</h1>
      <CapitalTable flows={flows} costBasis={costBasis} />
    </div>
  );
}

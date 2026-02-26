import { getCapitalFlows, getCostBasis } from "@/lib/supabase/queries";
import CapitalTable from "./capital-table";
import crudStyles from "../crud.module.css";

export default async function CapitalPage() {
  const [flows, costBasis] = await Promise.all([
    getCapitalFlows(),
    getCostBasis(),
  ]);

  return (
    <div>
      <h1 className={crudStyles.heading}>Capital</h1>
      <CapitalTable flows={flows} costBasis={costBasis} />
    </div>
  );
}

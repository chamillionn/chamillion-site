import { getPortfolioSummary, getPositions, getPlatforms } from "@/lib/supabase/queries";
import Dashboard from "./dashboard";

export default async function AdminDashboard() {
  const [summary, positions, platforms] = await Promise.all([
    getPortfolioSummary(),
    getPositions(),
    getPlatforms(),
  ]);

  return (
    <Dashboard
      summary={summary}
      positions={positions}
      platforms={platforms}
    />
  );
}

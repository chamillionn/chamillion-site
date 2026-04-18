import KronosClient from "./kronos-client";
import { requireUser } from "@/lib/supabase/auth";

export const metadata = { title: "Kronos" };

export default async function KronosPage() {
  const ctx = await requireUser();
  const isAdmin = ctx?.profile.role === "admin";
  return <KronosClient mode="member" isAdmin={isAdmin} />;
}

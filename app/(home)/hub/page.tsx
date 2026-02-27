import { requireUser } from "@/lib/supabase/auth";
import { redirect } from "next/navigation";
import HubPage from "./hub-client";

export const metadata = { title: "Hub" };

export default async function HubPageWrapper() {
  const ctx = await requireUser();
  if (!ctx) redirect("/login?next=/hub");

  return <HubPage userRole={ctx.profile.role} />;
}

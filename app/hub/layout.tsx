import { requireUser } from "@/lib/supabase/auth";
import { redirect } from "next/navigation";
import HubShell from "./hub-shell";

export const metadata = { title: { template: "%s — Hub", default: "Hub" } };

export default async function HubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await requireUser();
  if (!ctx) redirect("/login?next=/hub");

  const isFree = ctx.profile.role === "free";
  if (isFree) redirect("/suscribirse?next=/hub");

  const role = ctx.profile.role as "member" | "admin";

  return <HubShell userRole={role}>{children}</HubShell>;
}

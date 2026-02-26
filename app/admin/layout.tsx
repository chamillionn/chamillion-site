import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/admin";
import AdminShell from "./shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();
  if (!admin) redirect("/login");

  const { profile } = admin;

  return (
    <AdminShell email={profile.email} displayName={profile.display_name}>
      {children}
    </AdminShell>
  );
}

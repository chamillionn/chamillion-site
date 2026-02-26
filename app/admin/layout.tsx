import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminShell from "./shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, email, display_name")
    .eq("id", user.id)
    .single() as { data: { role: string; email: string; display_name: string | null } | null };

  if (!profile || profile.role !== "admin") redirect("/");

  return (
    <AdminShell email={profile.email} displayName={profile.display_name}>
      {children}
    </AdminShell>
  );
}

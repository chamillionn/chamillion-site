import { requireAdmin } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import type { Profile } from "@/lib/supabase/types";
import UsuariosTable from "./usuarios-table";

export const metadata = { title: "Admin — Usuarios" };

export default async function AdminUsuarios() {
  const admin = await requireAdmin();
  if (!admin) redirect("/login");

  const { data } = await admin.supabase
    .from("profiles")
    .select("*")
    .order("role")
    .order("email");

  const profiles = (data ?? []) as Profile[];

  return <UsuariosTable profiles={profiles} currentUserId={admin.user.id} />;
}

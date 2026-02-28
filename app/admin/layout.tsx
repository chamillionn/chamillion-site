import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/admin";
import AdminShell from "./shell";
import styles from "./layout.module.css";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();
  if (!admin) redirect("/login");

  const { profile, dbTarget, isRemote } = admin;

  return (
    <AdminShell
      email={profile.email}
      displayName={profile.display_name}
      dbTarget={dbTarget}
    >
      {isRemote && (
        <div className={styles.readOnlyBanner}>
          Modo lectura — viendo {dbTarget.toUpperCase()}
        </div>
      )}
      {children}
    </AdminShell>
  );
}

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/admin";
import { ToastProvider } from "@/components/admin-toast";
import styles from "./layout.module.css";

export const metadata = {
  title: "Editor — Chamillion",
  robots: { index: false, follow: false },
};

export default async function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();
  if (!admin) redirect("/login");

  return (
    <ToastProvider>
      <div className={styles.shell}>
        {admin.isRemote && (
          <div className={styles.readOnly} role="alert" aria-live="assertive">
            Modo lectura — viendo {admin.dbTarget.toUpperCase()}
          </div>
        )}
        {children}
      </div>
    </ToastProvider>
  );
}

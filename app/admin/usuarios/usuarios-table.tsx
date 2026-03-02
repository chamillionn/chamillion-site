"use client";

import { useState, useTransition } from "react";
import type { Profile } from "@/lib/supabase/types";
import { useToast } from "@/components/admin-toast";
import { setUserRole, deleteUser } from "./actions";
import ConfirmModal from "@/components/confirm-modal";
import styles from "../crud.module.css";

const ROLE_LABELS: Record<Profile["role"], string> = {
  free: "Free",
  member: "Miembro",
  admin: "Admin",
};

const ROLE_CLASS: Record<Profile["role"], string> = {
  free: styles.tag,
  member: styles.tagActive,
  admin: styles.tagPaused,
};

const ROLE_CYCLE: Record<Profile["role"], Profile["role"]> = {
  free: "member",
  member: "free",
  admin: "admin", // no cycling admin role from UI
};

const SUB_STATUS_LABELS: Record<string, string> = {
  active: "Activa",
  past_due: "Pendiente",
  canceled: "Cancelada",
  trialing: "Prueba",
  none: "—",
};

const SUB_STATUS_CLASS: Record<string, string> = {
  active: styles.tagActive,
  past_due: styles.tagPaused,
  canceled: styles.tag,
  trialing: styles.tagActive,
  none: styles.tag,
};

export default function UsuariosTable({
  profiles,
  currentUserId,
}: {
  profiles: Profile[];
  currentUserId: string;
}) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | Profile["role"]>("all");

  // Summary stats
  const roleCounts = { free: 0, member: 0, admin: 0 };
  const subCounts: Record<string, number> = {};
  for (const p of profiles) {
    roleCounts[p.role]++;
    const sub = p.subscription_status ?? "none";
    subCounts[sub] = (subCounts[sub] ?? 0) + 1;
  }

  // Filtered list
  const filtered = profiles.filter((p) => {
    if (roleFilter !== "all" && p.role !== roleFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        p.email.toLowerCase().includes(q) ||
        (p.display_name ?? "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  function handleRoleToggle(profile: Profile) {
    if (profile.role === "admin") return;
    const nextRole = ROLE_CYCLE[profile.role];
    setError(null);
    startTransition(async () => {
      const res = await setUserRole(profile.id, nextRole);
      if (res.error) { setError(res.error); toast(res.error, "error"); }
      else toast(`Rol cambiado a ${ROLE_LABELS[nextRole]}`, "success");
    });
  }

  function handleDelete(id: string) {
    if (id === currentUserId) return; // can't delete yourself
    setConfirmDelete(id);
  }

  function confirmDoDelete(id: string) {
    setConfirmDelete(null);
    setError(null);
    startTransition(async () => {
      const res = await deleteUser(id);
      if (res.error) { setError(res.error); toast(res.error, "error"); }
      else toast("Usuario eliminado", "success");
    });
  }

  return (
    <>
      {/* Summary badges */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <span className={styles.tag} style={{ padding: "6px 12px", fontSize: 12 }}>
          {profiles.length} total
        </span>
        <span className={`${styles.tag} ${styles.tagPaused}`} style={{ padding: "6px 12px", fontSize: 12 }}>
          {roleCounts.admin} Admin
        </span>
        <span className={`${styles.tag} ${styles.tagActive}`} style={{ padding: "6px 12px", fontSize: 12 }}>
          {roleCounts.member} Miembro
        </span>
        <span className={styles.tag} style={{ padding: "6px 12px", fontSize: 12 }}>
          {roleCounts.free} Free
        </span>
        {(subCounts.active ?? 0) > 0 && (
          <span className={`${styles.tag} ${styles.tagActive}`} style={{ padding: "6px 12px", fontSize: 12 }}>
            {subCounts.active} Activas
          </span>
        )}
        {(subCounts.trialing ?? 0) > 0 && (
          <span className={`${styles.tag} ${styles.tagActive}`} style={{ padding: "6px 12px", fontSize: 12 }}>
            {subCounts.trialing} Prueba
          </span>
        )}
        {(subCounts.canceled ?? 0) > 0 && (
          <span className={`${styles.tag} ${styles.tagClosed}`} style={{ padding: "6px 12px", fontSize: 12 }}>
            {subCounts.canceled} Canceladas
          </span>
        )}
      </div>

      {/* Search + filter */}
      <div className={styles.toolbar}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar email o nombre..."
            className={styles.input}
            style={{ width: 200, padding: "6px 10px", fontSize: 12 }}
          />
          {(["all", "free", "member", "admin"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`${styles.btnSecondary}`}
              style={roleFilter === r ? { borderColor: "var(--steel-blue)", color: "var(--steel-blue)" } : undefined}
            >
              {r === "all" ? "Todos" : ROLE_LABELS[r]}
            </button>
          ))}
        </div>
        <span
          style={{
            fontFamily: "var(--font-dm-mono), monospace",
            fontSize: 11,
            color: "var(--text-muted)",
          }}
        >
          {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {error && (
        <p className={styles.formError} style={{ marginBottom: 12 }}>
          {error}
        </p>
      )}

      {filtered.length === 0 ? (
        <div className={styles.empty}>
          {search || roleFilter !== "all" ? "No se encontraron resultados." : "No hay usuarios registrados."}
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Email</th>
                <th>Nombre</th>
                <th>Rol</th>
                <th>Suscripcion</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((profile) => {
                const isSelf = profile.id === currentUserId;
                return (
                  <tr key={profile.id}>
                    <td>
                      <span className={styles.bold}>{profile.email}</span>
                    </td>
                    <td>
                      <span style={{ color: "var(--text-muted)", fontSize: 12 }}>
                        {profile.display_name || "—"}
                      </span>
                    </td>
                    <td>
                      <span className={ROLE_CLASS[profile.role]}>
                        {ROLE_LABELS[profile.role]}
                      </span>
                    </td>
                    <td>
                      <span className={SUB_STATUS_CLASS[profile.subscription_status ?? "none"] ?? styles.tag}>
                        {SUB_STATUS_LABELS[profile.subscription_status ?? "none"] ?? profile.subscription_status ?? "—"}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        {profile.role !== "admin" && (
                          <button
                            className={styles.actionBtn}
                            onClick={() => handleRoleToggle(profile)}
                            disabled={pending || isSelf}
                            title={
                              profile.role === "free"
                                ? "Dar acceso Miembro"
                                : "Revocar acceso Miembro"
                            }
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              {profile.role === "free" ? (
                                <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                              ) : (
                                <path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                              )}
                            </svg>
                          </button>
                        )}
                        {!isSelf && (
                          <button
                            className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                            onClick={() => handleDelete(profile.id)}
                            disabled={pending}
                            title="Eliminar usuario"
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        open={!!confirmDelete}
        title="Eliminar usuario"
        message="Esta acción es irreversible. Se eliminará la cuenta y todos sus datos."
        onConfirm={() => confirmDelete && confirmDoDelete(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
        loading={pending}
      />
    </>
  );
}

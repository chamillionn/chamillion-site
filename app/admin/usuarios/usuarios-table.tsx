"use client";

import { useState, useTransition } from "react";
import type { Profile } from "@/lib/supabase/types";
import { setUserRole, deleteUser } from "./actions";
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

export default function UsuariosTable({
  profiles,
  currentUserId,
}: {
  profiles: Profile[];
  currentUserId: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  function handleRoleToggle(profile: Profile) {
    if (profile.role === "admin") return; // don't change admin roles from here
    const nextRole = ROLE_CYCLE[profile.role];
    setError(null);
    startTransition(async () => {
      const res = await setUserRole(profile.id, nextRole);
      if (res.error) setError(res.error);
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
      if (res.error) setError(res.error);
    });
  }

  return (
    <>
      <div className={styles.toolbar}>
        <h1 className={styles.heading}>Usuarios</h1>
        <span
          style={{
            fontFamily: "var(--font-dm-mono), monospace",
            fontSize: 11,
            color: "var(--text-muted)",
          }}
        >
          {profiles.length} usuarios
        </span>
      </div>

      {error && (
        <p className={styles.formError} style={{ marginBottom: 12 }}>
          {error}
        </p>
      )}

      {profiles.length === 0 ? (
        <div className={styles.empty}>No hay usuarios registrados.</div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Email</th>
                <th>Nombre</th>
                <th>Rol</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((profile) => {
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

      {/* Confirm delete modal */}
      {confirmDelete && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>Eliminar usuario</h2>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 20 }}>
              Esta acción es irreversible. Se eliminará la cuenta y todos sus datos.
            </p>
            <div className={styles.formActions}>
              <button
                className={styles.btnSecondary}
                onClick={() => setConfirmDelete(null)}
              >
                Cancelar
              </button>
              <button
                className={styles.btnPrimary}
                style={{ background: "var(--red)" }}
                onClick={() => confirmDoDelete(confirmDelete)}
                disabled={pending}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

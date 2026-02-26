"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Platform } from "@/lib/supabase/types";
import { KNOWN_PLATFORMS, type PlatformPreset } from "@/lib/platforms/presets";
import { createPlatformFromPreset, updatePlatformWallet, deletePlatform } from "./actions";
import styles from "./platforms.module.css";
import crudStyles from "../crud.module.css";

export default function PlatformsTable({ platforms }: { platforms: Platform[] }) {
  const router = useRouter();
  const [addingPreset, setAddingPreset] = useState<PlatformPreset | null>(null);
  const [editingWallet, setEditingWallet] = useState<Platform | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [syncState, setSyncState] = useState<Record<string, { loading: boolean; msg: string; ok: boolean }>>({});

  const addedNames = new Set(platforms.map((p) => p.name));
  const available = KNOWN_PLATFORMS.filter((p) => !addedNames.has(p.name));

  async function handleAddPreset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!addingPreset) return;
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const wallet = (formData.get("wallet_address") as string)?.trim();

    if (!wallet) {
      setError("La wallet address es obligatoria");
      setLoading(false);
      return;
    }

    const result = await createPlatformFromPreset(addingPreset.slug, wallet);
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setAddingPreset(null);
  }

  async function handleEditWallet(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingWallet) return;
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const wallet = (formData.get("wallet_address") as string)?.trim() || null;
    const result = await updatePlatformWallet(editingWallet.id, wallet);
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setEditingWallet(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta plataforma? Las posiciones asociadas perderán la referencia.")) return;
    await deletePlatform(id);
  }

  async function handleSync(slug: string) {
    setSyncState((prev) => ({ ...prev, [slug]: { loading: true, msg: "", ok: false } }));
    try {
      const res = await fetch(`/api/sync/${slug}`);
      const data = await res.json();
      const errors = data.errors as string[] | undefined;
      const errCount = errors?.length ?? 0;
      const ok = errCount === 0;
      const msg = ok
        ? `OK — ${data.updated} pos.`
        : `${data.updated} ok, ${errCount} error${errCount > 1 ? "es" : ""}`;
      setSyncState((prev) => ({
        ...prev,
        [slug]: { loading: false, msg, ok },
      }));
      router.refresh();
    } catch (e) {
      setSyncState((prev) => ({
        ...prev,
        [slug]: { loading: false, msg: e instanceof Error ? e.message : "Error", ok: false },
      }));
    }
  }

  function closeModal() {
    setAddingPreset(null);
    setEditingWallet(null);
    setError("");
  }

  return (
    <div>
      {/* ===== Available platforms to add ===== */}
      {available.length > 0 && (
        <>
          <p className={styles.sectionLabel}>Disponibles</p>
          <div className={styles.presetGrid}>
            {available.map((preset) => (
              <button
                key={preset.slug}
                className={styles.presetCard}
                onClick={() => setAddingPreset(preset)}
              >
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={styles.presetIcon}
                >
                  <path d={preset.icon} />
                </svg>
                <div className={styles.presetInfo}>
                  <span className={styles.presetName}>{preset.name}</span>
                  <span className={styles.presetDesc}>{preset.description}</span>
                </div>
                <span className={styles.presetAdd}>+</span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* ===== Added platforms ===== */}
      {platforms.length > 0 && (
        <>
          <p className={styles.sectionLabel}>Activas</p>
          <div className={crudStyles.tableWrap}>
            <table className={crudStyles.table}>
              <thead>
                <tr>
                  <th>Plataforma</th>
                  <th>Tipo</th>
                  <th>Wallet</th>
                  <th>Sync</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {platforms.map((p) => {
                  const preset = KNOWN_PLATFORMS.find((k) => k.name === p.name);
                  const walletShort = p.wallet_address
                    ? `${p.wallet_address.slice(0, 6)}...${p.wallet_address.slice(-4)}`
                    : "—";

                  return (
                    <tr key={p.id}>
                      <td>
                        <div className={styles.platformCell}>
                          {preset && (
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className={styles.platformCellIcon}
                            >
                              <path d={preset.icon} />
                            </svg>
                          )}
                          <span className={crudStyles.bold}>{p.name}</span>
                        </div>
                      </td>
                      <td><span className={crudStyles.tag}>{p.type}</span></td>
                      <td>
                        <code className={styles.walletCode}>{walletShort}</code>
                      </td>
                      <td>
                        {preset?.syncable ? (
                          <div className={styles.syncCell}>
                            <button
                              onClick={() => handleSync(preset.slug)}
                              disabled={syncState[preset.slug]?.loading}
                              className={styles.syncBtn}
                            >
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className={syncState[preset.slug]?.loading ? styles.syncSpin : ""}
                              >
                                <path d="M1 4v6h6M23 20v-6h-6" />
                                <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" />
                              </svg>
                              {syncState[preset.slug]?.loading ? "Syncing..." : "Sync"}
                            </button>
                            {syncState[preset.slug]?.msg && (
                              <span className={syncState[preset.slug].ok ? styles.syncOk : styles.syncErr}>
                                {syncState[preset.slug].msg}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className={styles.syncBadgeOff}>manual</span>
                        )}
                      </td>
                      <td>
                        <div className={crudStyles.actions}>
                          <button
                            onClick={() => setEditingWallet(p)}
                            className={crudStyles.actionBtn}
                            title="Editar wallet"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className={`${crudStyles.actionBtn} ${crudStyles.actionBtnDanger}`}
                            title="Eliminar"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {platforms.length === 0 && available.length === 0 && (
        <div className={crudStyles.empty}>No hay plataformas disponibles.</div>
      )}

      {/* ===== Modal: Add preset ===== */}
      {addingPreset && (
        <div className={crudStyles.overlay} onClick={closeModal}>
          <div className={crudStyles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={styles.presetIcon}
              >
                <path d={addingPreset.icon} />
              </svg>
              <h2 className={crudStyles.modalTitle}>Añadir {addingPreset.name}</h2>
            </div>
            <p className={styles.modalDesc}>{addingPreset.description}</p>
            <form onSubmit={handleAddPreset} className={crudStyles.form}>
              <label className={crudStyles.field}>
                <span className={crudStyles.fieldLabel}>Wallet Address</span>
                <input
                  name="wallet_address"
                  required
                  className={crudStyles.input}
                  placeholder="0x..."
                  autoFocus
                  spellCheck={false}
                />
              </label>
              <p className={styles.hint}>
                Dirección pública de tu wallet. Se usa solo para leer posiciones (read-only).
              </p>
              {error && <p className={crudStyles.formError}>{error}</p>}
              <div className={crudStyles.formActions}>
                <button type="button" onClick={closeModal} className={crudStyles.btnSecondary}>
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className={crudStyles.btnPrimary}>
                  {loading ? "Añadiendo..." : "Añadir plataforma"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== Modal: Edit wallet ===== */}
      {editingWallet && (
        <div className={crudStyles.overlay} onClick={closeModal}>
          <div className={crudStyles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={crudStyles.modalTitle}>Editar {editingWallet.name}</h2>
            <form onSubmit={handleEditWallet} className={crudStyles.form}>
              <label className={crudStyles.field}>
                <span className={crudStyles.fieldLabel}>Wallet Address</span>
                <input
                  name="wallet_address"
                  defaultValue={editingWallet.wallet_address ?? ""}
                  className={crudStyles.input}
                  placeholder="0x..."
                  autoFocus
                  spellCheck={false}
                />
              </label>
              {error && <p className={crudStyles.formError}>{error}</p>}
              <div className={crudStyles.formActions}>
                <button type="button" onClick={closeModal} className={crudStyles.btnSecondary}>
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className={crudStyles.btnPrimary}>
                  {loading ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

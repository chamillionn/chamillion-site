"use client";

import { useState, useEffect } from "react";
import type { Platform, Strategy, Position } from "@/lib/supabase/types";
import { useToast } from "@/components/admin-toast";
import { createPosition, updatePosition } from "./actions";
import styles from "./page.module.css";

interface Props {
  platforms: Platform[];
  strategies: Strategy[];
  position?: Position | null;
  onClose: () => void;
}

export default function PositionForm({ platforms, strategies, position, onClose }: Props) {
  const { toast } = useToast();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const isEdit = !!position;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = isEdit
      ? await updatePosition(position!.id, formData)
      : await createPosition(formData);

    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    toast(isEdit ? "Posicion actualizada" : "Posicion creada", "success");
    onClose();
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>
          {isEdit ? "Editar posición" : "Nueva posición"}
        </h2>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.fieldRow}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Asset</span>
              <input
                name="asset"
                defaultValue={position?.asset ?? ""}
                required
                className={styles.input}
                placeholder="ETH Lending, BTC-ETH Perp..."
              />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Fecha apertura</span>
              <input
                name="opened_at"
                type="date"
                defaultValue={
                  position?.opened_at
                    ? position.opened_at.split("T")[0]
                    : new Date().toISOString().split("T")[0]
                }
                className={styles.input}
              />
            </label>
          </div>

          <div className={styles.fieldRow}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Size</span>
              <input
                name="size"
                type="number"
                step="any"
                defaultValue={position?.size ?? ""}
                required
                className={styles.input}
                placeholder="1.5"
              />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Coste base ($)</span>
              <input
                name="cost_basis"
                type="number"
                step="any"
                defaultValue={position?.cost_basis ?? ""}
                required
                className={styles.input}
                placeholder="100.00"
              />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Valor actual ($)</span>
              <input
                name="current_value"
                type="number"
                step="any"
                defaultValue={position?.current_value ?? ""}
                required
                className={styles.input}
                placeholder="110.00"
              />
            </label>
          </div>

          <div className={styles.fieldRow}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Plataforma</span>
              <select
                name="platform_id"
                defaultValue={position?.platform_id ?? ""}
                className={styles.input}
              >
                <option value="">Sin plataforma</option>
                {platforms.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Estrategia</span>
              <select
                name="strategy_id"
                defaultValue={position?.strategy_id ?? ""}
                className={styles.input}
              >
                <option value="">Sin estrategia</option>
                {strategies.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Notas</span>
            <textarea
              name="notes"
              defaultValue={position?.notes ?? ""}
              className={styles.input}
              rows={2}
              placeholder="Notas opcionales..."
            />
          </label>

          {error && <p className={styles.formError}>{error}</p>}

          <div className={styles.formActions}>
            <button type="button" onClick={onClose} className={styles.btnSecondary}>
              Cancelar
            </button>
            <button type="submit" disabled={loading} className={styles.btnPrimary}>
              {loading ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear posición"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

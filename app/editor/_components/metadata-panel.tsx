"use client";

import { useState, useTransition } from "react";
import type { Post } from "@/lib/supabase/types";
import { useToast } from "@/components/admin-toast";
import { updateDraftMetadata } from "@/app/admin/newsletter/actions";
import styles from "./editor.module.css";

interface MetadataPanelProps {
  post: Post;
  readOnly: boolean;
}

const SECTION_OPTIONS = [
  { value: "", label: "— Sin sección —" },
  { value: "Reporte de la Cartera", label: "Reporte de la Cartera" },
  { value: "Punto de Mira", label: "Punto de Mira" },
];

function Segmented({
  value,
  options,
  onChange,
  disabled,
  ariaLabel,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  disabled?: boolean;
  ariaLabel: string;
}) {
  return (
    <div
      className={styles.segmented}
      role="radiogroup"
      aria-label={ariaLabel}
    >
      {options.map((opt) => (
        <button
          type="button"
          key={opt.value}
          role="radio"
          aria-checked={value === opt.value}
          className={`${styles.segmentedOption} ${value === opt.value ? styles.segmentedOptionActive : ""}`}
          onClick={() => onChange(opt.value)}
          disabled={disabled}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export default function MetadataPanel({ post, readOnly }: MetadataPanelProps) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  const [section, setSection] = useState(post.section ?? "");
  const [substackUrl, setSubstackUrl] = useState(post.substack_url ?? "");
  const [premium, setPremium] = useState(post.premium);
  const [date, setDate] = useState(post.date);

  function save(patch: Parameters<typeof updateDraftMetadata>[1]) {
    if (readOnly) return;
    startTransition(async () => {
      const res = await updateDraftMetadata(post.id, patch);
      if (res.error) toast(res.error, "error");
    });
  }

  return (
    <aside className={styles.sidebar} aria-label="Metadata del post">
      <h2 className={styles.sidebarTitle}>Metadata</h2>

      <div className={styles.field}>
        <label className={styles.fieldLabel} htmlFor="md-date">
          Fecha
        </label>
        <input
          id="md-date"
          type="date"
          className={styles.input}
          value={date}
          disabled={readOnly}
          onChange={(e) => setDate(e.target.value)}
          onBlur={() => date !== post.date && save({ date })}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.fieldLabel} htmlFor="md-section">
          Sección
        </label>
        <select
          id="md-section"
          className={styles.select}
          value={section}
          disabled={readOnly}
          onChange={(e) => {
            const v = e.target.value;
            setSection(v);
            save({ section: v || null });
          }}
        >
          {SECTION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label className={styles.fieldLabel} htmlFor="md-substack">
          Substack URL
        </label>
        <input
          id="md-substack"
          className={`${styles.input} ${styles.inputMono}`}
          value={substackUrl}
          disabled={readOnly}
          placeholder="https://chamillion.substack.com/p/…"
          onChange={(e) => setSubstackUrl(e.target.value)}
          onBlur={() =>
            substackUrl !== (post.substack_url ?? "") &&
            save({ substack_url: substackUrl || null })
          }
        />
      </div>

      <div className={styles.field}>
        <span className={styles.fieldLabel}>Acceso</span>
        <Segmented
          value={premium ? "premium" : "libre"}
          options={[
            { value: "libre", label: "LIBRE" },
            { value: "premium", label: "PREMIUM" },
          ]}
          disabled={readOnly || pending}
          ariaLabel="Acceso del post"
          onChange={(v) => {
            const next = v === "premium";
            setPremium(next);
            save({ premium: next });
          }}
        />
      </div>
    </aside>
  );
}

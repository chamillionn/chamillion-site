"use client";

import { useState } from "react";
import styles from "./debug.module.css";

interface TableData {
  rows: Record<string, unknown>[];
  count: number;
}

interface EnvInfo {
  supabaseUrl: string;
  isDev: boolean;
}

interface Props {
  tables: Record<string, TableData>;
  views: Record<string, TableData>;
  env: EnvInfo;
}

function formatValue(val: unknown): string {
  if (val === null) return "null";
  if (val === undefined) return "undefined";
  if (typeof val === "boolean") return val ? "true" : "false";
  if (typeof val === "number") return String(val);
  if (typeof val === "object") return JSON.stringify(val);
  const s = String(val);
  return s.length > 80 ? s.slice(0, 77) + "..." : s;
}

function valueClass(val: unknown): string {
  if (val === null || val === undefined) return styles.vNull;
  if (typeof val === "boolean") return val ? styles.vTrue : styles.vFalse;
  if (typeof val === "number") return styles.vNum;
  return "";
}

function TableSection({
  name,
  data,
  kind,
}: {
  name: string;
  data: TableData;
  kind: "table" | "view";
}) {
  const [open, setOpen] = useState(false);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const cols = data.rows.length > 0 ? Object.keys(data.rows[0]) : [];

  return (
    <div className={styles.section}>
      <button className={styles.sectionHeader} onClick={() => setOpen(!open)}>
        <div className={styles.sectionLeft}>
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            className={`${styles.chevron} ${open ? styles.chevronOpen : ""}`}
          >
            <path
              d="M4 2l4 4-4 4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className={styles.sectionName}>{name}</span>
          <span className={kind === "view" ? styles.tagView : styles.tagTable}>
            {kind}
          </span>
        </div>
        <span className={styles.sectionCount}>
          {data.count} row{data.count !== 1 ? "s" : ""}
        </span>
      </button>

      {open && (
        <div className={styles.sectionBody}>
          {data.rows.length === 0 ? (
            <div className={styles.emptyTable}>Vacio</div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.thIdx}>#</th>
                    {cols.map((col) => (
                      <th key={col}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row, i) => (
                    <tr
                      key={i}
                      className={expandedRow === i ? styles.rowExpanded : ""}
                      onClick={() => setExpandedRow(expandedRow === i ? null : i)}
                    >
                      <td className={styles.tdIdx}>{i}</td>
                      {cols.map((col) => (
                        <td key={col} className={valueClass(row[col])}>
                          {formatValue(row[col])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {expandedRow !== null && data.rows[expandedRow] && (
            <div className={styles.jsonBlock}>
              <div className={styles.jsonHeader}>
                Row {expandedRow} — raw JSON
              </div>
              <pre className={styles.json}>
                {JSON.stringify(data.rows[expandedRow], null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DataPanel({
  tables,
  views,
  env,
}: {
  tables: Record<string, TableData>;
  views: Record<string, TableData>;
  env: EnvInfo;
}) {
  return (
    <>
      <div className={styles.envBar}>
        <span className={env.isDev ? styles.envDev : styles.envProd}>
          {env.isDev ? "DEV" : "PROD"}
        </span>
        <code className={styles.envUrl}>{env.supabaseUrl}</code>
      </div>

      <div className={styles.grid}>
        <div>
          <div className={styles.groupLabel}>Tables</div>
          {Object.entries(tables).map(([name, data]) => (
            <TableSection key={name} name={name} data={data} kind="table" />
          ))}
        </div>
        <div>
          <div className={styles.groupLabel}>Views</div>
          {Object.entries(views).map(([name, data]) => (
            <TableSection key={name} name={name} data={data} kind="view" />
          ))}
        </div>
      </div>
    </>
  );
}

export default function DebugView({ tables, views, env }: Props) {
  return (
    <div>
      <DataPanel tables={tables} views={views} env={env} />
    </div>
  );
}

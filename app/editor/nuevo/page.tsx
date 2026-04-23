import Link from "next/link";
import NuevoForm from "./nuevo-form";
import styles from "./nuevo.module.css";

export const metadata = { title: "Editor — Nuevo borrador" };

// Auth protected by app/editor/layout.tsx.
export default function NuevoDraftPage() {
  return (
    <div className={styles.wrap}>
      <Link href="/admin/newsletter" className={styles.back}>
        ← Newsletter
      </Link>
      <h1 className={styles.heading}>Nuevo borrador</h1>
      <p className={styles.hint}>
        Se crea como no publicado. Después abrirás el editor con todas las
        herramientas (callouts, widgets, imágenes, autosave).
      </p>
      <NuevoForm />
    </div>
  );
}

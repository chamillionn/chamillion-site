import type { Metadata } from "next";
import Header from "../newsletter/header";
import styles from "../newsletter/layout.module.css";

export const metadata: Metadata = {
  title: "Análisis",
  description:
    "Tesis de inversión y análisis de oportunidades. Documentadas, seguidas con datos reales y contrastadas con el tiempo.",
  alternates: {
    canonical: "https://chamillion.site/analisis",
  },
  openGraph: {
    title: "Análisis — Chamillion",
    description:
      "Tesis de inversión y análisis de oportunidades. Documentadas, seguidas con datos reales y contrastadas con el tiempo.",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

export default function AnalisisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.wrapper}>
      <Header />
      {children}
    </div>
  );
}

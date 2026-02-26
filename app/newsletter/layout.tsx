import type { Metadata } from "next";
import Header from "./header";
import styles from "./layout.module.css";

export const metadata: Metadata = {
  title: "Newsletter — Chamillion",
  description:
    "Un viaje con dinero real por la vanguardia de los mercados financieros. Documentado, y verificable.",
};

export default function NewsletterLayout({
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

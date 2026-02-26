import type { Metadata } from "next";
import Header from "./header";
import styles from "./layout.module.css";

export const metadata: Metadata = {
  title: "Newsletter",
  description:
    "Un viaje con dinero real por la vanguardia de los mercados financieros. Documentado, y verificable.",
  openGraph: {
    title: "Newsletter — Chamillion",
    description:
      "Un viaje con dinero real por la vanguardia de los mercados financieros. Documentado, y verificable.",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
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

import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
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
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link className={styles.headerLogo} href="/">
            <div className={styles.logoBox}>
              <Image
                src="/assets/newsletter/logo.jpg"
                alt="Chamillion"
                width={24}
                height={24}
              />
            </div>
            <span>Chamillion</span>
          </Link>
          <nav className={styles.headerNav}>
            <Link href="/">Inicio</Link>
            <Link href="/newsletter">Archivo</Link>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}

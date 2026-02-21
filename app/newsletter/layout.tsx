import Link from "next/link";
import Image from "next/image";
import styles from "./layout.module.css";

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
            <Image src="/assets/newsletter/logo.jpg" alt="Chamillion" width={36} height={36} />
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

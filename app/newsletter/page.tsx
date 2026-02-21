import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Newsletter — Chamillion",
  description:
    "Un viaje con dinero real por la vanguardia de los mercados financieros. Documentado, y verificable.",
};

const posts = [
  {
    slug: "post-01",
    title: "Navegar las finanzas modernas: El augurio de una odisea",
    subtitle:
      "Un viaje con dinero real por los mercados que están reemplazando al sistema.",
    date: "2026-02-21",
    banner: "/assets/newsletter/wanderer-post-01.png",
  },
];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function NewsletterIndex() {
  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Newsletter</h1>
      <p className={styles.intro}>
        Un viaje con dinero real por la vanguardia de los mercados financieros.
        Documentado, y verificable.
      </p>

      <div className={styles.grid}>
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/newsletter/${post.slug}`}
            className={styles.card}
          >
            <div className={styles.cardImageWrapper}>
              <Image
                src={post.banner}
                alt={post.title}
                width={720}
                height={315}
                className={styles.cardImage}
              />
            </div>
            <div className={styles.cardBody}>
              <time className={styles.cardDate}>{formatDate(post.date)}</time>
              <h2 className={styles.cardTitle}>{post.title}</h2>
              <p className={styles.cardSubtitle}>{post.subtitle}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

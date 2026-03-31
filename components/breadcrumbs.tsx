import Link from "next/link";

interface Props {
  title: string;
}

export default function Breadcrumbs({ title }: Props) {
  return (
    <nav
      aria-label="Migas de pan"
      style={{
        maxWidth: 860,
        margin: "0 auto",
        padding: "16px 24px 0",
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontFamily: "var(--font-dm-mono), monospace",
        fontSize: 10,
        letterSpacing: "0.04em",
        color: "var(--text-muted)",
      }}
    >
      <Link href="/" style={{ color: "var(--text-muted)", textDecoration: "none", transition: "color 0.2s" }}>
        Inicio
      </Link>
      <span aria-hidden="true" style={{ opacity: 0.4 }}>/</span>
      <Link href="/newsletter" style={{ color: "var(--text-muted)", textDecoration: "none", transition: "color 0.2s" }}>
        Newsletter
      </Link>
      <span aria-hidden="true" style={{ opacity: 0.4 }}>/</span>
      <span style={{ color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {title}
      </span>
    </nav>
  );
}

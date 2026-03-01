import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-dark)",
        padding: 24,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
          textAlign: "center",
          maxWidth: 420,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-jetbrains), monospace",
            fontSize: 64,
            fontWeight: 700,
            color: "var(--text-muted)",
            lineHeight: 1,
          }}
        >
          404
        </span>
        <h1
          style={{
            fontFamily: "var(--font-playfair), serif",
            fontSize: 24,
            fontWeight: 700,
            color: "var(--text-primary)",
            margin: 0,
          }}
        >
          Pagina no encontrada
        </h1>
        <p
          style={{
            fontFamily: "var(--font-outfit), sans-serif",
            fontSize: 15,
            color: "var(--text-secondary)",
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          La pagina que buscas no existe o fue movida.
        </p>
        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
          <Link
            href="/"
            style={{
              fontFamily: "var(--font-dm-mono), monospace",
              fontSize: 12,
              letterSpacing: "0.3px",
              padding: "10px 22px",
              background: "var(--steel-blue)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              textDecoration: "none",
              transition: "opacity 0.2s",
            }}
          >
            Ir al inicio
          </Link>
          <Link
            href="/newsletter"
            style={{
              fontFamily: "var(--font-dm-mono), monospace",
              fontSize: 12,
              letterSpacing: "0.3px",
              padding: "10px 22px",
              background: "transparent",
              color: "var(--text-secondary)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              textDecoration: "none",
              transition: "color 0.2s",
            }}
          >
            Newsletter
          </Link>
        </div>
      </div>
    </div>
  );
}

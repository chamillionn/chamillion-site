import Link from "next/link";

export default function NotFound() {
  return (
    <div className="status-page">
      <div className="status-page-inner">
        <span className="status-page-code">404</span>
        <h1 className="status-page-title">Pagina no encontrada</h1>
        <p className="status-page-text">
          La pagina que buscas no existe o fue movida.
        </p>
        <div className="status-page-actions">
          <Link href="/" className="status-page-btn status-page-btn-primary">
            Ir al inicio
          </Link>
          <Link
            href="/newsletter"
            className="status-page-btn status-page-btn-secondary"
          >
            Newsletter
          </Link>
        </div>
      </div>
    </div>
  );
}

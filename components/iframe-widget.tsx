"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  src: string;
  widgetId: string;
  className?: string;
  title?: string;
  loading?: "lazy" | "eager";
}

export default function IframeWidget({ src, widgetId, className, title, loading = "lazy" }: Props) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    function handle(e: MessageEvent) {
      if (e.data?.type === "chamillion-resize" && e.data?.id === widgetId && ref.current) {
        ref.current.style.height = e.data.height + "px";
      }
    }
    window.addEventListener("message", handle);
    return () => window.removeEventListener("message", handle);
  }, [widgetId]);

  useEffect(() => {
    if (!isFullscreen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setIsFullscreen(false);
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isFullscreen]);

  return (
    <>
      <div style={{ position: "relative" }}>
        <iframe
          id={widgetId}
          ref={ref}
          src={src}
          loading={loading}
          className={className}
          title={title}
          scrolling="no"
          style={{ overflow: "hidden" }}
        />
        <div
          style={{
            position: "absolute",
            top: 6,
            right: 6,
            display: "flex",
            gap: 4,
            opacity: 0.5,
            transition: "opacity 0.2s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.5"; }}
        >
          <button
            onClick={() => setIsFullscreen(true)}
            aria-label="Pantalla completa"
            title="Pantalla completa"
            style={toolBtnStyle}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 3 21 3 21 9" />
              <polyline points="9 21 3 21 3 15" />
              <line x1="21" y1="3" x2="14" y2="10" />
              <line x1="3" y1="21" x2="10" y2="14" />
            </svg>
          </button>
        </div>
      </div>

      {/* Fullscreen overlay */}
      {isFullscreen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "var(--bg-page, #0C0E11)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ display: "flex", justifyContent: "flex-end", padding: 8 }}>
            <button
              onClick={() => setIsFullscreen(false)}
              aria-label="Cerrar pantalla completa"
              style={{
                ...toolBtnStyle,
                width: 36,
                height: 36,
                opacity: 0.7,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <iframe
            src={src}
            title={title}
            style={{
              flex: 1,
              width: "100%",
              border: "none",
              overflow: "hidden",
            }}
          />
        </div>
      )}
    </>
  );
}

const toolBtnStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 28,
  height: 28,
  borderRadius: 6,
  border: "1px solid var(--border)",
  background: "var(--bg-card, #13161B)",
  color: "var(--text-secondary)",
  cursor: "pointer",
  transition: "all 0.15s ease",
  padding: 0,
};

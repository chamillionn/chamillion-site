"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import Link from "next/link";
import ChameleonEye from "@/components/chameleon-eye";

const TAGLINE =
  "Documentando la vanguardia de los mercados financieros, y haciendo dinero. Con un ojo en cada pantalla.";

const ACCENT = {
  default:  { accent: "#6b8cae", r: "107", g: "140", b: "174", hue: "0deg" },
  substack: { accent: "#ff6719", r: "255", g: "103", b: "25",  hue: "-190deg" },
  web:      { accent: "#a78bfa", r: "167", g: "139", b: "250", hue: "45deg" },
  hub:      { accent: "#50c878", r: "80",  g: "200", b: "120", hue: "-70deg" },
} as const;

function Typewriter({ text }: { text: string }) {
  const [count, setCount] = useState(0);
  const done = count >= text.length;

  useEffect(() => {
    if (done) return;
    const delay = Math.random() * 25 + 15; // 15-40ms per char
    const id = setTimeout(() => setCount((c) => c + 1), delay);
    return () => clearTimeout(id);
  }, [count, done, text.length]);

  return (
    <>
      {text.slice(0, count)}
      <span
        className={`typewriter-cursor${done ? " typewriter-cursor--done" : ""}`}
      />
    </>
  );
}

export default function Home() {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const glow = glowRef.current;
    if (!glow) return;

    const mq = window.matchMedia("(pointer: fine)");
    if (!mq.matches) {
      glow.style.display = "none";
      return;
    }

    function onMove(e: MouseEvent) {
      glow!.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      glow!.style.opacity = "1";
    }

    function onLeave() {
      glow!.style.opacity = "0";
    }

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onLeave);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  const handleCardMouse = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      const card = e.currentTarget;
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
      card.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
    },
    [],
  );

  const hueAnim = useRef<{ id: number; current: number }>({ id: 0, current: 0 });

  const setAccent = useCallback((key: keyof typeof ACCENT) => {
    const c = ACCENT[key];
    const s = document.documentElement.style;
    s.setProperty("--accent", c.accent);
    s.setProperty("--accent-r", c.r);
    s.setProperty("--accent-g", c.g);
    s.setProperty("--accent-b", c.b);

    // Animate hue-rotate via JS — shortest path around the hue circle
    const target = parseFloat(c.hue);
    if (hueAnim.current.id) cancelAnimationFrame(hueAnim.current.id);

    function step() {
      const cur = hueAnim.current.current;
      let diff = target - cur;
      // Shortest path: wrap around ±180
      if (diff > 180) diff -= 360;
      if (diff < -180) diff += 360;

      if (Math.abs(diff) < 0.5) {
        hueAnim.current.current = target;
        s.setProperty("--chameleon-hue", `${target}deg`);
        hueAnim.current.id = 0;
        return;
      }

      hueAnim.current.current = cur + diff * 0.06;
      s.setProperty("--chameleon-hue", `${hueAnim.current.current}deg`);
      hueAnim.current.id = requestAnimationFrame(step);
    }

    hueAnim.current.id = requestAnimationFrame(step);
  }, []);

  return (
    <div className="page-transition">
      <ChameleonEye />
      <div ref={glowRef} className="cursor-glow" />
      <div className="landing">
        <div className="brand">
          <h1 className="logo">chamillion</h1>
          <p className="tagline">
            <Typewriter text={TAGLINE} />
          </p>
        </div>

        <nav className="nav-block">
          <div className="nav-cards">
            <div
              className="nav-card"
              onMouseMove={handleCardMouse}
              onMouseLeave={() => setAccent("default")}
            >
              <svg className="nav-card-icon" xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <rect x="4" y="3" width="16" height="18" rx="2" />
                <path d="M8 7h8M8 11h5M8 15h6" />
              </svg>
              <span className="nav-card-title">Newsletter</span>
              <span className="nav-card-desc">
                Artículos, análisis y estrategias DeFi
              </span>
              <div className="nav-card-links">
                <a
                  href="https://chamillion.substack.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nav-card-link"
                  onMouseEnter={() => setAccent("substack")}
                >
                  <span className="nav-card-link-label">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M15 3.604H1v1.891h14v-1.89ZM1 7.208V16l7-3.926L15 16V7.208zM15 0H1v1.89h14z"/>
                    </svg>
                    Substack
                  </span>
                  <span className="nav-card-link-arrow">&rarr;</span>
                </a>
                <Link
                  href="/newsletter"
                  className="nav-card-link"
                  onMouseEnter={() => setAccent("web")}
                >
                  <span className="nav-card-link-label">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8m7.5-6.923c-.67.204-1.335.82-1.887 1.855A8 8 0 0 0 5.145 4H7.5zM4.09 4a9.3 9.3 0 0 1 .64-1.539 7 7 0 0 1 .597-.933A7.03 7.03 0 0 0 2.255 4zm-.582 3.5c.03-.877.138-1.718.312-2.5H1.674a7 7 0 0 0-.656 2.5zM4.847 5a12.5 12.5 0 0 0-.338 2.5H7.5V5zM8.5 5v2.5h2.99a12.5 12.5 0 0 0-.337-2.5zM4.51 8.5a12.5 12.5 0 0 0 .337 2.5H7.5V8.5zm3.99 0V11h2.653c.187-.765.306-1.608.338-2.5zM5.145 12q.208.58.468 1.068c.552 1.035 1.218 1.65 1.887 1.855V12zm.182 2.472a7 7 0 0 1-.597-.933A9.3 9.3 0 0 1 4.09 12H2.255a7 7 0 0 0 3.072 2.472M3.82 11a13.7 13.7 0 0 1-.312-2.5h-2.49c.062.89.291 1.733.656 2.5zm6.853 3.472A7 7 0 0 0 13.745 12H11.91a9.3 9.3 0 0 1-.64 1.539 7 7 0 0 1-.597.933M8.5 12v2.923c.67-.204 1.335-.82 1.887-1.855q.26-.487.468-1.068zm3.68-1h2.146c.365-.767.594-1.61.656-2.5h-2.49a13.7 13.7 0 0 1-.312 2.5m2.802-3.5a7 7 0 0 0-.656-2.5H12.18c.174.782.282 1.623.312 2.5zM11.27 2.461c.247.464.462.98.64 1.539h1.835a7 7 0 0 0-3.072-2.472c.218.284.418.598.597.933M10.855 4a8 8 0 0 0-.468-1.068C9.835 1.897 9.17 1.282 8.5 1.077V4z"/>
                    </svg>
                    Web
                  </span>
                  <span className="nav-card-link-arrow">&rarr;</span>
                </Link>
              </div>
            </div>
            <div
              className="nav-card nav-card--disabled"
              onMouseEnter={() => setAccent("hub")}
              onMouseLeave={() => setAccent("default")}
            >
              <svg className="nav-card-icon" xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M4 20V10M9 20V6M14 20v-8M19 20V4" />
              </svg>
              <div className="nav-card-header">
                <span className="nav-card-title">Hub</span>
                <span className="nav-card-badge">próximamente</span>
              </div>
              <span className="nav-card-desc">
                Cartera a tiempo real, posiciones y métricas
              </span>
            </div>
          </div>
          <div className="nav-contact">
            <a
              href="https://x.com/chamillionnnnn"
              target="_blank"
              rel="noopener noreferrer"
            >
              𝕏
            </a>
            <span className="nav-dot">&middot;</span>
            <a href="mailto:chamilli@pm.me">chamilli@pm.me</a>
          </div>
        </nav>
      </div>
    </div>
  );
}

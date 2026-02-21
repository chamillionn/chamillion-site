"use client";

import { useEffect, useRef } from "react";

export default function ChameleonEye() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cleanup: (() => void) | undefined;

    fetch("/assets/face-vectorizable.svg")
      .then((r) => r.text())
      .then((svgText) => {
        container.innerHTML = svgText;
        const svg = container.querySelector("svg");
        if (!svg) return;

        svg.setAttribute("viewBox", "0 0 2048 2048");
        svg.setAttribute("preserveAspectRatio", "xMidYMid slice");
        svg.removeAttribute("width");
        svg.removeAttribute("height");
        svg.style.width = "100%";
        svg.style.height = "100%";

        const ns = "http://www.w3.org/2000/svg";

        const pupil = document.createElementNS(ns, "circle");
        pupil.setAttribute("cx", "1092");
        pupil.setAttribute("cy", "798");
        pupil.setAttribute("r", "60");
        pupil.setAttribute("fill", "#1a4a7a");
        svg.appendChild(pupil);

        const highlight = document.createElementNS(ns, "circle");
        highlight.setAttribute("cx", "1052");
        highlight.setAttribute("cy", "758");
        highlight.setAttribute("r", "20");
        highlight.setAttribute("fill", "#b8d0e4");
        svg.appendChild(highlight);

        const eyeCx = 1092;
        const eyeCy = 798;
        const maxR = 60;

        function onMouseMove(e: MouseEvent) {
          const rect = svg!.getBoundingClientRect();
          const scaleX = 2048 / rect.width;
          const scaleY = 2048 / rect.height;
          const scale = Math.min(scaleX, scaleY);
          const offsetX = (2048 - rect.width * scale) / 2;
          const offsetY = (2048 - rect.height * scale) / 2;
          const mx = (e.clientX - rect.left) * scale + offsetX;
          const my = (e.clientY - rect.top) * scale + offsetY;
          const dx = mx - eyeCx;
          const dy = my - eyeCy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const c = Math.min(dist, maxR) / (dist || 1);
          const px = eyeCx + dx * c;
          const py = eyeCy + dy * c;
          pupil.setAttribute("cx", String(px));
          pupil.setAttribute("cy", String(py));
          highlight.setAttribute("cx", String(px - 40));
          highlight.setAttribute("cy", String(py - 40));
        }

        document.addEventListener("mousemove", onMouseMove);
        cleanup = () => document.removeEventListener("mousemove", onMouseMove);
      });

    return () => {
      cleanup?.();
    };
  }, []);

  return <div ref={containerRef} className="face-bg" />;
}

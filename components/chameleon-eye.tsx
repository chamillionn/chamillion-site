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
        pupil.setAttribute("fill", "#111");
        svg.appendChild(pupil);

        const highlight = document.createElementNS(ns, "circle");
        highlight.setAttribute("cx", "1052");
        highlight.setAttribute("cy", "758");
        highlight.setAttribute("r", "20");
        highlight.setAttribute("fill", "rgba(255,255,255,0.25)");
        svg.appendChild(highlight);

        const eyeCx = 1092;
        const eyeCy = 798;
        const maxR = 60;

        let targetX = eyeCx;
        let targetY = eyeCy;
        let currentX = eyeCx;
        let currentY = eyeCy;
        let hasInput = false;
        let animFrameId: number;

        function updateEye(px: number, py: number) {
          pupil.setAttribute("cx", String(px));
          pupil.setAttribute("cy", String(py));
          highlight.setAttribute("cx", String(px - 40));
          highlight.setAttribute("cy", String(py - 40));
        }

        // Idle drift — layered sine waves for varied, organic motion
        let t = Math.random() * 100;

        function idleDrift() {
          t += 0.012;
          targetX =
            eyeCx +
            Math.sin(t) * 28 +
            Math.sin(t * 2.3 + 1.2) * 15 +
            Math.sin(t * 5.1 + 3.7) * 5;
          targetY =
            eyeCy +
            Math.sin(t * 0.8 + 2.0) * 22 +
            Math.sin(t * 1.9 + 0.5) * 12 +
            Math.cos(t * 4.3 + 1.1) * 4;
        }

        function animate() {
          if (!hasInput) {
            idleDrift();
          }

          const lerp = hasInput ? 0.15 : 0.07;
          currentX += (targetX - currentX) * lerp;
          currentY += (targetY - currentY) * lerp;

          const dx = currentX - eyeCx;
          const dy = currentY - eyeCy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > maxR) {
            const c = maxR / dist;
            currentX = eyeCx + dx * c;
            currentY = eyeCy + dy * c;
          }

          updateEye(currentX, currentY);
          animFrameId = requestAnimationFrame(animate);
        }

        animFrameId = requestAnimationFrame(animate);

        function screenToSvg(clientX: number, clientY: number) {
          const rect = svg!.getBoundingClientRect();
          const scale = Math.min(2048 / rect.width, 2048 / rect.height);
          const ox = (2048 - rect.width * scale) / 2;
          const oy = (2048 - rect.height * scale) / 2;
          const mx = (clientX - rect.left) * scale + ox;
          const my = (clientY - rect.top) * scale + oy;
          const dx = mx - eyeCx;
          const dy = my - eyeCy;
          const d = Math.sqrt(dx * dx + dy * dy);
          const c = Math.min(d, maxR) / (d || 1);
          return { x: eyeCx + dx * c, y: eyeCy + dy * c };
        }

        function onMouseMove(e: MouseEvent) {
          hasInput = true;
          const p = screenToSvg(e.clientX, e.clientY);
          targetX = p.x;
          targetY = p.y;
        }

        function onTouchMove(e: TouchEvent) {
          hasInput = true;
          const p = screenToSvg(e.touches[0].clientX, e.touches[0].clientY);
          targetX = p.x;
          targetY = p.y;
        }

        function onInputEnd() {
          hasInput = false;
        }

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseleave", onInputEnd);
        document.addEventListener("touchmove", onTouchMove);
        document.addEventListener("touchend", onInputEnd);

        cleanup = () => {
          cancelAnimationFrame(animFrameId);
          document.removeEventListener("mousemove", onMouseMove);
          document.removeEventListener("mouseleave", onInputEnd);
          document.removeEventListener("touchmove", onTouchMove);
          document.removeEventListener("touchend", onInputEnd);
        };
      });

    return () => {
      cleanup?.();
    };
  }, []);

  return <div ref={containerRef} className="face-bg" />;
}

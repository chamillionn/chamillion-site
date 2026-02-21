"use client";

import { useEffect, useRef } from "react";

export default function ChameleonEye() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cleanup: (() => void) | undefined;

    fetch("/assets/face-vector.svg")
      .then((r) => r.text())
      .then((svgText) => {
        container.innerHTML = svgText;
        const svg = container.querySelector("svg");
        if (!svg) return;

        svg.setAttribute("preserveAspectRatio", "xMaxYMax meet");
        svg.removeAttribute("width");
        svg.removeAttribute("height");
        svg.style.width = "100%";
        svg.style.height = "100%";

        // Find existing eye elements in the SVG
        const pupil = svg.querySelector("#path4481") as SVGCircleElement;
        const highlight = svg.querySelector("#path5055") as SVGEllipseElement;
        if (!pupil || !highlight) return;

        // Scale up pupil and highlight
        pupil.setAttribute("r", "150");
        highlight.setAttribute("rx", "50");
        highlight.setAttribute("ry", "36");

        const SVG_W = 3546.9966;
        const SVG_H = 4096;
        // Eye center in g#g58 local coords
        const eyeCx = 1987.8372;
        const eyeCy = 1730.8035;
        // Highlight offset from pupil center
        const hlDx = 1986.0936 - 1987.8372; // -1.74
        const hlDy = 1668.2083 - 1730.8035; // -62.60
        // g#g58 translate offset (viewBox → g58 local)
        const g58tx = 569.32549;
        const g58ty = 28.033902;
        const maxR = 160;

        let targetX = eyeCx;
        let targetY = eyeCy;
        let currentX = eyeCx;
        let currentY = eyeCy;
        let hasInput = false;
        let animFrameId: number;

        function updateEye(px: number, py: number) {
          pupil.setAttribute("cx", String(px));
          pupil.setAttribute("cy", String(py));
          highlight.setAttribute("cx", String(px + hlDx));
          highlight.setAttribute("cy", String(py + hlDy));
        }

        // Organic jitter — always active, adds life even while tracking mouse
        let jitterX = 0;
        let jitterY = 0;
        let jitterGoalX = 0;
        let jitterGoalY = 0;
        let nextJitter = performance.now() + 500 + Math.random() * 1500;
        const jitterR = 28; // micro-tremor range

        // Idle saccades — chameleons scan constantly
        let idleGoalX = eyeCx;
        let idleGoalY = eyeCy;
        let nextSaccade = performance.now() + 300 + Math.random() * 800;

        function pickNewGaze() {
          const angle = Math.random() * Math.PI * 2;
          const dist = (Math.random() * 0.3 + 0.65) * maxR;
          idleGoalX = eyeCx + Math.cos(angle) * dist;
          idleGoalY = eyeCy + Math.sin(angle) * dist;
          nextSaccade = performance.now() + 250 + Math.random() * 1000;
        }

        function updateJitter() {
          const now = performance.now();
          if (now >= nextJitter) {
            const a = Math.random() * Math.PI * 2;
            const d = Math.random() * jitterR;
            jitterGoalX = Math.cos(a) * d;
            jitterGoalY = Math.sin(a) * d;
            nextJitter = now + 150 + Math.random() * 600;
          }
          jitterX += (jitterGoalX - jitterX) * 0.06;
          jitterY += (jitterGoalY - jitterY) * 0.06;
        }

        function animate() {
          updateJitter();

          if (!hasInput) {
            if (performance.now() >= nextSaccade) pickNewGaze();
            targetX = idleGoalX;
            targetY = idleGoalY;
          }

          const distToTarget = Math.sqrt(
            (targetX - currentX) ** 2 + (targetY - currentY) ** 2
          );
          let lerp: number;
          if (hasInput) {
            lerp = 0.15;
          } else if (distToTarget > 5) {
            lerp = 0.12;
          } else {
            lerp = 0.04;
          }
          currentX += (targetX - currentX) * lerp;
          currentY += (targetY - currentY) * lerp;

          // Apply jitter on top
          let finalX = currentX + jitterX;
          let finalY = currentY + jitterY;

          const dx = finalX - eyeCx;
          const dy = finalY - eyeCy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > maxR) {
            const c = maxR / dist;
            finalX = eyeCx + dx * c;
            finalY = eyeCy + dy * c;
          }

          updateEye(finalX, finalY);
          animFrameId = requestAnimationFrame(animate);
        }

        animFrameId = requestAnimationFrame(animate);

        function screenToSvg(clientX: number, clientY: number) {
          const rect = svg!.getBoundingClientRect();
          const scale = Math.min(SVG_W / rect.width, SVG_H / rect.height);
          // xMax: SVG aligned right; yMax: SVG aligned bottom
          const ox = SVG_W - rect.width * scale;
          const oy = SVG_H - rect.height * scale;
          // Convert to viewBox coords, then to g#g58 local coords
          const mx = (clientX - rect.left) * scale + ox + g58tx;
          const my = (clientY - rect.top) * scale + oy + g58ty;
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

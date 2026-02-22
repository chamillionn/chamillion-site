"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import ChameleonEye from "@/components/chameleon-eye";
import FinancialBg from "@/components/financial-bg";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isHub = pathname.startsWith("/hub");
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

  return (
    <>
      {isHub ? <FinancialBg /> : <ChameleonEye />}
      <div ref={glowRef} className="cursor-glow" />
      {children}
    </>
  );
}

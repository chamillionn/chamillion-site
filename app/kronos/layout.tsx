import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { template: "%s — Kronos", default: "Kronos" },
};

export default function KronosPublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

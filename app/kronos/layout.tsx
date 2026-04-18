import type { Metadata } from "next";
import PublicKronosHeader from "./public-header";

export const metadata: Metadata = {
  title: { template: "%s — Kronos", default: "Kronos" },
};

export default function KronosPublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PublicKronosHeader />
      {children}
    </>
  );
}

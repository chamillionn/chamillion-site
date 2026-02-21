import type { Metadata } from "next";
import { DM_Mono, DM_Serif_Display } from "next/font/google";
import "./globals.css";

const dmMono = DM_Mono({
  weight: ["300", "400", "500"],
  subsets: ["latin"],
  variable: "--font-dm-mono",
});

const dmSerif = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-dm-serif",
});

export const metadata: Metadata = {
  title: "Chamillion",
  description:
    "Newsletter sobre DeFi y mercados crypto. 500 € invertidos en DeFi, documentados on-chain.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${dmMono.variable} ${dmSerif.variable}`}>
      <body>{children}</body>
    </html>
  );
}

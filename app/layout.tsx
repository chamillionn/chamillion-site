import type { Metadata } from "next";
import {
  DM_Mono,
  DM_Serif_Display,
  Playfair_Display,
  Source_Sans_3,
  JetBrains_Mono,
} from "next/font/google";
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

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source-sans",
});

const jetbrainsMono = JetBrains_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "Chamillion",
  description:
    "Documentando la vanguardia de los mercados financieros, y haciendo dinero. Con un ojo en cada pantalla.",
  openGraph: {
    title: "Chamillion",
    description:
      "Documentando la vanguardia de los mercados financieros, y haciendo dinero. Con un ojo en cada pantalla.",
    siteName: "Chamillion",
    type: "website",
    images: [{ url: "/og-image.png", width: 1388, height: 1388 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Chamillion",
    description:
      "Documentando la vanguardia de los mercados financieros, y haciendo dinero. Con un ojo en cada pantalla.",
    creator: "@chamillionnnnn",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning className={`${dmMono.variable} ${dmSerif.variable} ${playfair.variable} ${sourceSans.variable} ${jetbrainsMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}

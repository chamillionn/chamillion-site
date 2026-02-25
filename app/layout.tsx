import type { Metadata } from "next";
import Script from "next/script";
import {
  DM_Mono,
  Playfair_Display,
  Source_Sans_3,
  JetBrains_Mono,
  Instrument_Serif,
  Outfit,
} from "next/font/google";
import ThemeToggle from "@/components/theme-toggle";
import "./globals.css";

const dmMono = DM_Mono({
  weight: ["300", "400", "500"],
  subsets: ["latin"],
  variable: "--font-dm-mono",
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
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

const instrumentSerif = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-instrument-serif",
});

const outfit = Outfit({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-outfit",
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
    <html lang="es" suppressHydrationWarning className={`${dmMono.variable} ${playfair.variable} ${sourceSans.variable} ${jetbrainsMono.variable} ${instrumentSerif.variable} ${outfit.variable}`}>
      <Script id="theme-init" strategy="beforeInteractive">{`
        (function(){
          var t = localStorage.getItem("chamillion-theme");
          if (!t) t = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
          document.documentElement.setAttribute("data-theme", t);
        })();
      `}</Script>
      <body>
        <div className="theme-toggle-fixed">
          <ThemeToggle />
        </div>
        {children}
      </body>
    </html>
  );
}

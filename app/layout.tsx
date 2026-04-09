import type { Metadata } from "next";
import {
  DM_Mono,
  Playfair_Display,
  Source_Sans_3,
  JetBrains_Mono,
  Instrument_Serif,
  Outfit,
} from "next/font/google";
import NavigationProgress from "@/components/nav-progress";
import KeyboardShortcuts from "@/components/keyboard-shortcuts";
import "./globals.css";

const dmMono = DM_Mono({
  weight: ["300", "400", "500"],
  subsets: ["latin"],
  variable: "--font-dm-mono",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-playfair",
  display: "swap",
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-instrument-serif",
  display: "swap",
});

const outfit = Outfit({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://chamillion.site"),
  title: {
    default: "Chamillion",
    template: "%s — Chamillion",
  },
  description:
    "Documentando la vanguardia de los mercados financieros, y haciendo dinero. Con un ojo en cada pantalla.",
  openGraph: {
    title: "Chamillion",
    description:
      "Documentando la vanguardia de los mercados financieros, y haciendo dinero. Con un ojo en cada pantalla.",
    siteName: "Chamillion",
    type: "website",
    locale: "es_ES",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Chamillion",
    description:
      "Documentando la vanguardia de los mercados financieros, y haciendo dinero. Con un ojo en cada pantalla.",
    creator: "@chamillion__",
    images: ["/og-image.jpg"],
  },
  other: {},
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" data-scroll-behavior="smooth" suppressHydrationWarning className={`${dmMono.variable} ${playfair.variable} ${sourceSans.variable} ${jetbrainsMono.variable} ${instrumentSerif.variable} ${outfit.variable}`}>
      <head>
        <link rel="alternate" type="application/rss+xml" title="Chamillion" href="/feed.xml" />
        <link rel="manifest" href="/manifest.json" />
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem("chamillion-theme")}catch(e){t=null}if(!t)t="dark";document.documentElement.setAttribute("data-theme",t);var c=t==="dark"?"#0C0E11":"#e2d5c3";var m=document.querySelector('meta[name=theme-color]');if(!m){m=document.createElement("meta");m.name="theme-color";document.head.appendChild(m)}m.content=c})()` }} />
      </head>
      <body>
        <a href="#main-content" className="skip-to-content">
          Ir al contenido
        </a>
        <NavigationProgress />
        <KeyboardShortcuts />
        <div id="main-content">{children}</div>
      </body>
    </html>
  );
}

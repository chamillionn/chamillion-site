export interface PlatformPreset {
  /** Must match the sync route name: /api/sync/{slug} */
  slug: string;
  name: string;
  type: string;
  url: string;
  description: string;
  /** SVG path(s) for inline icon (24x24 viewBox) */
  icon: string;
  /** Whether this platform has an auto-sync route */
  syncable: boolean;
  /** Build a wallet-specific profile URL */
  profileUrl: (wallet: string) => string;
}

export const KNOWN_PLATFORMS: PlatformPreset[] = [
  {
    slug: "hyperliquid",
    name: "Hyperliquid",
    type: "perps",
    url: "https://app.hyperliquid.xyz",
    description: "DEX de perpetuos y spot on-chain",
    icon: "M13 2L3 14h6l-2 8 10-12h-6l2-8z",
    syncable: true,
    profileUrl: (w) => `https://app.hyperliquid.xyz/explorer/address/${w}`,
  },
  {
    slug: "polymarket",
    name: "Polymarket",
    type: "prediction",
    url: "https://polymarket.com",
    description: "Mercado de predicciones descentralizado",
    icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z",
    syncable: true,
    profileUrl: (w) => `https://polymarket.com/profile/${w}`,
  },
];

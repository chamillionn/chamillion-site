export interface PlatformPreset {
  /** Must match the sync route name: /api/sync/{slug} */
  slug: string;
  name: string;
  type: string;
  url: string;
  description: string;
  /** SVG path(s) for inline icon */
  icon: string;
  /** SVG viewBox for icon, defaults to "0 0 24 24" */
  iconViewBox?: string;
  /** SVG fill-rule for icon path */
  iconFillRule?: "evenodd" | "nonzero";
  /** Whether this platform has an auto-sync route */
  syncable: boolean;
  /** Build a wallet-specific profile URL */
  profileUrl: (wallet: string) => string;
  /** Auto-generated wallet for platforms that don't need a real one */
  autoWallet?: () => string;
}

export const KNOWN_PLATFORMS: PlatformPreset[] = [
  {
    slug: "hyperliquid",
    name: "Hyperliquid",
    type: "perps",
    url: "https://app.hyperliquid.xyz",
    description: "DEX de perpetuos y spot on-chain",
    icon: "M144 71.6991C144 119.306 114.866 134.582 99.5156 120.98C86.8804 109.889 83.1211 86.4521 64.116 84.0456C39.9942 81.0113 37.9057 113.133 22.0334 113.133C3.5504 113.133 0 86.2428 0 72.4315C0 58.3063 3.96809 39.0542 19.736 39.0542C38.1146 39.0542 39.1588 66.5722 62.132 65.1073C85.0007 63.5379 85.4184 34.8689 100.247 22.6271C113.195 12.0593 144 23.4641 144 71.6991Z",
    iconViewBox: "0 0 144 144",
    syncable: true,
    profileUrl: (w) => `https://app.hyperliquid.xyz/explorer/address/${w}`,
  },
  {
    slug: "polymarket",
    name: "Polymarket",
    type: "prediction",
    url: "https://polymarket.com",
    description: "Mercado de predicciones descentralizado",
    icon: "M42.76 24.28V0L0 12.04v28.93l42.76 12.04V24.27zm-4.13-1.16V5.42L7.21 14.27zm-3.08 3.39L4.14 17.66v17.69l31.42-8.85zM7.21 38.75l31.42 8.85V29.89L7.21 38.74v.02z",
    iconViewBox: "0 0 43 53",
    iconFillRule: "evenodd",
    syncable: true,
    profileUrl: (w) => `https://polymarket.com/profile/${w}`,
  },
  {
    slug: "defi-wallet",
    name: "DeFi Wallet",
    type: "wallet",
    url: "https://portfolio.metamask.io",
    description: "Escaneo multi-chain de wallet EVM (ETH, Arb, Polygon, Base...)",
    icon: "M21 18v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1M3 10h18M3 14h18M18 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
    syncable: true,
    profileUrl: (w) => `https://debank.com/profile/${w}`,
  },
  {
    slug: "fakedex",
    name: "FakeDEX",
    type: "dex",
    url: "#",
    description: "Plataforma ficticia para testing en dev",
    icon: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
    syncable: true,
    profileUrl: () => "#",
    autoWallet: () => `0xFAKE${Math.random().toString(16).slice(2, 10)}`,
  },
];

/**
 * Set de iconos para la toolbar. Todos 16×16, stroke 1.5px, currentColor.
 * Diseño editorial: letterforms tipográficas para formato de texto;
 * geometría simple para inserciones.
 */

type IconProps = { className?: string };

const BASE_PROPS = {
  width: 16,
  height: 16,
  viewBox: "0 0 16 16",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  focusable: false,
} as const;

const TEXT_PROPS = {
  width: 16,
  height: 16,
  viewBox: "0 0 16 16",
  fill: "currentColor",
  "aria-hidden": true,
  focusable: false,
} as const;

/* ===== Headings (typographic letterforms in mono) ===== */

export const IconH2 = ({ className }: IconProps) => (
  <svg {...TEXT_PROPS} className={className}>
    <text
      x="1"
      y="12"
      fontFamily="var(--font-dm-mono), monospace"
      fontSize="10"
      fontWeight="700"
      letterSpacing="-0.3"
    >
      H2
    </text>
  </svg>
);

export const IconH3 = ({ className }: IconProps) => (
  <svg {...TEXT_PROPS} className={className}>
    <text
      x="1"
      y="12"
      fontFamily="var(--font-dm-mono), monospace"
      fontSize="10"
      fontWeight="700"
      letterSpacing="-0.3"
    >
      H3
    </text>
  </svg>
);

export const IconBold = ({ className }: IconProps) => (
  <svg {...BASE_PROPS} className={className} strokeWidth="1.8">
    <path d="M4 3h4.5a2.5 2.5 0 0 1 0 5H4zM4 8h5a2.5 2.5 0 0 1 0 5H4z" />
  </svg>
);

export const IconItalic = ({ className }: IconProps) => (
  <svg {...BASE_PROPS} className={className}>
    <path d="M10 3H6M10 13H6M9.5 3 6.5 13" />
  </svg>
);

export const IconUnderline = ({ className }: IconProps) => (
  <svg {...BASE_PROPS} className={className}>
    <path d="M4 3v5a4 4 0 0 0 8 0V3M3.5 14h9" />
  </svg>
);

export const IconCode = ({ className }: IconProps) => (
  <svg {...BASE_PROPS} className={className}>
    <path d="m5.5 5-3 3 3 3M10.5 5l3 3-3 3" />
  </svg>
);

export const IconLink = ({ className }: IconProps) => (
  <svg {...BASE_PROPS} className={className}>
    <path d="M7 5.5H4.5a2.5 2.5 0 0 0 0 5H7M9 5.5h2.5a2.5 2.5 0 0 1 0 5H9M6 8h4" />
  </svg>
);

export const IconBulletList = ({ className }: IconProps) => (
  <svg {...BASE_PROPS} className={className}>
    <circle cx="3" cy="4" r="0.6" fill="currentColor" stroke="none" />
    <circle cx="3" cy="8" r="0.6" fill="currentColor" stroke="none" />
    <circle cx="3" cy="12" r="0.6" fill="currentColor" stroke="none" />
    <path d="M6 4h8M6 8h8M6 12h8" />
  </svg>
);

export const IconOrderedList = ({ className }: IconProps) => (
  <svg {...BASE_PROPS} className={className}>
    <path d="M6 4h8M6 8h8M6 12h8" />
    <text
      x="0.5"
      y="5"
      fontFamily="var(--font-dm-mono), monospace"
      fontSize="4.5"
      fontWeight="700"
      fill="currentColor"
      stroke="none"
    >
      1
    </text>
    <text
      x="0.5"
      y="9"
      fontFamily="var(--font-dm-mono), monospace"
      fontSize="4.5"
      fontWeight="700"
      fill="currentColor"
      stroke="none"
    >
      2
    </text>
    <text
      x="0.5"
      y="13"
      fontFamily="var(--font-dm-mono), monospace"
      fontSize="4.5"
      fontWeight="700"
      fill="currentColor"
      stroke="none"
    >
      3
    </text>
  </svg>
);

/* Pullquote — left curly quote (editorial) */
export const IconQuote = ({ className }: IconProps) => (
  <svg {...BASE_PROPS} className={className}>
    <path d="M5 10c0-3 1.5-4 3-4.5M5 10H3V7c0-2 1-3 2.5-3.5M11 10c0-3 1.5-4 3-4.5M11 10H9V7c0-2 1-3 2.5-3.5" />
  </svg>
);

/* Callout / highlight — asterisk-like mark (distinct from quote) */
export const IconCallout = ({ className }: IconProps) => (
  <svg {...BASE_PROPS} className={className}>
    <path d="M8 2v12M2.5 5l11 6M13.5 5l-11 6" />
  </svg>
);

/* Image — frame with small sun + mountain */
export const IconImage = ({ className }: IconProps) => (
  <svg {...BASE_PROPS} className={className}>
    <rect x="2" y="3" width="12" height="10" rx="1.2" />
    <circle cx="6" cy="6.5" r="1" />
    <path d="m2.5 11 3.5-3 3 3 2-2 2.5 2.5" />
  </svg>
);

/* Widget — square with two stacked bars (dashboard vibe) */
export const IconWidget = ({ className }: IconProps) => (
  <svg {...BASE_PROPS} className={className} strokeDasharray="1.8 1.8">
    <rect x="2" y="3" width="12" height="10" rx="1.2" />
    <path d="M5 9v2M8 7v4M11 10v1" strokeDasharray="0" />
  </svg>
);

export const IconDivider = ({ className }: IconProps) => (
  <svg {...BASE_PROPS} className={className}>
    <path d="M2 8h12" strokeDasharray="0.2 3" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M4 8h8" opacity="0.3" />
  </svg>
);

/* Polymarket — prediction market (barras de probabilidad + marco) */
export const IconPolymarket = ({ className }: IconProps) => (
  <svg {...BASE_PROPS} className={className}>
    <rect x="2" y="3" width="12" height="10" rx="1.2" />
    <path d="M5 10V6M8 10V4.5M11 10v-2" strokeWidth="1.6" />
    <path d="M4 12.5h8" opacity="0.35" />
  </svg>
);

/* Tweet (X) — logo X glyph simplificado */
export const IconTweet = ({ className }: IconProps) => (
  <svg {...TEXT_PROPS} className={className}>
    <path d="M11.3 2.5h2.1l-4.6 5.25 5.4 7.25H9.96L6.7 10.66l-3.73 4.34H.86l4.9-5.62L.58 2.5h4.35l2.95 3.9zm-.74 11.27h1.16L5.49 3.64H4.25z" />
  </svg>
);

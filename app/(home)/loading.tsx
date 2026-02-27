import { V } from "@/lib/theme";

const bar = {
  background: V.bgCard,
  borderRadius: 6,
  animation: "shimmer 1.8s ease-in-out infinite",
} as const;

const card = {
  ...bar,
  borderRadius: 10,
  border: `1px solid ${V.border}`,
} as const;

export default function HomeLoading() {
  return (
    <div style={{ minHeight: "100dvh", background: V.bgDark }}>
      {/* Nav */}
      <nav
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "28px 24px",
          maxWidth: 1100,
          margin: "0 auto",
        }}
      >
        <div style={{ ...bar, width: 140, height: 22 }} />
        <div style={{ display: "flex", gap: 20 }}>
          <div style={{ ...bar, width: 60, height: 16 }} />
          <div style={{ ...bar, width: 60, height: 16 }} />
          <div style={{ ...bar, width: 24, height: 24, borderRadius: "50%" }} />
        </div>
      </nav>

      {/* Hero + portfolio area */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "60px 24px 0" }}>
        {/* Title */}
        <div style={{ ...bar, width: 280, height: 48, marginBottom: 16 }} />
        {/* Subtitle */}
        <div style={{ ...bar, width: 400, height: 16, marginBottom: 8 }} />
        <div style={{ ...bar, width: 320, height: 16, marginBottom: 48 }} />

        {/* Stats row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
            gap: 12,
            marginBottom: 32,
          }}
        >
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ ...card, height: 72, animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>

        {/* Chart + donut area */}
        <div style={{ display: "flex", gap: 24, marginBottom: 40 }}>
          <div style={{ ...card, flex: 1, height: 200 }} />
          <div
            style={{
              ...bar,
              width: 185,
              height: 185,
              borderRadius: "50%",
              flexShrink: 0,
              animationDelay: "0.2s",
            }}
          />
        </div>
      </div>
    </div>
  );
}

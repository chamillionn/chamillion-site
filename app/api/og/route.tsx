import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";

const WIDTH = 1200;
const HEIGHT = 630;

/**
 * GET /api/og?title=...&subtitle=...&banner=...
 * Generates a dynamic Open Graph image with the post title overlaid
 * on the banner image, plus Chamillion branding.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const title = searchParams.get("title") ?? "Chamillion";
  const subtitle = searchParams.get("subtitle") ?? "";
  const banner = searchParams.get("banner"); // e.g. /assets/newsletter/banner-post-01.jpeg

  // Load logo for branding
  let logoSrc: string | null = null;
  try {
    const logoData = await readFile(join(process.cwd(), "app/icon-base.png"));
    logoSrc = `data:image/png;base64,${logoData.toString("base64")}`;
  } catch { /* no logo fallback */ }

  // Load banner image if provided
  let bannerSrc: string | null = null;
  if (banner) {
    try {
      const bannerPath = join(process.cwd(), "public", banner);
      const bannerData = await readFile(bannerPath);
      const ext = banner.endsWith(".png") ? "png" : "jpeg";
      bannerSrc = `data:image/${ext};base64,${bannerData.toString("base64")}`;
    } catch { /* no banner fallback */ }
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: WIDTH,
          height: HEIGHT,
          display: "flex",
          position: "relative",
          background: "#0C0E11",
        }}
      >
        {/* Banner background */}
        {bannerSrc && (
          <img
            src={bannerSrc}
            alt=""
            width={WIDTH}
            height={HEIGHT}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: WIDTH,
              height: HEIGHT,
              objectFit: "cover",
              opacity: 0.35,
            }}
          />
        )}

        {/* Gradient overlay */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: WIDTH,
            height: HEIGHT,
            display: "flex",
            background: "linear-gradient(to top, rgba(12,14,17,0.95) 30%, rgba(12,14,17,0.4) 100%)",
          }}
        />

        {/* Content */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            padding: "60px 64px",
            width: "100%",
            height: "100%",
          }}
        >
          {/* Title */}
          <div
            style={{
              fontSize: title.length > 40 ? 48 : 56,
              fontWeight: 700,
              color: "#E8EAED",
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              marginBottom: subtitle ? 16 : 24,
              maxWidth: "90%",
            }}
          >
            {title}
          </div>

          {/* Subtitle */}
          {subtitle && (
            <div
              style={{
                fontSize: 22,
                color: "#8B9099",
                lineHeight: 1.5,
                fontWeight: 300,
                marginBottom: 24,
                maxWidth: "75%",
              }}
            >
              {subtitle}
            </div>
          )}

          {/* Branding bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            {logoSrc && (
              <img
                src={logoSrc}
                alt=""
                width={36}
                height={36}
                style={{ borderRadius: 8 }}
              />
            )}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
              }}
            >
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: "#6B8EA0",
                  letterSpacing: "0.04em",
                }}
              >
                CHAMILLION
              </span>
              <span
                style={{
                  fontSize: 13,
                  color: "#7A7F89",
                  letterSpacing: "0.02em",
                }}
              >
                chamillion.site
              </span>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
      headers: {
        "Cache-Control": "public, s-maxage=31536000, immutable",
      },
    },
  );
}

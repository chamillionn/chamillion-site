import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const IS_DEV = !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("hpyyuftotmpnzogaykgh");

export default async function Icon() {
  const base = await readFile(join(process.cwd(), "app/icon-base.png"));
  const b64 = `data:image/png;base64,${base.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          display: "flex",
          position: "relative",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={b64} alt="" width={180} height={180} />
        {IS_DEV && (
          <div
            style={{
              position: "absolute",
              bottom: 4,
              right: 4,
              background: "#e53e3e",
              color: "#fff",
              fontSize: 28,
              fontWeight: 800,
              padding: "2px 8px",
              borderRadius: 6,
              lineHeight: 1.2,
              letterSpacing: "-0.5px",
            }}
          >
            DEV
          </div>
        )}
      </div>
    ),
    { ...size },
  );
}

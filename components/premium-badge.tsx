"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { V } from "@/lib/theme";

interface Props {
  /** When provided, uses CSS class instead of inline styles.
   *  The class should handle all styling (font, color, etc.) */
  className?: string;
}

/**
 * Shows "Premium" badge next to branding when the logged-in
 * user has member or admin role.
 * Renders nothing for free users or when not logged in.
 */
export default function PremiumBadge({ className }: Props) {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data?.role === "admin" || data?.role === "member") {
            setLabel("Premium");
          }
        });
    });
  }, []);

  if (!label) return null;

  if (className) {
    return <span className={className}>{label}</span>;
  }

  return (
    <span
      style={{
        fontFamily: "var(--font-jetbrains), monospace",
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: "0.06em",
        color: V.steel,
        textTransform: "uppercase",
      }}
    >
      <span style={{ color: V.textMuted, marginRight: 8 }}>·</span>
      {label}
    </span>
  );
}

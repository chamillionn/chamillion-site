"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { V, steelA } from "@/lib/theme";

interface UserState {
  email: string;
  displayName: string | null;
  role: "free" | "member" | "admin";
}

export default function UserMenu({ variant = "compact", onNavigate }: { variant?: "compact" | "expanded" | "pill"; onNavigate?: () => void }) {
  const [user, setUser] = useState<UserState | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();

    (async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) return;

        const { data: profile } = await supabase
          .from("profiles")
          .select("email, display_name, role")
          .eq("id", authUser.id)
          .single();

        if (profile) {
          setUser({
            email: profile.email,
            displayName: profile.display_name,
            role: profile.role as UserState["role"],
          });
        }
      } catch {
        // Auth or profile fetch failed — stay logged out
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  if (loading) {
    return variant === "expanded" ? null : <div style={{ width: 28, height: 28 }} />;
  }

  // Not logged in — show "Acceder" link
  if (!user) {
    const pillStyle: React.CSSProperties = {
      fontFamily: "var(--font-dm-mono), monospace",
      fontSize: 12,
      fontWeight: 500,
      letterSpacing: "0.03em",
      color: V.steel,
      textDecoration: "none",
      padding: "6px 14px",
      border: `1px solid ${steelA(0.3)}`,
      borderRadius: 6,
      background: steelA(0.08),
      transition: "background 0.2s, border-color 0.2s",
    };

    const expandedStyle: React.CSSProperties = {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "12px 10px",
      fontSize: 14,
      fontWeight: 500,
      color: V.textPrimary,
      textDecoration: "none",
      borderRadius: 8,
    };

    const compactStyle: React.CSSProperties = {
      color: V.textSecondary,
      textDecoration: "none",
      fontSize: 13,
      fontWeight: 500,
      letterSpacing: "-0.01em",
      transition: "color 0.2s",
    };

    const style = variant === "expanded" ? expandedStyle : variant === "pill" ? pillStyle : compactStyle;

    return (
      <Link
        href="/login"
        onClick={onNavigate}
        style={style}
        onMouseEnter={variant === "compact" ? (e) =>
          (e.currentTarget.style.color = "var(--text-primary)")
          : variant === "pill" ? (e) => {
            e.currentTarget.style.background = steelA(0.14);
            e.currentTarget.style.borderColor = steelA(0.5);
          } : undefined
        }
        onMouseLeave={variant === "compact" ? (e) =>
          (e.currentTarget.style.color = "var(--text-secondary)")
          : variant === "pill" ? (e) => {
            e.currentTarget.style.background = steelA(0.08);
            e.currentTarget.style.borderColor = steelA(0.3);
          } : undefined
        }
      >
        {variant === "expanded" && (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: V.textSecondary }}>
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
            <polyline points="10 17 15 12 10 7" />
            <line x1="15" y1="12" x2="3" y2="12" />
          </svg>
        )}
        Acceder
      </Link>
    );
  }

  // Logged in — avatar + dropdown
  const initial = (
    user.displayName?.[0] ||
    user.email[0] ||
    "?"
  ).toUpperCase();

  const isPremium = user.role === "member" || user.role === "admin";

  // ── Expanded variant for mobile drawers ──
  if (variant === "expanded") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {/* User card */}
        <div style={{
          padding: "10px 12px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          background: steelA(0.06),
          borderRadius: 10,
          border: `1px solid ${steelA(0.1)}`,
        }}>
          <div style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: steelA(0.15),
            border: `1px solid ${steelA(0.3)}`,
            color: V.steel,
            fontSize: 13,
            fontWeight: 600,
            fontFamily: "var(--font-dm-mono), monospace",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}>
            {initial}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: V.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user.displayName || user.email.split("@")[0]}
            </div>
            <div style={{ fontSize: 11, color: V.textMuted, fontFamily: "var(--font-jetbrains), monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 1 }}>
              {user.email}
            </div>
          </div>
          {isPremium && (
            <div style={{
              fontSize: 9,
              fontFamily: "var(--font-dm-mono), monospace",
              fontWeight: 500,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: V.steel,
              background: steelA(0.12),
              border: `1px solid ${steelA(0.25)}`,
              borderRadius: 4,
              padding: "2px 6px",
              flexShrink: 0,
            }}>
              {user.role === "admin" ? "Admin" : "Premium"}
            </div>
          )}
        </div>

        {/* Account links */}
        <Link
          href="/cuenta"
          onClick={onNavigate}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 10px",
            fontSize: 14,
            fontWeight: 500,
            color: V.textPrimary,
            textDecoration: "none",
            borderRadius: 8,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: V.textSecondary }}>
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          Mi cuenta
        </Link>

        {user.role === "admin" && (
          <Link
            href="/admin"
            onClick={onNavigate}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 10px",
              fontSize: 14,
              fontWeight: 500,
              color: V.textPrimary,
              textDecoration: "none",
              borderRadius: 8,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: V.textSecondary }}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Admin
          </Link>
        )}

        <button
          onClick={handleLogout}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            width: "100%",
            padding: "12px 10px",
            fontSize: 14,
            fontWeight: 500,
            color: V.red,
            background: "none",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            textAlign: "left",
            fontFamily: "inherit",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Cerrar sesion
        </button>
      </div>
    );
  }

  // ── Compact variant (default) — avatar + dropdown ──
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Menu de usuario"
        title={isPremium ? (user.role === "admin" ? "Admin" : "Premium") : undefined}
        style={{
          position: "relative",
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: steelA(0.15),
          border: `1px solid ${steelA(0.3)}`,
          color: V.steel,
          fontSize: 12,
          fontWeight: 600,
          fontFamily: "var(--font-dm-mono), monospace",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "border-color 0.2s",
          padding: 0,
        }}
      >
        {initial}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: 220,
            background: V.bgCard,
            border: `1px solid ${V.border}`,
            borderRadius: 10,
            padding: 6,
            zIndex: 200,
            boxShadow: `0 8px 24px ${V.shadowDropdown}`,
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          {/* Email + role badge */}
          <div
            style={{
              padding: "8px 10px 8px",
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: V.textMuted,
                fontFamily: "var(--font-jetbrains), monospace",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {user.email}
            </div>
            {isPremium && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 10,
                  fontFamily: "var(--font-dm-mono), monospace",
                  fontWeight: 500,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: V.steel,
                  background: steelA(0.1),
                  border: `1px solid ${steelA(0.25)}`,
                  borderRadius: 4,
                  padding: "2px 7px",
                  width: "fit-content",
                }}
              >
                <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                {user.role === "admin" ? "Admin" : "Premium"}
              </div>
            )}
          </div>

          <div
            style={{
              height: 1,
              background: V.border,
              margin: "2px 0",
            }}
          />

          {/* Mi cuenta */}
          <Link
            href="/cuenta"
            onClick={() => setOpen(false)}
            style={{
              display: "block",
              padding: "8px 10px",
              fontSize: 13,
              fontWeight: 500,
              color: V.textPrimary,
              textDecoration: "none",
              borderRadius: 6,
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = steelA(0.06))
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            Mi cuenta
          </Link>

          {/* Admin link */}
          {user.role === "admin" && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              style={{
                display: "block",
                padding: "8px 10px",
                fontSize: 13,
                fontWeight: 500,
                color: V.textPrimary,
                textDecoration: "none",
                borderRadius: 6,
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = steelA(0.06))
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              Admin
            </Link>
          )}

          <div
            style={{
              height: 1,
              background: V.border,
              margin: "2px 0",
            }}
          />

          {/* Logout */}
          <button
            onClick={handleLogout}
            style={{
              display: "block",
              width: "100%",
              padding: "8px 10px",
              fontSize: 13,
              fontWeight: 500,
              color: V.red,
              background: "none",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              textAlign: "left",
              fontFamily: "inherit",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = steelA(0.06))
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            Cerrar sesion
          </button>
        </div>
      )}
    </div>
  );
}

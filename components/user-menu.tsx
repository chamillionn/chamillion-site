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

export default function UserMenu() {
  const [user, setUser] = useState<UserState | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user: authUser } }) => {
      if (!authUser) {
        setLoading(false);
        return;
      }

      supabase
        .from("profiles")
        .select("email, display_name, role")
        .eq("id", authUser.id)
        .single()
        .then(({ data: profile }) => {
          if (profile) {
            setUser({
              email: profile.email,
              displayName: profile.display_name,
              role: profile.role as UserState["role"],
            });
          }
          setLoading(false);
        });
    });
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
    return <div style={{ width: 28, height: 28 }} />;
  }

  // Not logged in — show "Acceder" link
  if (!user) {
    return (
      <Link
        href="/login"
        style={{
          color: V.textSecondary,
          textDecoration: "none",
          fontSize: 13,
          fontWeight: 500,
          letterSpacing: "-0.01em",
          transition: "color 0.2s",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.color = "var(--text-primary)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.color = "var(--text-secondary)")
        }
      >
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

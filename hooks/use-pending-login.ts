"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { createPendingLogin } from "@/app/auth/confirm/actions";

/**
 * Poll for cross-device magic link verification.
 * When `active` is true, creates a pending_login row and polls every 3 s.
 * If another device verifies the magic link, auto-authenticates this device.
 */
export function usePendingLogin(
  email: string | null,
  active: boolean,
  onAuthenticated: () => void,
) {
  const callbackRef = useRef(onAuthenticated);
  callbackRef.current = onAuthenticated;

  useEffect(() => {
    if (!active || !email) return;

    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | null = null;

    createPendingLogin(email)
      .then((pendingId) => {
        if (cancelled) return;

        interval = setInterval(async () => {
          if (cancelled) return;
          try {
            const res = await fetch(`/api/auth/poll?id=${pendingId}`);
            if (res.status === 410 || res.status === 404) {
              if (interval) clearInterval(interval);
              return;
            }
            const data = await res.json();

            if (data.status === "verified" && data.token_hash) {
              if (interval) clearInterval(interval);
              const supabase = createClient();
              const { error } = await supabase.auth.verifyOtp({
                token_hash: data.token_hash,
                type: "magiclink",
              });
              if (!error && !cancelled) {
                callbackRef.current();
              }
            }
          } catch {
            // Network error — skip this cycle
          }
        }, 3000);
      })
      .catch(() => {
        // Failed to create pending login — polling won't start
      });

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
  }, [active, email]);
}

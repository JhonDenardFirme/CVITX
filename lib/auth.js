// lib/auth.js

import { useCallback, useEffect, useState } from "react";

/**
 * We broadcast this event after sign-in/sign-out so any mounted
 * useUser() hooks in other tabs/components can refresh.
 */
const AUTH_EVENT = "cvx-auth-changed";

/**
 * useUser()
 * Fetches /api/auth/me and returns { user, ready, refresh }.
 * - ready: true once the first fetch completes (success or 401)
 * - refresh(): re-fetch current user on demand
 */
export function useUser(options = {}) {
  const { auto = true } = options;
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (!res.ok) {
        // 401 or any error -> treat as signed out
        setUser(null);
      } else {
        const data = await res.json();
        setUser(data || null);
      }
    } catch {
      setUser(null);
    } finally {
      setReady(true);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (auto) refresh();
  }, [auto, refresh]);

  // React to global auth changes across the app/tabs
  useEffect(() => {
    const onAuthChange = () => refresh();
    if (typeof window !== "undefined") {
      window.addEventListener(AUTH_EVENT, onAuthChange);
      return () => window.removeEventListener(AUTH_EVENT, onAuthChange);
    }
  }, [refresh]);

  return { user, ready, refresh };
}

/**
 * signIn(email, password)
 * - Calls Next API: POST /api/auth/signin
 * - On success, server sets the httpOnly session cookie.
 * - Returns the user payload.
 */
export async function signIn(email, password) {
  const res = await fetch("/api/auth/signin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const msg = await safeText(res);
    throw new Error(msg || "Sign-in failed");
  }

  const user = await res.json();

  // Notify any listeners (other components/tabs) to refresh their user state.
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(AUTH_EVENT));
  }

  return user;
}

/**
 * signOut()
 * - Calls Next API: POST /api/auth/signout
 * - Clears httpOnly cookie server-side.
 */
export async function signOut() {
  try {
    await fetch("/api/auth/signout", { method: "POST" });
  } finally {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(AUTH_EVENT));
    }
  }
}

/* ----------------- tiny helpers ----------------- */

async function safeText(res) {
  try {
    return await res.text();
  } catch {
    return "";
  }
}

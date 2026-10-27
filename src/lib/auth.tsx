import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  getCurrentUser,
  signInServerFn,
  signUpServerFn,
  signOutServerFn,
  updateProfileServerFn,
  type SafeUser,
} from "@/backend/auth-actions";

export type Client = {
  id: string;
  email: string;
  name: string;
  site: string;
  capacityKw: number;
  role: "admin" | "client";
  createdAt?: string;
};

export const DEMO_CREDENTIALS = { email: "demo@solarsense.io", password: "demo1234" };

const STORAGE_CACHE_KEY = "solarsense.session.cache";

type AuthValue = {
  client: Client | null;
  ready: boolean;
  signIn: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signUp: (data: {
    email: string;
    password: string;
    name: string;
    site?: string;
    capacityKw?: number;
  }) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: {
    name?: string;
    site?: string;
    capacityKw?: number;
  }) => Promise<{ ok: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [client, setClient] = useState<Client | null>(() => {
    // Optimistic hydration cache from localStorage for instant rendering
    if (typeof window !== "undefined") {
      try {
        const raw = window.localStorage.getItem(STORAGE_CACHE_KEY);
        if (raw) return JSON.parse(raw) as Client;
      } catch {
        /* ignore */
      }
    }
    return null;
  });
  const [ready, setReady] = useState(false);

  // Sync with real backend HTTP-only cookie session
  const refreshUser = useCallback(async () => {
    try {
      const res = await getCurrentUser();
      if (res?.user) {
        setClient(res.user);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify(res.user));
        }
      } else {
        setClient(null);
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(STORAGE_CACHE_KEY);
        }
      }
    } catch (err) {
      console.warn("Backend session check:", err);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const res = await signInServerFn({ data: { email, password } });
      if (!res.ok || !res.user) {
        return { ok: false, error: res.error ?? "Invalid credentials" };
      }
      setClient(res.user);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify(res.user));
      }
      return { ok: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Network error during sign-in";
      return { ok: false, error: msg };
    }
  }, []);

  const signUp = useCallback(
    async (data: {
      email: string;
      password: string;
      name: string;
      site?: string;
      capacityKw?: number;
    }) => {
      try {
        const res = await signUpServerFn({ data });
        if (!res.ok || !res.user) {
          return { ok: false, error: res.error ?? "Registration failed" };
        }
        setClient(res.user);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify(res.user));
        }
        return { ok: true };
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Network error during registration";
        return { ok: false, error: msg };
      }
    },
    [],
  );

  const signOut = useCallback(async () => {
    try {
      await signOutServerFn();
    } catch {
      /* ignore */
    } finally {
      setClient(null);
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(STORAGE_CACHE_KEY);
      }
    }
  }, []);

  const updateProfile = useCallback(
    async (updates: { name?: string; site?: string; capacityKw?: number }) => {
      try {
        const res = await updateProfileServerFn({ data: updates });
        if (!res.ok || !res.user) {
          return { ok: false, error: res.error ?? "Update failed" };
        }
        setClient(res.user);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify(res.user));
        }
        return { ok: true };
      } catch (err) {
        return {
          ok: false,
          error: err instanceof Error ? err.message : "Network error during update",
        };
      }
    },
    [],
  );

  const value = useMemo(
    () => ({
      client,
      ready,
      signIn,
      signUp,
      signOut,
      updateProfile,
      refreshUser,
    }),
    [client, ready, signIn, signUp, signOut, updateProfile, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

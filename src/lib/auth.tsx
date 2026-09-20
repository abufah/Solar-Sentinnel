import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type Client = {
  email: string;
  name: string;
  site: string;
  capacityKw: number;
};

const CLIENTS: Record<string, { password: string; client: Client }> = {
  "demo@solarsense.io": {
    password: "demo1234",
    client: {
      email: "demo@solarsense.io",
      name: "Demo Evaluator",
      site: "Campus Rooftop Array — Block C",
      capacityKw: 4,
    },
  },
  "client@greenfield.in": {
    password: "green1234",
    client: {
      email: "client@greenfield.in",
      name: "Greenfield Industries",
      site: "Greenfield Plant — Shed 2",
      capacityKw: 4,
    },
  },
};

export const DEMO_CREDENTIALS = { email: "demo@solarsense.io", password: "demo1234" };

const STORAGE_KEY = "solarsense.session";

type AuthValue = {
  client: Client | null;
  ready: boolean;
  signIn: (email: string, password: string) => { ok: boolean; error?: string };
  signOut: () => void;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [client, setClient] = useState<Client | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setClient(JSON.parse(raw) as Client);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  const signIn = useCallback((email: string, password: string) => {
    const record = CLIENTS[email.trim().toLowerCase()];
    if (!record || record.password !== password) {
      return { ok: false, error: "Invalid credentials. Try the demo login." };
    }
    setClient(record.client);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record.client));
    return { ok: true };
  }, []);

  const signOut = useCallback(() => {
    setClient(null);
    window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo(() => ({ client, ready, signIn, signOut }), [client, ready, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

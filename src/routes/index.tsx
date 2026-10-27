import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Activity,
  Gauge,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Sun,
  User,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModernLoader, PulseIndicator } from "@/components/ui/ModernLoader";
import { DEMO_CREDENTIALS, useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Client Portal — SolarSense Predictive Maintenance" },
      {
        name: "description",
        content:
          "Sign in or register to monitor your solar array: live electrical telemetry, shading analysis, hotspot detection and predictive component diagnostics.",
      },
      { property: "og:title", content: "Client Portal — SolarSense Predictive Maintenance" },
      { property: "og:type", content: "website" },
      {
        property: "og:description",
        content: "Secure client portal for solar PV monitoring and predictive maintenance.",
      },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { client, ready, signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<"signin" | "signup">("signin");

  // Sign in state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Sign up state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regSite, setRegSite] = useState("");
  const [regCapacity, setRegCapacity] = useState("4.0");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ready && client) {
      navigate({ to: "/dashboard", replace: true });
    }
  }, [ready, client, navigate]);

  const handleSignIn = async (mail: string, pass: string) => {
    setBusy(true);
    setError(null);
    const result = await signIn(mail, pass);
    if (!result.ok) {
      setBusy(false);
      setError(result.error ?? "Sign-in failed");
      return;
    }
    toast.success("Welcome back — loading your array telemetry");
    navigate({ to: "/dashboard" });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const capNum = parseFloat(regCapacity);
    const result = await signUp({
      name: regName,
      email: regEmail,
      password: regPassword,
      site: regSite.trim() || undefined,
      capacityKw: isNaN(capNum) ? 4.0 : capNum,
    });

    if (!result.ok) {
      setBusy(false);
      setError(result.error ?? "Registration failed");
      return;
    }

    toast.success("Account created! Welcome to SolarSense.");
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
        {/* Brand / context panel */}
        <div className="relative hidden overflow-hidden border-r border-border bg-surface p-12 lg:flex lg:flex-col lg:justify-between">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.15]"
            style={{
              backgroundImage:
                "linear-gradient(var(--grid) 1px, transparent 1px), linear-gradient(90deg, var(--grid) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
            }}
          />
          <div className="relative">
            <div className="flex items-center gap-2 text-primary">
              <Sun className="size-6 text-solar" />
              <span className="font-display text-xl font-bold tracking-tight">SolarSense</span>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                Backend Auth Active
              </span>
            </div>
            <h1 className="mt-14 max-w-lg font-display text-4xl font-bold leading-tight text-foreground">
              Predictive maintenance for your solar array
            </h1>
            <p className="mt-5 max-w-md text-base text-muted-foreground">
              Continuous electrical telemetry, panel-level thermal health, shading analysis and
              machine-learning failure prediction — backed by persistent server-side authentication.
            </p>
            <div className="mt-12 grid max-w-md grid-cols-2 gap-4">
              {[
                { icon: Zap, label: "Live V / I / P / Yield" },
                { icon: Gauge, label: "Shading & loss analysis" },
                { icon: Activity, label: "Hotspot + diode diagnostics" },
                { icon: ShieldCheck, label: "Secure session cookies & audit log" },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="rounded-xl border border-border bg-card/60 p-4 backdrop-blur"
                >
                  <Icon className="size-5 text-primary" />
                  <p className="mt-3 text-sm font-medium text-foreground">{label}</p>
                </div>
              ))}
            </div>
          </div>
          <p className="relative text-xs text-muted-foreground">
            Final year engineering project · SQLite session management & password hashing
          </p>
        </div>

        {/* Auth form */}
        <div className="flex items-center justify-center p-6 sm:p-12">
          <Card className="w-full max-w-md border-border p-8 shadow-lg">
            <div className="flex items-center gap-2 text-primary lg:hidden">
              <Sun className="size-5 text-solar" />
              <span className="font-display text-lg font-bold">SolarSense</span>
            </div>

            <Tabs
              value={mode}
              onValueChange={(v) => {
                setMode(v as "signin" | "signup");
                setError(null);
              }}
              className="mt-4"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Register Plant</TabsTrigger>
              </TabsList>

              {/* Sign In Tab */}
              <TabsContent value="signin" className="mt-6">
                <div>
                  <h2 className="font-display text-2xl font-bold text-foreground">
                    Client sign in
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Use your plant credentials to access your live array.
                  </p>
                </div>

                <form
                  className="mt-6 space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSignIn(email, password);
                  }}
                >
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@plant.com"
                        className="pl-9"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        autoComplete="current-password"
                        placeholder="••••••••"
                        className="pl-9"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {error ? (
                    <p className="rounded-md border border-critical/40 bg-critical/10 px-3 py-2 text-sm text-critical">
                      {error}
                    </p>
                  ) : null}

                  <Button
                    type="submit"
                    className="w-full relative overflow-hidden transition-all duration-300 hover:shadow-md hover:shadow-primary/20"
                    disabled={busy}
                  >
                    {busy ? (
                      <div className="flex items-center gap-2">
                        <ModernLoader size="sm" />
                        <span>Authenticating…</span>
                      </div>
                    ) : (
                      "Sign in to dashboard"
                    )}
                  </Button>
                </form>

                <div className="mt-6 rounded-xl border border-dashed border-border bg-muted/40 p-4">
                  <div className="flex items-center gap-2">
                    <KeyRound className="size-4 text-primary" />
                    <p className="text-sm font-medium text-foreground">Evaluator demo access</p>
                  </div>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    {DEMO_CREDENTIALS.email} / {DEMO_CREDENTIALS.password}
                  </p>
                  <Button
                    type="button"
                    variant="secondary"
                    className="mt-3 w-full"
                    disabled={busy}
                    onClick={() => {
                      setEmail(DEMO_CREDENTIALS.email);
                      setPassword(DEMO_CREDENTIALS.password);
                      handleSignIn(DEMO_CREDENTIALS.email, DEMO_CREDENTIALS.password);
                    }}
                  >
                    Continue with demo credentials
                  </Button>
                </div>
              </TabsContent>

              {/* Sign Up Tab */}
              <TabsContent value="signup" className="mt-6">
                <div>
                  <h2 className="font-display text-2xl font-bold text-foreground">
                    Register new solar array
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Create a dedicated monitoring profile on the backend.
                  </p>
                </div>

                <form className="mt-6 space-y-4" onSubmit={handleSignUp}>
                  <div className="space-y-2">
                    <Label htmlFor="reg-name">Contact / Organization Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                      <Input
                        id="reg-name"
                        placeholder="e.g. Apex Solar Energy Ltd"
                        className="pl-9"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reg-email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                      <Input
                        id="reg-email"
                        type="email"
                        autoComplete="email"
                        placeholder="ops@apexsolar.com"
                        className="pl-9"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reg-password">Password (min. 6 characters)</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                      <Input
                        id="reg-password"
                        type="password"
                        autoComplete="new-password"
                        placeholder="••••••••"
                        className="pl-9"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        minLength={6}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="reg-site">Site / Facility Name</Label>
                      <Input
                        id="reg-site"
                        placeholder="Solar Array Roof 1"
                        value={regSite}
                        onChange={(e) => setRegSite(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-capacity">Peak Capacity (kWp)</Label>
                      <Input
                        id="reg-capacity"
                        type="number"
                        step="0.5"
                        min="1"
                        placeholder="4.0"
                        value={regCapacity}
                        onChange={(e) => setRegCapacity(e.target.value)}
                      />
                    </div>
                  </div>

                  {error ? (
                    <p className="rounded-md border border-critical/40 bg-critical/10 px-3 py-2 text-sm text-critical">
                      {error}
                    </p>
                  ) : null}

                  <Button
                    type="submit"
                    className="w-full relative overflow-hidden transition-all duration-300 hover:shadow-md hover:shadow-primary/20"
                    disabled={busy}
                  >
                    {busy ? (
                      <div className="flex items-center gap-2">
                        <ModernLoader size="sm" />
                        <span>Registering array…</span>
                      </div>
                    ) : (
                      "Create account & open dashboard"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
}

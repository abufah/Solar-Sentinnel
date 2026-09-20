import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Activity, Gauge, Loader2, ShieldCheck, Sun, Zap } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEMO_CREDENTIALS, useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Client Login — SolarSense Predictive Maintenance" },
      {
        name: "description",
        content:
          "Sign in to monitor your solar array: live electrical telemetry, shading analysis, hotspot detection and predictive component diagnostics.",
      },
      { property: "og:title", content: "Client Login — SolarSense Predictive Maintenance" },
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
  const { client, ready, signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ready && client) navigate({ to: "/dashboard", replace: true });
  }, [ready, client, navigate]);

  const submit = (mail: string, pass: string) => {
    setBusy(true);
    setError(null);
    const result = signIn(mail, pass);
    if (!result.ok) {
      setBusy(false);
      setError(result.error ?? "Sign-in failed");
      return;
    }
    toast.success("Welcome back — loading your array telemetry");
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
              <Sun className="size-6" />
              <span className="font-display text-xl font-bold tracking-tight">SolarSense</span>
            </div>
            <h1 className="mt-14 max-w-lg font-display text-4xl font-bold leading-tight text-foreground">
              Predictive maintenance for your solar array
            </h1>
            <p className="mt-5 max-w-md text-base text-muted-foreground">
              Continuous electrical telemetry, panel-level thermal health, shading analysis and
              machine-learning failure prediction — in one monitoring console.
            </p>
            <div className="mt-12 grid max-w-md grid-cols-2 gap-4">
              {[
                { icon: Zap, label: "Live V / I / P / Yield" },
                { icon: Gauge, label: "Shading & loss analysis" },
                { icon: Activity, label: "Hotspot + diode diagnostics" },
                { icon: ShieldCheck, label: "Remaining useful life" },
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
            Final year engineering project · Simulated plant telemetry for demonstration
          </p>
        </div>

        {/* Login form */}
        <div className="flex items-center justify-center p-6 sm:p-12">
          <Card className="w-full max-w-md border-border p-8">
            <div className="flex items-center gap-2 text-primary lg:hidden">
              <Sun className="size-5" />
              <span className="font-display text-lg font-bold">SolarSense</span>
            </div>
            <h2 className="mt-4 font-display text-2xl font-bold text-foreground lg:mt-0">
              Client sign in
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Use your plant credentials to monitor your panels.
            </p>

            <form
              className="mt-8 space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                submit(email, password);
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@plant.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error ? (
                <p className="rounded-md border border-critical/40 bg-critical/10 px-3 py-2 text-sm text-critical">
                  {error}
                </p>
              ) : null}

              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? <Loader2 className="size-4 animate-spin" /> : null}
                Sign in to dashboard
              </Button>
            </form>

            <div className="mt-6 rounded-xl border border-dashed border-border bg-muted/40 p-4">
              <p className="text-sm font-medium text-foreground">Evaluator demo access</p>
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                {DEMO_CREDENTIALS.email} / {DEMO_CREDENTIALS.password}
              </p>
              <Button
                type="button"
                variant="secondary"
                className="mt-3 w-full"
                onClick={() => {
                  setEmail(DEMO_CREDENTIALS.email);
                  setPassword(DEMO_CREDENTIALS.password);
                  submit(DEMO_CREDENTIALS.email, DEMO_CREDENTIALS.password);
                }}
              >
                Continue with demo credentials
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

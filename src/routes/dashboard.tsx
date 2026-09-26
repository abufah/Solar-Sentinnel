import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CloudSun, Droplets, LogOut, Radio, Sun, Wind } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AlertsDrawer } from "@/components/solar/AlertsDrawer";
import { ArrayLayout } from "@/components/solar/ArrayLayout";
import { PredictiveCenter } from "@/components/solar/PredictiveCenter";
import { SummaryCards } from "@/components/solar/SummaryCards";
import { SoilingDiagnostics } from "@/components/solar/SoilingDiagnostics";
import { TelemetryCharts } from "@/components/solar/TelemetryCharts";
import { useAuth } from "@/lib/auth";
import { buildSnapshot } from "@/lib/solar-data";
import { ImportTelemetry } from "@/components/solar/ImportTelemetry";
import { buildImportedSnapshot, ivFromSnapshot, seriesFromRows, type ImportedDataset } from "@/lib/telemetry-import";
import { FileSpreadsheet, RotateCcw } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Monitoring Dashboard — SolarSense" },
      {
        name: "description",
        content:
          "Live solar telemetry, shading analysis, hotspot detection and predictive component diagnostics for your array.",
      },
      { property: "og:title", content: "Monitoring Dashboard — SolarSense" },
      { property: "og:type", content: "website" },
      {
        property: "og:description",
        content: "Panel-level solar monitoring with predictive maintenance insights.",
      },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { client, ready, signOut } = useAuth();
  const navigate = useNavigate();
  const [tick, setTick] = useState(0);
  const [dataset, setDataset] = useState<ImportedDataset | null>(null);

  useEffect(() => {
    if (ready && !client) navigate({ to: "/", replace: true });
  }, [ready, client, navigate]);

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 4000);
    return () => window.clearInterval(id);
  }, []);

  if (!ready || !client) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading your array…</p>
      </div>
    );
  }

  const snap = dataset ? buildImportedSnapshot(dataset) : buildSnapshot(tick);
  const importedSeries = dataset ? seriesFromRows(dataset.rows) : undefined;
  const importedIv = dataset ? ivFromSnapshot(snap) : undefined;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-primary">
              <Sun className="size-5" />
              <span className="font-display text-lg font-bold tracking-tight">SolarSense</span>
            </div>
            <Separator orientation="vertical" className="hidden h-6 sm:block" />
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-foreground">{client.site}</p>
              <p className="text-xs text-muted-foreground">
                {client.capacityKw} kWp · {client.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ImportTelemetry onImport={setDataset} />
            {dataset ? (
              <span className="flex items-center gap-1.5 rounded-full border border-solar/40 bg-solar/10 px-3 py-1 text-xs font-medium text-solar">
                <FileSpreadsheet className="size-3.5" /> Imported
              </span>
            ) : (
              <span className="flex items-center gap-1.5 rounded-full border border-success/40 bg-success/10 px-3 py-1 text-xs font-medium text-success">
                <Radio className="size-3.5 animate-pulse" /> Live
              </span>
            )}
            <AlertsDrawer snap={snap} />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                signOut();
                navigate({ to: "/", replace: true });
              }}
            >
              <LogOut className="size-4" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        {dataset && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-solar/40 bg-solar/10 px-4 py-3">
            <p className="flex items-center gap-2 text-sm text-foreground">
              <FileSpreadsheet className="size-4 text-solar" />
              Displaying Imported Dataset: <strong className="font-mono">{dataset.filename}</strong>
              <span className="text-muted-foreground">· {dataset.rows.length} readings</span>
            </p>
            <Button size="sm" variant="outline" onClick={() => setDataset(null)}>
              <RotateCcw className="size-4" /> Reset to Live Simulation
            </Button>
          </div>
        )}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              Predictive maintenance overview
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {dataset ? `Imported readings · Energy across dataset ${snap.yieldToday} kWh` : `Telemetry refreshing every 4 seconds · Yield to date ${snap.yieldTotal.toLocaleString()} kWh`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5">
              <CloudSun className="size-3.5 text-solar" /> {snap.irradiance} W/m²
            </span>
            <span className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5">
              <Droplets className="size-3.5" /> {snap.humidity}% RH
            </span>
            <span className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5">
              <Wind className="size-3.5" /> {snap.windSpeed} m/s
            </span>
          </div>
        </div>

        <SummaryCards snap={snap} />

        <ArrayLayout snap={snap} />

        <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
          <div className="space-y-6">
            <TelemetryCharts tick={tick} series={importedSeries} iv={importedIv} />
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-base">Electrical summary</CardTitle>
              <CardDescription>Per-row measurements at this instant</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {snap.strings.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <span className="font-medium text-foreground">{s.id}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {s.voltage} V · {s.current} A ·{" "}
                    {(s.panels.reduce((a, p) => a + p.power, 0) / 1000).toFixed(2)} kW
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <PredictiveCenter snap={snap} />

        <SoilingDiagnostics snap={snap} />

        <p className="pb-8 text-center text-xs text-muted-foreground">
          Simulated plant data for academic demonstration · SolarSense predictive maintenance
        </p>
      </main>
    </div>
  );
}

import { useState } from "react";
import { CloudOff, Flame, Sparkles, Sun, Thermometer } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Panel, Snapshot } from "@/lib/solar-data";

const statusStyles = {
  optimal:
    "border-emerald-500/20 bg-emerald-950/15 text-emerald-400 hover:border-emerald-400/50 hover:shadow-[0_4px_20px_-4px_rgba(16,185,129,0.15)]",
  shaded: "border-slate-700/50 bg-slate-900/40 text-slate-400 hover:border-slate-500/50",
  fault:
    "border-rose-500/30 bg-rose-950/20 text-rose-400 hover:border-rose-400/60 hover:shadow-[0_4px_20px_-4px_rgba(244,63,94,0.2)]",
  dust: "border-amber-500/25 bg-amber-950/15 text-amber-400 hover:border-amber-400/50 hover:shadow-[0_4px_20px_-4px_rgba(245,158,11,0.15)]",
} as const;

const statusLabels = {
  optimal: "Optimal",
  shaded: "Shaded",
  dust: "Dust accumulation",
  fault: "Hotspot / failure risk",
} as const;

function PanelDetails({
  panel,
  open,
  onOpenChange,
}: {
  panel: Panel | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!panel) return null;
  const metrics = [
    ["Current", `${panel.current} A`],
    ["Voltage", `${panel.voltage} V`],
    ["Power output", `${panel.power} W`],
    ["Efficiency", `${panel.efficiency}%`],
  ];
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <SheetTitle className="font-display">Panel {panel.id}</SheetTitle>
            <Badge className={statusStyles[panel.status]} variant="outline">
              {statusLabels[panel.status]}
            </Badge>
          </div>
          <SheetDescription>{panel.string} · 500 W monocrystalline module</SheetDescription>
        </SheetHeader>
        <div className="space-y-5 px-4 pb-8">
          <div className="grid grid-cols-2 gap-3">
            {metrics.map(([label, value]) => (
              <div key={label} className="rounded-lg border border-border bg-surface/60 p-3">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="mt-1 font-mono text-lg font-semibold text-foreground">{value}</p>
              </div>
            ))}
          </div>
          <div className="space-y-3 rounded-lg border border-border p-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <Thermometer className="size-4" /> Surface temperature
              </span>
              <strong>{panel.temp} °C</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <CloudOff className="size-4" /> Shading loss
              </span>
              <strong>{panel.shadingLossPct}%</strong>
            </div>
            <p className="text-xs text-muted-foreground">{panel.shadingCause}</p>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="size-4" /> Soiling index
              </span>
              <strong>{panel.soilingIndex}%</strong>
            </div>
          </div>
          <div className="rounded-lg border border-border p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Panel health</span>
              <strong>{panel.health}/100</strong>
            </div>
            <Progress
              value={panel.health}
              className={`mt-2 ${panel.health < 65 ? "[&>div]:bg-critical" : panel.health < 85 ? "[&>div]:bg-warning" : ""}`}
            />
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Bypass diode</span>
                <span>{panel.bypassDiode}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Connector impedance</span>
                <span>{panel.connectorImpedance} mΩ</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Cell degradation</span>
                <span>{panel.cellDegradation}%</span>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function ArrayLayout({ snap }: { snap: Snapshot }) {
  const [selectedPanel, setSelectedPanel] = useState<Panel | null>(null);
  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="font-display">Array layout & shading analysis</CardTitle>
              <CardDescription>
                8 × 500 W modules · 2 rows × 4 columns · select a panel for full diagnostics
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Sun className="size-3.5 text-success" /> Optimal
              </span>
              <span className="flex items-center gap-1.5">
                <CloudOff className="size-3.5" /> Shaded
              </span>
              <span className="flex items-center gap-1.5">
                <Flame className="size-3.5 text-critical" /> Hotspot / fault
              </span>
              <span className="flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-warning" /> Dust
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {snap.strings.map((s) => (
            <div key={s.id} className="rounded-lg border border-border bg-surface/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-display text-sm font-semibold text-foreground">{s.id}</span>
                  <Badge variant={s.shadingLossPct > 10 ? "destructive" : "secondary"}>
                    {s.shadingLossPct}% loss
                  </Badge>
                </div>
                <span className="font-mono text-xs text-muted-foreground">
                  {s.voltage} V · {s.current} A
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {s.panels.map((p) => (
                  <Tooltip key={p.id}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => setSelectedPanel(p)}
                        aria-label={`Open diagnostics for panel ${p.id}`}
                        className={`group relative flex aspect-[1.65/1] min-h-28 flex-col justify-between overflow-hidden rounded-lg border p-3.5 text-left backdrop-blur-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.02] ${statusStyles[p.status]}`}
                      >
                        <span className="absolute inset-0 opacity-10 [background-image:linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] [background-size:25%_50%]" />
                        <span className="relative flex w-full flex-col items-start gap-1">
                          <strong className="font-display text-sm tracking-tight">{p.id}</strong>
                          <Badge
                            variant="outline"
                            className="border-current/30 text-[9px] font-medium tracking-wide uppercase"
                          >
                            {statusLabels[p.status]}
                          </Badge>
                        </span>
                        <span className="relative flex w-full items-end justify-between">
                          <span className="font-mono text-sm font-semibold tracking-tight">
                            {Math.round(p.power)} W
                          </span>
                          <span className="font-mono text-[11px] opacity-75">{p.temp} °C</span>
                        </span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-medium">Module {p.id}</p>
                      <p>Power {p.power} W</p>
                      <p>Cell temp {p.temp} °C</p>
                      <p>Status: {statusLabels[p.status]}</p>
                      <p>Select for complete diagnostics</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </div>
          ))}

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-border p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Shaded zones</p>
              <p className="mt-2 font-mono text-sm text-foreground">
                {snap.shadedZones.join(", ") || "None"}
              </p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Power loss impact
              </p>
              <p className="mt-2 font-display text-lg font-bold text-warning">
                {snap.shadingLossKw} kW
              </p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Hotspots</p>
              <p className="mt-2 font-display text-lg font-bold text-critical">
                {snap.strings.flatMap((s) => s.panels).filter((p) => p.hotspot).length} detected
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      <PanelDetails
        panel={selectedPanel}
        open={selectedPanel !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedPanel(null);
        }}
      />
    </TooltipProvider>
  );
}

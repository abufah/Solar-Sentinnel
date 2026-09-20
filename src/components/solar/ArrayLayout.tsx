import { useState } from "react";
import { AlertTriangle, CloudOff, Flame, Gauge, Sparkles, Sun, Thermometer, Zap } from "lucide-react";

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
  optimal: "border-success/40 bg-success/15 text-success",
  shaded: "border-muted-foreground/40 bg-muted text-muted-foreground",
  fault: "border-critical/50 bg-critical/20 text-critical",
  dust: "border-warning/50 bg-warning/15 text-warning",
} as const;

const statusLabels = {
  optimal: "Optimal",
  shaded: "Shaded",
  dust: "Dust accumulation",
  fault: "Hotspot / failure risk",
} as const;

function PanelDetails({ panel, open, onOpenChange }: { panel: Panel | null; open: boolean; onOpenChange: (open: boolean) => void }) {
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
            <Badge className={statusStyles[panel.status]} variant="outline">{statusLabels[panel.status]}</Badge>
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
            <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-sm text-muted-foreground"><Thermometer className="size-4" /> Surface temperature</span><strong>{panel.temp} °C</strong></div>
            <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-sm text-muted-foreground"><CloudOff className="size-4" /> Shading loss</span><strong>{panel.shadingLossPct}%</strong></div>
            <p className="text-xs text-muted-foreground">{panel.shadingCause}</p>
            <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-sm text-muted-foreground"><Sparkles className="size-4" /> Soiling index</span><strong>{panel.soilingIndex}%</strong></div>
          </div>
          <div className="rounded-lg border border-border p-4">
            <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Panel health</span><strong>{panel.health}/100</strong></div>
            <Progress value={panel.health} className={`mt-2 ${panel.health < 65 ? "[&>div]:bg-critical" : panel.health < 85 ? "[&>div]:bg-warning" : ""}`} />
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4"><span className="text-muted-foreground">Bypass diode</span><span>{panel.bypassDiode}</span></div>
              <div className="flex justify-between gap-4"><span className="text-muted-foreground">Connector impedance</span><span>{panel.connectorImpedance} mΩ</span></div>
              <div className="flex justify-between gap-4"><span className="text-muted-foreground">Cell degradation</span><span>{panel.cellDegradation}%</span></div>
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
                        className={`group relative flex aspect-[1.65/1] min-h-24 flex-col justify-between overflow-hidden rounded-md border p-3 text-left transition-transform hover:-translate-y-0.5 ${statusStyles[p.status]}`}
                      >
                        <span className="absolute inset-0 opacity-15 [background-image:linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] [background-size:25%_50%]" />
                        <span className="relative flex w-full items-start justify-between gap-2"><strong className="font-display text-sm">{p.id}</strong><Badge variant="outline" className="max-w-[70%] text-[9px] leading-tight">{statusLabels[p.status]}</Badge></span>
                        <span className="relative flex w-full items-end justify-between"><span className="font-mono text-sm font-semibold">{Math.round(p.power)} W</span><span className="text-[10px] opacity-80">{p.temp} °C</span></span>
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
      <PanelDetails panel={selectedPanel} open={selectedPanel !== null} onOpenChange={(open) => { if (!open) setSelectedPanel(null); }} />
    </TooltipProvider>
  );
}

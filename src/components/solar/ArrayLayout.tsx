import { CloudOff, Flame, Sun } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import type { Snapshot } from "@/lib/solar-data";

const statusStyles = {
  optimal: "border-success/40 bg-success/15 text-success",
  shaded: "border-muted-foreground/40 bg-muted text-muted-foreground",
  fault: "border-critical/50 bg-critical/20 text-critical",
} as const;

export function ArrayLayout({ snap }: { snap: Snapshot }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="font-display">Array layout & shading analysis</CardTitle>
            <CardDescription>
              24 modules across 3 strings — hover a module for panel-level telemetry
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
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {snap.strings.map((s) => (
          <div key={s.id} className="rounded-xl border border-border bg-surface/60 p-4">
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
            <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-8">
              {s.panels.map((p) => (
                <Tooltip key={p.id}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className={`flex aspect-[3/4] flex-col items-center justify-center rounded-md border text-[10px] font-semibold transition-transform hover:scale-105 ${statusStyles[p.status]}`}
                    >
                      <span>{p.id}</span>
                      <span className="mt-0.5 font-mono text-[9px] opacity-80">
                        {Math.round(p.power)}W
                      </span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-medium">Module {p.id}</p>
                    <p>Power {p.power} W</p>
                    <p>Cell temp {p.temp} °C</p>
                    <p className="capitalize">Status: {p.status}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>
        ))}

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Shaded zones</p>
            <p className="mt-2 font-mono text-sm text-foreground">{snap.shadedZones.join(", ")}</p>
          </div>
          <div className="rounded-xl border border-border p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Power loss impact
            </p>
            <p className="mt-2 font-display text-lg font-bold text-warning">
              {snap.shadingLossKw} kW
            </p>
          </div>
          <div className="rounded-xl border border-border p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Hotspots</p>
            <p className="mt-2 font-display text-lg font-bold text-critical">
              {snap.strings.flatMap((s) => s.panels).filter((p) => p.hotspot).length} detected
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

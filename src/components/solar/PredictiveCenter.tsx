import { CircuitBoard, Cpu, Cable, Sun } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { Snapshot } from "@/lib/solar-data";

const icons = [Cpu, CircuitBoard, Cable, Sun];

const riskVariant = {
  low: "secondary",
  medium: "outline",
  high: "destructive",
} as const;

export function PredictiveCenter({ snap }: { snap: Snapshot }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display">Predictive maintenance center</CardTitle>
        <CardDescription>
          Component health, remaining useful life (RUL) and anomaly risk from the prediction model
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-2">
        {snap.components.map((c, i) => {
          const Icon = icons[i % icons.length] ?? Cpu;
          return (
            <div
              key={c.name}
              className={`group relative overflow-hidden rounded-xl border bg-card/60 p-5 backdrop-blur-md transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg ${
                c.risk === "high"
                  ? "border-rose-500/40 hover:border-rose-500/60"
                  : c.risk === "medium"
                    ? "border-amber-500/30 hover:border-amber-500/50"
                    : "border-border/80 hover:border-sky-500/30"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`flex size-8 items-center justify-center rounded-lg ${
                      c.risk === "high"
                        ? "bg-rose-500/10 text-rose-400"
                        : c.risk === "medium"
                          ? "bg-amber-500/10 text-amber-400"
                          : "bg-sky-500/10 text-sky-400"
                    }`}
                  >
                    <Icon className="size-4" />
                  </div>
                  <span className="font-display text-sm font-semibold text-foreground">
                    {c.name}
                  </span>
                </div>
                <Badge
                  variant={riskVariant[c.risk]}
                  className="capitalize text-[11px] font-medium tracking-wide"
                >
                  {c.risk} risk
                </Badge>
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-medium">Component Health</span>
                <span className="font-mono font-semibold text-foreground">{c.health}/100</span>
              </div>
              <Progress
                value={c.health}
                className={`mt-2 h-1.5 ${
                  c.health < 65
                    ? "[&>div]:bg-rose-500"
                    : c.health < 85
                      ? "[&>div]:bg-amber-500"
                      : "[&>div]:bg-emerald-500"
                }`}
              />

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border/70 bg-surface/40 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Remaining useful life
                  </p>
                  <p className="mt-1 font-display text-base font-bold text-foreground">
                    {c.rulDays}{" "}
                    <span className="text-xs font-normal text-muted-foreground">days</span>
                  </p>
                </div>
                <div className="rounded-lg border border-border/70 bg-surface/40 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Predicted failure window
                  </p>
                  <p className="mt-1 font-display text-base font-bold text-foreground">
                    {c.rulDays < 60 ? "< 2 months" : c.rulDays < 365 ? "6–12 months" : "> 3 years"}
                  </p>
                </div>
              </div>

              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{c.note}</p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

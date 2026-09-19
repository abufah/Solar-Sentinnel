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
          const Icon = icons[i % icons.length]!;
          return (
            <div key={c.name} className="rounded-xl border border-border bg-surface/60 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Icon className="size-4 text-primary" />
                  <span className="font-display text-sm font-semibold text-foreground">
                    {c.name}
                  </span>
                </div>
                <Badge variant={riskVariant[c.risk]} className="capitalize">
                  {c.risk} risk
                </Badge>
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                <span>Health score</span>
                <span className="font-mono text-foreground">{c.health}/100</span>
              </div>
              <Progress
                value={c.health}
                className={`mt-2 ${c.health < 65 ? "[&>div]:bg-critical" : c.health < 85 ? "[&>div]:bg-warning" : ""}`}
              />

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border p-3">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Remaining useful life
                  </p>
                  <p className="mt-1 font-display text-base font-bold text-foreground">
                    {c.rulDays} days
                  </p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Predicted failure window
                  </p>
                  <p className="mt-1 font-display text-base font-bold text-foreground">
                    {c.rulDays < 60 ? "< 2 months" : c.rulDays < 365 ? "6–12 months" : "> 3 years"}
                  </p>
                </div>
              </div>

              <p className="mt-3 text-xs text-muted-foreground">{c.note}</p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

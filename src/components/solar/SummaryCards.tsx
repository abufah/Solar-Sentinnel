import {
  Activity,
  AlertTriangle,
  BatteryCharging,
  HeartPulse,
  Thermometer,
  Zap,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import type { Snapshot } from "@/lib/solar-data";

function Metric({
  icon: Icon,
  label,
  value,
  unit,
  sub,
  tone = "default",
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  unit?: string;
  sub: string;
  tone?: "default" | "solar" | "warning" | "critical" | "success";
}) {
  const toneClass = {
    default: "text-primary",
    solar: "text-solar",
    warning: "text-warning",
    critical: "text-critical",
    success: "text-success",
  }[tone];

  return (
    <Card className="gap-0 p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <Icon className={`size-4 ${toneClass}`} />
      </div>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="font-display text-3xl font-bold tabular-nums text-foreground">{value}</span>
        {unit ? <span className="text-sm text-muted-foreground">{unit}</span> : null}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{sub}</p>
    </Card>
  );
}

export function SummaryCards({ snap }: { snap: Snapshot }) {
  const critical = snap.alerts.filter((a) => a.severity === "critical").length;
  const warnings = snap.alerts.filter((a) => a.severity === "warning").length;

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
      <Metric
        icon={Zap}
        label="Current output"
        value={snap.power.toFixed(2)}
        unit="kW"
        sub={`Yield today ${snap.yieldToday} kWh`}
        tone="solar"
      />
      <Metric
        icon={Activity}
        label="Voltage"
        value={snap.voltage.toFixed(1)}
        unit="V"
        sub="String average (DC)"
      />
      <Metric
        icon={BatteryCharging}
        label="Current"
        value={snap.current.toFixed(2)}
        unit="A"
        sub="Total array DC current"
      />
      <Metric
        icon={Thermometer}
        label="Panel temp"
        value={snap.panelTemp.toFixed(1)}
        unit="°C"
        sub={`Ambient ${snap.ambientTemp} °C · ${snap.irradiance} W/m²`}
        tone={snap.panelTemp > 55 ? "warning" : "default"}
      />
      <Metric
        icon={HeartPulse}
        label="System health"
        value={String(snap.healthScore)}
        unit="/100"
        sub={snap.healthScore > 85 ? "Healthy — minor watch items" : "Attention required"}
        tone={snap.healthScore > 85 ? "success" : "warning"}
      />
      <Metric
        icon={AlertTriangle}
        label="Active alerts"
        value={String(critical + warnings)}
        sub={`${critical} critical · ${warnings} warning`}
        tone={critical ? "critical" : "warning"}
      />
    </div>
  );
}

import {
  Activity,
  AlertTriangle,
  BatteryCharging,
  HeartPulse,
  Thermometer,
  Zap,
} from "lucide-react";

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
  const toneConfig = {
    default: {
      border: "border-border/80 hover:border-sky-500/40",
      iconBg: "bg-sky-500/10 text-sky-400",
      accent: "from-sky-500/10 to-transparent",
    },
    solar: {
      border: "border-border/80 hover:border-amber-500/40",
      iconBg: "bg-amber-500/10 text-amber-400",
      accent: "from-amber-500/10 to-transparent",
    },
    warning: {
      border: "border-border/80 hover:border-amber-500/40",
      iconBg: "bg-amber-500/10 text-amber-400",
      accent: "from-amber-500/10 to-transparent",
    },
    critical: {
      border: "border-rose-500/30 hover:border-rose-500/50",
      iconBg: "bg-rose-500/15 text-rose-400",
      accent: "from-rose-500/15 to-transparent",
    },
    success: {
      border: "border-border/80 hover:border-emerald-500/40",
      iconBg: "bg-emerald-500/10 text-emerald-400",
      accent: "from-emerald-500/10 to-transparent",
    },
  }[tone];

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border bg-card/60 p-5 backdrop-blur-md transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 ${toneConfig.border}`}
    >
      {/* Top subtle glow highlight */}
      <div
        className={`pointer-events-none absolute -inset-x-4 top-0 h-px bg-gradient-to-r ${toneConfig.accent} opacity-70 transition-opacity duration-300 group-hover:opacity-100`}
      />

      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground/90">
          {label}
        </span>
        <div
          className={`flex size-7 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110 ${toneConfig.iconBg}`}
        >
          <Icon className="size-3.5" />
        </div>
      </div>

      <div className="mt-3.5 flex items-baseline gap-1.5">
        <span className="font-display text-2xl font-bold tracking-tight text-foreground tabular-nums">
          {value}
        </span>
        {unit ? <span className="text-xs font-medium text-muted-foreground">{unit}</span> : null}
      </div>

      <p className="mt-2 text-xs text-muted-foreground/80 leading-relaxed">{sub}</p>
    </div>
  );
}

export function SummaryCards({ snap }: { snap: Snapshot }) {
  const critical = snap.alerts.filter((a) => a.severity === "critical").length;
  const warnings = snap.alerts.filter((a) => a.severity === "warning").length;

  return (
    <div className="grid grid-cols-2 gap-3.5 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
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
        tone="default"
      />
      <Metric
        icon={BatteryCharging}
        label="Current"
        value={snap.current.toFixed(2)}
        unit="A"
        sub="Total array DC current"
        tone="default"
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
        sub={snap.healthScore > 85 ? "Optimal array condition" : "Maintenance check advised"}
        tone={snap.healthScore > 85 ? "success" : "warning"}
      />
      <Metric
        icon={AlertTriangle}
        label="Active alerts"
        value={String(critical + warnings)}
        sub={`${critical} critical · ${warnings} watch`}
        tone={critical ? "critical" : warnings ? "warning" : "success"}
      />
    </div>
  );
}

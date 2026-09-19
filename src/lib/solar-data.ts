// Simulated telemetry + diagnostics model for the predictive maintenance demo.

export type Panel = {
  id: string;
  string: string;
  power: number; // W
  temp: number; // °C
  shaded: boolean;
  hotspot: boolean;
  status: "optimal" | "shaded" | "fault";
};

export type StringInfo = {
  id: string;
  panels: Panel[];
  shadingLossPct: number;
  voltage: number;
  current: number;
};

export type Alert = {
  id: string;
  severity: "critical" | "warning" | "info";
  title: string;
  detail: string;
  action: string;
  at: string;
};

export type Component = {
  name: string;
  health: number;
  rulDays: number;
  risk: "low" | "medium" | "high";
  note: string;
};

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

export type Snapshot = {
  voltage: number;
  current: number;
  power: number;
  yieldToday: number;
  yieldTotal: number;
  panelTemp: number;
  ambientTemp: number;
  irradiance: number;
  humidity: number;
  windSpeed: number;
  healthScore: number;
  strings: StringInfo[];
  alerts: Alert[];
  components: Component[];
  shadedZones: string[];
  shadingLossKw: number;
};

const SHADED = new Set(["B-3", "B-4", "C-6"]);
const HOTSPOTS = new Set(["C-6"]);

export function buildSnapshot(tick: number): Snapshot {
  const rand = seeded(tick * 7919 + 13);
  const hour = 8 + ((tick % 40) / 40) * 9; // 08:00 → 17:00 sweep
  const daylight = Math.max(0.08, Math.cos(((hour - 12.5) / 5.2) * 1.35));
  const irradiance = Math.round(980 * daylight + rand() * 35);
  const ambientTemp = +(24 + 8 * daylight + rand() * 1.2).toFixed(1);
  const panelTemp = +(ambientTemp + 0.028 * irradiance + rand() * 1.5).toFixed(1);

  const strings: StringInfo[] = ["A", "B", "C"].map((sid, si) => {
    const panels: Panel[] = Array.from({ length: 8 }, (_, i) => {
      const id = `${sid}-${i + 1}`;
      const shaded = SHADED.has(id);
      const hotspot = HOTSPOTS.has(id);
      const base = 0.33 * irradiance * (1 - 0.004 * Math.max(0, panelTemp - 25));
      const power = +(base * (shaded ? 0.42 : 1) * (hotspot ? 0.72 : 1) * (0.97 + rand() * 0.06)).toFixed(1);
      return {
        id,
        string: sid,
        power,
        temp: +(panelTemp + (shaded ? -2.4 : 0) + (hotspot ? 14 : 0) + rand() * 1.4).toFixed(1),
        shaded,
        hotspot,
        status: hotspot ? "fault" : shaded ? "shaded" : "optimal",
      };
    });
    const nominal = panels.length * 0.33 * irradiance;
    const actual = panels.reduce((a, p) => a + p.power, 0);
    return {
      id: `String ${sid}`,
      panels,
      shadingLossPct: +Math.max(0, ((nominal - actual) / nominal) * 100).toFixed(1),
      voltage: +(38.4 - 0.12 * (panelTemp - 25) + si * 0.4 + rand() * 0.6).toFixed(1),
      current: +(actual / (38.4 + si * 0.4)).toFixed(2),
    };
  });

  const power = +(strings.reduce((a, s) => a + s.panels.reduce((b, p) => b + p.power, 0), 0) / 1000).toFixed(2);
  const voltage = +(strings.reduce((a, s) => a + s.voltage, 0) / strings.length).toFixed(1);
  const current = +strings.reduce((a, s) => a + s.current, 0).toFixed(2);
  const nominalTotal = 24 * 0.33 * irradiance / 1000;

  const components: Component[] = [
    { name: "Inverter (Main MPPT)", health: 92, rulDays: 540, risk: "low", note: "Efficiency 97.4%, no derating events" },
    { name: "Bypass Diodes — String C", health: 58, rulDays: 46, risk: "high", note: "Reverse leakage rising on panel C-6" },
    { name: "DC Cabling & Connectors", health: 81, rulDays: 310, risk: "medium", note: "Slight resistance drift at String B junction" },
    { name: "PV Cells (Array average)", health: 88, rulDays: 1620, risk: "low", note: "Degradation 0.52%/yr, within warranty curve" },
  ];

  const healthScore = Math.round(components.reduce((a, c) => a + c.health, 0) / components.length);

  const stringBLoss = strings[1]?.shadingLossPct ?? 0;

  const alerts: Alert[] = [
    {
      id: "a1",
      severity: "critical",
      title: "Hotspot detected — Panel C-6",
      detail: `Cell temperature ${(panelTemp + 14).toFixed(1)} °C, ${(panelTemp + 14 - panelTemp).toFixed(0)} °C above array mean. Bypass diode leakage confirmed.`,
      action: "Schedule on-site thermal inspection and replace bypass diode within 7 days.",
      at: "Today 11:42",
    },
    {
      id: "a2",
      severity: "warning",
      title: "Partial shading — String B (panels B-3, B-4)",
      detail: `Sustained shading pattern detected, ${stringBLoss}% string loss during peak window.`,
      action: "Trim vegetation / verify new obstruction near south-east edge.",
      at: "Today 10:15",
    },
    {
      id: "a3",
      severity: "warning",
      title: "Connector resistance drift — String B junction box",
      detail: "Series resistance up 8.6% over 30 days, predicted fault window in 42 days.",
      action: "Re-torque MC4 connectors during next preventive visit.",
      at: "Yesterday 16:05",
    },
    {
      id: "a4",
      severity: "info",
      title: "Soiling loss estimate 3.1%",
      detail: "No rainfall in 11 days; irradiance-to-yield ratio trending down.",
      action: "Plan module cleaning in the next maintenance cycle.",
      at: "Yesterday 08:30",
    },
    {
      id: "a5",
      severity: "info",
      title: "Inverter firmware up to date",
      detail: "Version 3.4.1 verified, MPPT tracking nominal.",
      action: "No action required.",
      at: "2 days ago",
    },
  ];

  return {
    voltage,
    current,
    power,
    yieldToday: +(power * 5.4).toFixed(1),
    yieldTotal: 18742,
    panelTemp,
    ambientTemp,
    irradiance,
    humidity: Math.round(48 + rand() * 12),
    windSpeed: +(2.1 + rand() * 2.4).toFixed(1),
    healthScore,
    strings,
    alerts,
    components,
    shadedZones: [...SHADED],
    shadingLossKw: +Math.max(0, nominalTotal - power).toFixed(2),
  };
}

export function powerSeries(tick: number) {
  const rand = seeded(99);
  return Array.from({ length: 24 }, (_, i) => {
    const hour = 6 + i * 0.6;
    const daylight = Math.max(0, Math.cos(((hour - 12.5) / 5.4) * 1.35));
    const irradiance = Math.round(1000 * daylight + rand() * 20);
    const temp = +(25 + 9 * daylight + rand() * 1.5).toFixed(1);
    return {
      time: `${String(Math.floor(hour)).padStart(2, "0")}:${hour % 1 ? "30" : "00"}`,
      power: +((irradiance * 0.0079) * (1 - 0.004 * Math.max(0, temp - 25))).toFixed(2),
      irradiance,
      temp,
      predicted: +((irradiance * 0.0082)).toFixed(2),
    };
  }).map((d, i) => (i === 23 ? { ...d, power: +(d.power * (0.97 + (tick % 5) * 0.01)).toFixed(2) } : d));
}

export function ivCurve(shaded: boolean) {
  const voc = 44.2;
  const isc = shaded ? 5.1 : 8.7;
  return Array.from({ length: 20 }, (_, i) => {
    const v = +((voc / 19) * i).toFixed(1);
    const raw = isc * (1 - Math.pow(v / voc, 6.5));
    const current = +Math.max(0, shaded && v > 20 ? raw * 0.55 : raw).toFixed(2);
    return { v, current, power: +(v * current).toFixed(1) };
  });
}

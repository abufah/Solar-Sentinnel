// Simulated telemetry + diagnostics model for the predictive maintenance demo.

export type Panel = {
  id: string;
  string: string;
  row: number;
  power: number; // W
  voltage: number; // V
  current: number; // A
  efficiency: number; // %
  temp: number; // °C
  shaded: boolean;
  hotspot: boolean;
  shadingLossPct: number;
  shadingCause: string;
  soilingIndex: number;
  health: number;
  bypassDiode: "Normal" | "Degraded" | "Malfunction";
  connectorImpedance: number;
  cellDegradation: number;
  status: "optimal" | "shaded" | "dust" | "fault";
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
  affectedPanel: string;
  rootCause: string;
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
  soilingLossPct: number;
  cleaningUrgency: "Low" | "Medium" | "High";
  energyRecoveryKwh: number;
};

const SHADED = new Set(["P-03"]);
const DUSTY = new Set(["P-06", "P-07"]);
const HOTSPOTS = new Set(["P-08"]);

export function buildSnapshot(tick: number): Snapshot {
  const rand = seeded(tick * 7919 + 13);
  const hour = 8 + ((tick % 40) / 40) * 9; // 08:00 → 17:00 sweep
  const daylight = Math.max(0.08, Math.cos(((hour - 12.5) / 5.2) * 1.35));
  const irradiance = Math.round(980 * daylight + rand() * 35);
  const ambientTemp = +(24 + 8 * daylight + rand() * 1.2).toFixed(1);
  const panelTemp = +(ambientTemp + 0.028 * irradiance + rand() * 1.5).toFixed(1);

  const strings: StringInfo[] = ["Row 1", "Row 2"].map((sid, si) => {
    const panels: Panel[] = Array.from({ length: 4 }, (_, i) => {
      const panelNumber = si * 4 + i + 1;
      const id = `P-${String(panelNumber).padStart(2, "0")}`;
      const shaded = SHADED.has(id);
      const dusty = DUSTY.has(id);
      const hotspot = HOTSPOTS.has(id);
      const temperatureFactor = 1 - 0.0035 * Math.max(0, panelTemp - 25);
      const conditionFactor = shaded ? 0.64 : dusty ? 0.91 : hotspot ? 0.72 : 1;
      const voltage = +(40.8 - 0.11 * (panelTemp - 25) + rand() * 0.35).toFixed(1);
      const current = +(12.2 * daylight * conditionFactor * temperatureFactor * (0.98 + rand() * 0.04)).toFixed(2);
      const power = +(voltage * current).toFixed(1);
      const shadingLossPct = shaded ? 36 : hotspot ? 8 : dusty ? 2 : 0;
      const soilingIndex = dusty ? (id === "P-06" ? 13.4 : 10.8) : +(2.2 + rand() * 2.2).toFixed(1);
      return {
        id,
        string: sid,
        row: si + 1,
        power,
        voltage,
        current,
        efficiency: +(21.4 * conditionFactor * temperatureFactor).toFixed(1),
        temp: +(panelTemp + (shaded ? -2.4 : 0) + (hotspot ? 15.2 : 0) + rand() * 1.4).toFixed(1),
        shaded,
        hotspot,
        shadingLossPct,
        shadingCause: shaded
          ? "Partial shadow from the south-east parapet"
          : "No persistent obstruction detected",
        soilingIndex,
        health: hotspot ? 54 : shaded ? 78 : dusty ? 82 : Math.round(94 + rand() * 4),
        bypassDiode: hotspot ? "Malfunction" : id === "P-03" ? "Degraded" : "Normal",
        connectorImpedance: +(hotspot ? 8.7 : id === "P-07" ? 5.1 : 2.3 + rand()).toFixed(1),
        cellDegradation: +(hotspot ? 4.8 : 0.5 + rand() * 0.8).toFixed(1),
        status: hotspot ? "fault" : shaded ? "shaded" : dusty ? "dust" : "optimal",
      };
    });
    const nominal = panels.length * 0.5 * irradiance;
    const actual = panels.reduce((a, p) => a + p.power, 0);
    return {
      id: sid,
      panels,
      shadingLossPct: +Math.max(0, ((nominal - actual) / nominal) * 100).toFixed(1),
      voltage: +panels.reduce((sum, panel) => sum + panel.voltage, 0).toFixed(1),
      current: +(actual / panels.reduce((sum, panel) => sum + panel.voltage, 0)).toFixed(2),
    };
  });

  const power = +(strings.reduce((a, s) => a + s.panels.reduce((b, p) => b + p.power, 0), 0) / 1000).toFixed(2);
  const voltage = +(strings.reduce((a, s) => a + s.voltage, 0) / strings.length).toFixed(1);
  const current = +strings.reduce((a, s) => a + s.current, 0).toFixed(2);
  const nominalTotal = 8 * 0.5 * irradiance / 1000;

  const components: Component[] = [
    { name: "Inverter MPPT Channel 2", health: 64, rulDays: 72, risk: "high", note: "Intermittent tracking deviation affects Row 2 during peak irradiance" },
    { name: "Bypass Diode — P-08", health: 54, rulDays: 28, risk: "high", note: "Forward-voltage imbalance aligns with the localized hotspot" },
    { name: "DC Connectors", health: 82, rulDays: 320, risk: "medium", note: "Elevated impedance measured at panel P-07 connector" },
    { name: "PV Cells — Array Average", health: 90, rulDays: 1580, risk: "low", note: "Average degradation remains within the module warranty curve" },
  ];

  const healthScore = Math.round(components.reduce((a, c) => a + c.health, 0) / components.length);

  const rowOneLoss = strings[0]?.shadingLossPct ?? 0;

  const alerts: Alert[] = [
    {
      id: "a1",
      severity: "critical",
      title: "Localized hotspot and diode fault",
      detail: `P-08 is operating at ${(panelTemp + 15.2).toFixed(1)} °C, 15 °C above the array mean. Continued operation can accelerate cell damage.`,
      action: "Schedule on-site thermal inspection and replace bypass diode within 7 days.",
      affectedPanel: "P-08",
      rootCause: "Bypass diode forward-voltage imbalance is concentrating heat in one cell group.",
      at: "Today 11:42",
    },
    {
      id: "a2",
      severity: "warning",
      title: "Partial shading detected",
      detail: `P-03 has a sustained shadow pattern, contributing to ${rowOneLoss}% loss across Row 1.`,
      action: "Trim vegetation / verify new obstruction near south-east edge.",
      affectedPanel: "P-03",
      rootCause: "The south-east parapet casts a partial shadow during the late-morning peak window.",
      at: "Today 10:15",
    },
    {
      id: "a3",
      severity: "warning",
      title: "Connector resistance drift",
      detail: "P-07 connector impedance is 5.1 mΩ and has risen 8.6% over 30 days.",
      action: "Re-torque MC4 connectors during next preventive visit.",
      affectedPanel: "P-07",
      rootCause: "A slightly loose or oxidized MC4 contact is increasing series resistance.",
      at: "Yesterday 16:05",
    },
    {
      id: "a4",
      severity: "info",
      title: "Dust accumulation above threshold",
      detail: "P-06 and P-07 show elevated soiling after 11 dry days; array loss is estimated at 6.2%.",
      action: "Wash Row 2 within 3 days to recover approximately 1.4 kWh per day.",
      affectedPanel: "P-06, P-07",
      rootCause: "Dry weather and wind-blown dust have formed a non-uniform layer on Row 2.",
      at: "Yesterday 08:30",
    },
    {
      id: "a5",
      severity: "info",
      title: "Inverter firmware up to date",
      detail: "Version 3.4.1 verified, MPPT tracking nominal.",
      action: "No action required.",
      affectedPanel: "Plant inverter",
      rootCause: "Scheduled firmware verification completed successfully.",
      at: "2 days ago",
    },
  ];

  return {
    voltage,
    current,
    power,
    yieldToday: +(power * 4.9).toFixed(1),
    yieldTotal: 6842,
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
    soilingLossPct: 6.2,
    cleaningUrgency: "High",
    energyRecoveryKwh: 1.4,
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
      power: +((irradiance * 0.00362) * (1 - 0.0035 * Math.max(0, temp - 25))).toFixed(2),
      irradiance,
      temp,
      predicted: +((irradiance * 0.00395)).toFixed(2),
    };
  }).map((d, i) => (i === 23 ? { ...d, power: +(d.power * (0.97 + (tick % 5) * 0.01)).toFixed(2) } : d));
}

export function ivCurve(shaded: boolean) {
  const voc = 168;
  const isc = shaded ? 7.1 : 11.8;
  return Array.from({ length: 20 }, (_, i) => {
    const v = +((voc / 19) * i).toFixed(1);
    const raw = isc * (1 - Math.pow(v / voc, 6.5));
    const current = +Math.max(0, shaded && v > 20 ? raw * 0.55 : raw).toFixed(2);
    return { v, current, power: +(v * current).toFixed(1) };
  });
}

import { z } from "zod";
import type { Alert, Component, Panel, Snapshot, StringInfo } from "./solar-data";

export const PANEL_IDS = Array.from({ length: 8 }, (_, i) => `P-${String(i + 1).padStart(2, "0")}`);
const HEADERS = ["timestamp", "panel_id", "voltage_v", "current_a", "temperature_c", "soiling_index_pct", "shading_pct"];

const rowSchema = z.object({
  timestamp: z.string().trim().min(1).max(40),
  panel_id: z.string().trim(),
  voltage_v: z.coerce.number().min(0).max(100),
  current_a: z.coerce.number().min(0).max(30),
  temperature_c: z.coerce.number().min(-40).max(120),
  soiling_index_pct: z.coerce.number().min(0).max(100).default(0),
  shading_pct: z.coerce.number().min(0).max(100).default(0),
});
export type TelemetryRow = z.infer<typeof rowSchema>;
export type ImportedDataset = { filename: string; rows: TelemetryRow[] };

function normalizeId(raw: string) {
  const n = raw.match(/\d+/)?.[0];
  if (!n) throw new Error(`Unknown panel id "${raw}"`);
  const id = `P-${String(Number(n)).padStart(2, "0")}`;
  if (!PANEL_IDS.includes(id)) throw new Error(`Panel "${raw}" is outside P-01…P-08`);
  return id;
}

export function sampleCsv() {
  const lines = [HEADERS.join(",")];
  ["10:00", "11:00", "12:00"].forEach((t, ti) => {
    PANEL_IDS.forEach((id, i) => {
      const v = id === "P-05" ? 27.4 : 40.2 - ti * 0.3;
      const c = (id === "P-03" ? 7.1 : 11.2) + ti * 0.3;
      const temp = id === "P-08" ? 58 + ti : 41 + ti * 2 + i * 0.2;
      const soil = id === "P-06" ? 12.5 : 3.1;
      const shade = id === "P-03" ? 34 : 0;
      lines.push(`2026-09-26T${t}:00,${id},${v.toFixed(1)},${c.toFixed(2)},${temp.toFixed(1)},${soil},${shade}`);
    });
  });
  return lines.join("\n");
}

export function parseTelemetry(text: string, filename: string): TelemetryRow[] {
  let raw: Record<string, unknown>[];
  if (filename.toLowerCase().endsWith(".json")) {
    const parsed = JSON.parse(text);
    raw = Array.isArray(parsed) ? parsed : parsed?.rows ?? parsed?.data;
    if (!Array.isArray(raw)) throw new Error("JSON must be an array of readings (or { rows: [...] })");
  } else {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) throw new Error("CSV has no data rows");
    const head = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const missing = HEADERS.slice(0, 5).filter((h) => !head.includes(h));
    if (missing.length) throw new Error(`Missing column(s): ${missing.join(", ")}`);
    raw = lines.slice(1).map((l) => {
      const cells = l.split(",");
      return Object.fromEntries(head.map((h, i) => [h, cells[i]?.trim()]));
    });
  }
  if (raw.length > 20000) throw new Error("File too large (max 20,000 readings)");
  const rows = raw.map((r, i) => {
    const res = rowSchema.safeParse(r);
    if (!res.success) {
      const issue = res.error.issues[0];
      throw new Error(`Row ${i + 1}: invalid "${issue.path.join(".")}"`);
    }
    return { ...res.data, panel_id: normalizeId(res.data.panel_id) };
  });
  if (!rows.length) throw new Error("No readings found");
  return rows;
}

function latestPerPanel(rows: TelemetryRow[]) {
  const map = new Map<string, TelemetryRow>();
  for (const r of rows) {
    const prev = map.get(r.panel_id);
    if (!prev || r.timestamp >= prev.timestamp) map.set(r.panel_id, r);
  }
  return map;
}

export function buildImportedSnapshot(ds: ImportedDataset): Snapshot {
  const latest = latestPerPanel(ds.rows);
  const alerts: Alert[] = [];
  const panelsAll: Panel[] = PANEL_IDS.map((id, idx) => {
    const r = latest.get(id);
    const voltage = r?.voltage_v ?? 0;
    const current = r?.current_a ?? 0;
    const temp = r?.temperature_c ?? 0;
    const soiling = r?.soiling_index_pct ?? 0;
    const shading = r?.shading_pct ?? 0;
    const power = +(voltage * current).toFixed(1);
    const lowV = !!r && voltage < 30;
    const hot = !!r && temp > 50;
    const fault = !r || lowV || hot;
    const shaded = shading >= 10;
    const dusty = soiling >= 8;
    let health = 98 - shading * 0.5 - soiling * 1.2 - (hot ? (temp - 50) * 2 + 25 : 0) - (lowV ? 30 : 0);
    if (!r) health = 0;
    health = Math.max(5, Math.min(100, Math.round(health)));
    const at = r?.timestamp ?? "—";
    if (!r) alerts.push({ id: `m-${id}`, severity: "critical", title: `No data for ${id}`, detail: `The imported file contains no readings for ${id}.`, action: "Check logger channel / communication for this module.", affectedPanel: id, rootCause: "Missing telemetry channel or disconnected module.", at: "Import" });
    if (hot) alerts.push({ id: `h-${id}`, severity: "critical", title: "Over-temperature / hotspot", detail: `${id} surface temperature is ${temp} °C (limit 50 °C).`, action: "Perform thermal imaging inspection and check bypass diodes.", affectedPanel: id, rootCause: "Cell mismatch or diode failure concentrating heat.", at });
    if (lowV) alerts.push({ id: `v-${id}`, severity: "critical", title: "Low module voltage", detail: `${id} voltage is ${voltage} V (threshold 30 V).`, action: "Inspect module for cell-string failure, diode short or loose connector.", affectedPanel: id, rootCause: "One or more cell substrings bypassed or open.", at });
    if (shaded) alerts.push({ id: `s-${id}`, severity: "warning", title: "Shading detected", detail: `${id} reports ${shading}% shading loss.`, action: "Identify and remove the obstruction casting the shadow.", affectedPanel: id, rootCause: "Partial obstruction over the module.", at });
    if (dusty) alerts.push({ id: `d-${id}`, severity: soiling >= 15 ? "warning" : "info", title: "Dust accumulation", detail: `${id} soiling index is ${soiling}%.`, action: "Schedule panel cleaning.", affectedPanel: id, rootCause: "Accumulated dust layer reducing light transmission.", at });
    return {
      id, string: idx < 4 ? "Row 1" : "Row 2", row: idx < 4 ? 1 : 2,
      power, voltage, current, temp,
      efficiency: +((power / 500) * 21.4).toFixed(1),
      shaded, hotspot: hot, shadingLossPct: shading,
      shadingCause: shaded ? "Shading reported in imported dataset" : "No shading reported",
      soilingIndex: soiling, health,
      bypassDiode: lowV ? "Malfunction" : hot ? "Degraded" : "Normal",
      connectorImpedance: 2.5, cellDegradation: +(Math.max(0, 100 - health) / 20).toFixed(1),
      status: fault ? "fault" : shaded ? "shaded" : dusty ? "dust" : "optimal",
    };
  });

  const strings: StringInfo[] = [0, 1].map((si) => {
    const panels = panelsAll.slice(si * 4, si * 4 + 4);
    const v = panels.reduce((a, p) => a + p.voltage, 0);
    const pw = panels.reduce((a, p) => a + p.power, 0);
    return {
      id: `Row ${si + 1}`, panels,
      voltage: +v.toFixed(1),
      current: +(v ? pw / v : 0).toFixed(2),
      shadingLossPct: +(panels.reduce((a, p) => a + p.shadingLossPct, 0) / 4).toFixed(1),
    };
  });

  const power = +(panelsAll.reduce((a, p) => a + p.power, 0) / 1000).toFixed(2);
  const temps = panelsAll.filter((p) => latest.has(p.id)).map((p) => p.temp);
  const avgTemp = temps.length ? +(temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1) : 0;
  const peakTemp = temps.length ? Math.max(...temps) : 0;
  const avgSoil = panelsAll.reduce((a, p) => a + p.soilingIndex, 0) / 8;
  const worst = [...panelsAll].sort((a, b) => a.health - b.health)[0];
  const components: Component[] = [
    { name: "Inverter MPPT", health: power > 2 ? 90 : 70, rulDays: power > 2 ? 600 : 180, risk: power > 2 ? "low" : "medium", note: `Array output ${power} kW from imported readings` },
    { name: "Bypass Diodes", health: Math.round(100 - panelsAll.filter((p) => p.bypassDiode !== "Normal").length * 15), rulDays: 90, risk: panelsAll.some((p) => p.bypassDiode === "Malfunction") ? "high" : panelsAll.some((p) => p.bypassDiode === "Degraded") ? "medium" : "low", note: "Inferred from low voltage and over-temperature panels" },
    { name: "Thermal Condition", health: Math.max(10, Math.round(100 - Math.max(0, peakTemp - 45) * 4)), rulDays: 365, risk: peakTemp > 50 ? "high" : peakTemp > 45 ? "medium" : "low", note: `Peak surface temperature ${peakTemp} °C` },
    { name: `Weakest module — ${worst.id}`, health: worst.health, rulDays: Math.round(worst.health * 15), risk: worst.health < 60 ? "high" : worst.health < 85 ? "medium" : "low", note: `Status: ${worst.status}` },
  ];
  const totalCount = ds.rows.length;
  alerts.push({ id: "imp", severity: "info", title: "Dataset imported", detail: `${totalCount} readings loaded from ${ds.filename}. Showing the latest reading per panel.`, action: "Review flagged panels above.", affectedPanel: "All", rootCause: "User-supplied telemetry.", at: "Now" });
  const order = { critical: 0, warning: 1, info: 2 };
  alerts.sort((a, b) => order[a.severity] - order[b.severity]);

  return {
    voltage: +((strings[0].voltage + strings[1].voltage) / 2).toFixed(1),
    current: +(strings[0].current + strings[1].current).toFixed(2),
    power,
    yieldToday: +(seriesFromRows(ds.rows).reduce((a, s) => a + s.power, 0)).toFixed(1),
    yieldTotal: 0,
    panelTemp: avgTemp,
    ambientTemp: +(avgTemp - 12).toFixed(1),
    irradiance: Math.round((power / 4) * 1000),
    humidity: 0,
    windSpeed: 0,
    healthScore: Math.round(components.reduce((a, c) => a + c.health, 0) / components.length),
    strings, alerts, components,
    shadedZones: panelsAll.filter((p) => p.shaded).map((p) => p.id),
    shadingLossKw: +(panelsAll.reduce((a, p) => a + (p.power * p.shadingLossPct) / Math.max(1, 100 - p.shadingLossPct), 0) / 1000).toFixed(2),
    soilingLossPct: +(avgSoil * 0.5).toFixed(1),
    cleaningUrgency: avgSoil > 10 ? "High" : avgSoil > 5 ? "Medium" : "Low",
    energyRecoveryKwh: +(power * 5 * avgSoil * 0.005).toFixed(1),
  };
}

export function seriesFromRows(rows: TelemetryRow[]) {
  const byTs = new Map<string, TelemetryRow[]>();
  rows.forEach((r) => byTs.set(r.timestamp, [...(byTs.get(r.timestamp) ?? []), r]));
  return [...byTs.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([ts, rs]) => {
    const power = rs.reduce((a, r) => a + r.voltage_v * r.current_a, 0) / 1000;
    const temp = rs.reduce((a, r) => a + r.temperature_c, 0) / rs.length;
    const t = ts.match(/\d{2}:\d{2}/)?.[0] ?? ts;
    return { time: t, power: +power.toFixed(2), temp: +temp.toFixed(1), irradiance: Math.round((power / 4) * 1000), predicted: +(4 * 0.9).toFixed(2) };
  });
}

export function ivFromSnapshot(snap: Snapshot) {
  const panels = snap.strings.flatMap((s) => s.panels);
  const best = [...panels].sort((a, b) => b.power - a.power)[0];
  const worst = [...panels].sort((a, b) => a.power - b.power)[0];
  const curve = (p: Panel) => {
    const voc = Math.max(1, p.voltage * 1.22);
    const isc = p.current * 1.07;
    return (v: number) => +Math.max(0, isc * (1 - Math.pow(v / voc, 7))).toFixed(2);
  };
  const cb = curve(best), cw = curve(worst);
  const vmax = Math.max(best.voltage, worst.voltage) * 1.25;
  return {
    labels: { healthy: `Best module (${best.id})`, shaded: `Weakest module (${worst.id})` },
    data: Array.from({ length: 20 }, (_, i) => {
      const v = +((vmax / 19) * i).toFixed(1);
      return { v, healthy: cb(v), shaded: cw(v), power: 0 };
    }),
  };
}

import {
  Area,
  ComposedChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ivCurve, powerSeries } from "@/lib/solar-data";

const axis = { stroke: "var(--muted-foreground)", fontSize: 11 };

const tooltipStyle = {
  backgroundColor: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "10px",
  color: "var(--popover-foreground)",
  fontSize: 12,
};

type Series = ReturnType<typeof powerSeries>;
type IvOverride = { labels: { healthy: string; shaded: string }; data: { v: number; healthy: number; shaded: number; power: number }[] };

export function TelemetryCharts({ tick, series: seriesOverride, iv: ivOverride }: { tick: number; series?: Series | undefined; iv?: IvOverride | undefined }) {
  const series = seriesOverride ?? powerSeries(tick);
  const healthy = ivCurve(false);
  const shaded = ivCurve(true);
  const iv = ivOverride?.data ?? healthy.map((h, i) => ({
    v: h.v,
    healthy: h.current,
    shaded: shaded[i]?.current ?? 0,
    power: h.power,
  }));
  const ivLabels = ivOverride?.labels ?? { healthy: "Healthy string", shaded: "Shaded string (B)" };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display">Telemetry analytics</CardTitle>
        <CardDescription>Real-time and historical performance curves</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="power">
          <TabsList>
            <TabsTrigger value="power">Power & prediction</TabsTrigger>
            <TabsTrigger value="iv">V–I curve</TabsTrigger>
            <TabsTrigger value="temp">Power vs temperature</TabsTrigger>
            <TabsTrigger value="irr">Irradiance correlation</TabsTrigger>
          </TabsList>

          <TabsContent value="power" className="h-[320px] pt-6">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={series}>
                <defs>
                  <linearGradient id="pw" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--grid)" vertical={false} />
                <XAxis dataKey="time" {...axis} />
                <YAxis {...axis} unit=" kW" />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area
                  type="monotone"
                  dataKey="power"
                  name="Actual power"
                  stroke="var(--primary)"
                  fill="url(#pw)"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="predicted"
                  name="Model expectation"
                  stroke="var(--solar)"
                  strokeDasharray="5 4"
                  dot={false}
                  strokeWidth={2}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="iv" className="h-[320px] pt-6">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={iv}>
                <CartesianGrid stroke="var(--grid)" />
                <XAxis dataKey="v" {...axis} unit=" V" />
                <YAxis {...axis} unit=" A" />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line
                  type="monotone"
                  dataKey="healthy"
                  name={ivLabels.healthy}
                  stroke="var(--success)"
                  dot={false}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="shaded"
                  name={ivLabels.shaded}
                  stroke="var(--critical)"
                  dot={false}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="temp" className="h-[320px] pt-6">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series}>
                <CartesianGrid stroke="var(--grid)" vertical={false} />
                <XAxis dataKey="time" {...axis} />
                <YAxis yAxisId="l" {...axis} unit=" kW" />
                <YAxis yAxisId="r" orientation="right" {...axis} unit=" °C" />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line
                  yAxisId="l"
                  type="monotone"
                  dataKey="power"
                  name="Power"
                  stroke="var(--primary)"
                  dot={false}
                  strokeWidth={2}
                />
                <Line
                  yAxisId="r"
                  type="monotone"
                  dataKey="temp"
                  name="Panel temperature"
                  stroke="var(--solar)"
                  dot={false}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="irr" className="h-[320px] pt-6">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid stroke="var(--grid)" />
                <XAxis dataKey="irradiance" name="Irradiance" {...axis} unit=" W/m²" />
                <YAxis dataKey="power" name="Power" {...axis} unit=" kW" />
                <Tooltip contentStyle={tooltipStyle} cursor={{ strokeDasharray: "3 3" }} />
                <Scatter name="Irradiance vs power" data={series} fill="var(--primary)" />
              </ScatterChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

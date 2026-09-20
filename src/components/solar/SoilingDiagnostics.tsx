import { AlertTriangle, Droplets, Gauge, Sparkles, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { Snapshot } from "@/lib/solar-data";

export function SoilingDiagnostics({ snap }: { snap: Snapshot }) {
  const failedPanels = snap.strings.flatMap((row) => row.panels).filter((panel) => panel.status === "fault");

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 font-display"><Sparkles className="size-4 text-warning" /> Dust & soiling tracker</CardTitle>
              <CardDescription>Optical loss estimate based on clean-reference performance</CardDescription>
            </div>
            <Badge variant="destructive">{snap.cleaningUrgency} urgency</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <div className="flex items-end justify-between"><span className="text-sm text-muted-foreground">Overall soiling loss</span><strong className="font-display text-2xl text-warning">{snap.soilingLossPct}%</strong></div>
            <Progress value={snap.soilingLossPct * 5} className="mt-2 [&>div]:bg-warning" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border p-3"><Droplets className="size-4 text-primary" /><p className="mt-2 text-xs text-muted-foreground">Recommended cleaning</p><p className="mt-1 font-semibold">Within 3 days</p></div>
            <div className="rounded-lg border border-border p-3"><Zap className="size-4 text-solar" /><p className="mt-2 text-xs text-muted-foreground">Recovery after wash</p><p className="mt-1 font-semibold">+{snap.energyRecoveryKwh} kWh/day</p></div>
          </div>
          <p className="text-xs text-muted-foreground">Highest accumulation: P-06 and P-07 in Row 2 after 11 dry days.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display"><AlertTriangle className="size-4 text-critical" /> Failure breakdown</CardTitle>
          <CardDescription>Critical panel and plant component conditions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {failedPanels.map((panel) => (
            <div key={panel.id} className="flex items-center justify-between gap-3 rounded-lg border border-critical/50 bg-critical/10 p-3">
              <div><p className="text-sm font-semibold">{panel.id} · Localized hotspot</p><p className="text-xs text-muted-foreground">Bypass diode {panel.bypassDiode.toLowerCase()} · {panel.temp} °C</p></div>
              <Badge variant="destructive">Critical</Badge>
            </div>
          ))}
          <div className="flex items-center justify-between gap-3 rounded-lg border border-critical/40 p-3">
            <div><p className="text-sm font-semibold">Inverter MPPT channel 2</p><p className="text-xs text-muted-foreground">Tracking deviation on Row 2 · predicted service window 72 days</p></div>
            <Gauge className="size-5 shrink-0 text-critical" />
          </div>
          <div className="flex items-center justify-between gap-3 rounded-lg border border-warning/40 p-3">
            <div><p className="text-sm font-semibold">P-07 connector</p><p className="text-xs text-muted-foreground">Impedance drift at 5.1 mΩ · inspect during cleaning</p></div>
            <Badge variant="outline" className="text-warning">Watch</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
import { AlertTriangle, Bell, Info, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { Alert, Snapshot } from "@/lib/solar-data";

const config = {
  critical: { icon: ShieldAlert, cls: "border-critical/40 bg-critical/10 text-critical", label: "Critical" },
  warning: { icon: AlertTriangle, cls: "border-warning/40 bg-warning/10 text-warning", label: "Warning" },
  info: { icon: Info, cls: "border-border bg-muted/50 text-muted-foreground", label: "Info" },
} as const;

function AlertRow({ alert }: { alert: Alert }) {
  const { icon: Icon, cls, label } = config[alert.severity];
  return (
    <div className={`rounded-xl border p-4 ${cls}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <Icon className="mt-0.5 size-4 shrink-0" />
          <p className="text-sm font-semibold text-foreground">{alert.title}</p>
        </div>
        <Badge variant="outline" className="shrink-0">
          {label}
        </Badge>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{alert.detail}</p>
      <div className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
        <span className="font-medium text-foreground">Affected</span>
        <span className="text-muted-foreground">{alert.affectedPanel}</span>
        <span className="font-medium text-foreground">Root cause</span>
        <span className="text-muted-foreground">{alert.rootCause}</span>
      </div>
      <p className="mt-3 text-xs font-medium text-foreground">Recommended action</p>
      <p className="text-xs text-muted-foreground">{alert.action}</p>
      <p className="mt-2 text-[11px] text-muted-foreground">{alert.at}</p>
    </div>
  );
}

export function AlertsDrawer({ snap }: { snap: Snapshot }) {
  const critical = snap.alerts.filter((a) => a.severity === "critical").length;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative">
          <Bell className="size-4" />
          Alerts
          <span className="ml-1 rounded-full bg-critical px-1.5 text-[11px] font-semibold text-background">
            {snap.alerts.length}
          </span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-display">Alerts & notifications</SheetTitle>
          <SheetDescription>
            {critical} critical item{critical === 1 ? "" : "s"} require attention
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-3 px-4 pb-8">
          {snap.alerts.map((a) => (
            <AlertRow key={a.id} alert={a} />
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}

import { useRef, useState } from "react";
import { Download, FileUp, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { parseTelemetry, sampleCsv, type ImportedDataset } from "@/lib/telemetry-import";

export function ImportTelemetry({ onImport }: { onImport: (ds: ImportedDataset) => void }) {
  const [open, setOpen] = useState(false);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!/\.(csv|json)$/i.test(file.name)) { toast.error("Please upload a .csv or .json file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("File is larger than 5 MB"); return; }
    try {
      const rows = parseTelemetry(await file.text(), file.name);
      onImport({ filename: file.name, rows });
      toast.success(`Imported ${rows.length} readings from ${file.name}`);
      setOpen(false);
    } catch (e) {
      toast.error("Could not read this file", { description: e instanceof Error ? e.message : "Invalid format" });
    }
  };

  const downloadSample = () => {
    const url = URL.createObjectURL(new Blob([sampleCsv()], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "solarsense-telemetry-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Upload className="size-4" /> Import Telemetry
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">Import panel telemetry</DialogTitle>
          <DialogDescription>
            Upload CSV or JSON readings for panels P-01 to P-08. The latest reading per panel drives the dashboard.
          </DialogDescription>
        </DialogHeader>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          className={`flex flex-col items-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors ${drag ? "border-primary bg-primary/10" : "border-border hover:border-primary/60"}`}
        >
          <FileUp className="size-8 text-primary" />
          <span className="text-sm font-medium text-foreground">Drop a file here or click to browse</span>
          <span className="text-xs text-muted-foreground">.csv or .json · max 5 MB</span>
        </button>
        <input ref={inputRef} type="file" accept=".csv,.json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
        <div className="rounded-lg border border-border bg-surface/60 p-3">
          <p className="text-xs text-muted-foreground">Required columns</p>
          <code className="mt-1 block break-all font-mono text-xs text-foreground">
            timestamp, panel_id, voltage_v, current_a, temperature_c, soiling_index_pct, shading_pct
          </code>
          <p className="mt-2 text-xs text-muted-foreground">Panels are flagged when voltage &lt; 30 V or temperature &gt; 50 °C.</p>
        </div>
        <Button variant="outline" onClick={downloadSample}>
          <Download className="size-4" /> Download Sample Template (CSV)
        </Button>
      </DialogContent>
    </Dialog>
  );
}

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Save, Trash2, Cpu, Github, Zap, CheckCircle2, XCircle } from "lucide-react";
import {
  type SavedCircuit,
  deleteSavedCircuit,
  listSavedCircuits,
  saveCircuit,
} from "@/lib/storage";
import type { Circuit } from "@/lib/types";
import { EXAMPLES } from "@/lib/examples";
import { analyzeTruthTable } from "@/lib/truth-table";
import { exprToCircuit } from "@/lib/expr-to-circuit";
import { Logo } from "./Logo";

export function SaveDialog({
  open,
  onOpenChange,
  circuit,
  defaultName,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  circuit: Circuit;
  defaultName: string;
  onSaved: (name: string) => void;
}) {
  const [name, setName] = useState(defaultName);
  useEffect(() => {
    if (open) setName(defaultName);
  }, [open, defaultName]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save circuit</DialogTitle>
          <DialogDescription>
            Stored locally in your browser. Use Export to download a portable JSON file.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="save-name">Name</Label>
          <Input
            id="save-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My circuit"
            data-testid="input-save-name"
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!name.trim()}
            onClick={() => {
              saveCircuit(name.trim(), circuit);
              onSaved(name.trim());
              onOpenChange(false);
            }}
            data-testid="button-confirm-save"
          >
            <Save className="h-4 w-4 mr-2" /> Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function OpenDialog({
  open,
  onOpenChange,
  onLoad,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onLoad: (circuit: Circuit, name: string) => void;
}) {
  const [items, setItems] = useState<SavedCircuit[]>([]);
  useEffect(() => {
    if (open) setItems(listSavedCircuits());
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Open saved circuit</DialogTitle>
          <DialogDescription>
            Circuits saved in this browser. Click any to load.
          </DialogDescription>
        </DialogHeader>
        {items.length === 0 ? (
          <div className="text-center py-10 text-sm text-muted-foreground">
            You haven't saved anything yet.
          </div>
        ) : (
          <ScrollArea className="max-h-72">
            <ul className="divide-y divide-border">
              {items.map((item) => (
                <li
                  key={item.name}
                  className="flex items-center justify-between py-2.5 px-1 group hover-elevate rounded-sm"
                >
                  <button
                    type="button"
                    className="flex-1 text-left"
                    onClick={() => {
                      onLoad(item.circuit, item.name);
                      onOpenChange(false);
                    }}
                    data-testid={`open-circuit-${item.name}`}
                  >
                    <div className="text-sm font-medium">{item.name}</div>
                    <div className="text-[11px] text-muted-foreground font-mono">
                      {Object.keys(item.circuit.gates).length} gates ·{" "}
                      {Object.keys(item.circuit.wires).length} wires ·{" "}
                      {new Date(item.savedAt).toLocaleString()}
                    </div>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSavedCircuit(item.name);
                      setItems(listSavedCircuits());
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function ExamplesDialog({
  open,
  onOpenChange,
  onLoad,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onLoad: (circuit: Circuit, name: string) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Example circuits</DialogTitle>
          <DialogDescription>
            Pre-built circuits to learn from or remix.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-2">
          <div className="grid grid-cols-1 gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex.name}
                type="button"
                className="text-left rounded-md border border-border bg-card hover-elevate active-elevate-2 px-4 py-3"
                onClick={() => {
                  onLoad(ex.build(), ex.name);
                  onOpenChange(false);
                }}
                data-testid={`example-${ex.name}`}
              >
                <div className="text-sm font-medium">{ex.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {ex.description}
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export function HelpDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const items: { keys: string; description: string }[] = [
    { keys: "Click + Drag (palette)", description: "Drop a component onto the workspace" },
    { keys: "Click (output pin) → Click (input pin)", description: "Draw a wire" },
    { keys: "Click (input switch)", description: "Toggle the value" },
    { keys: "Click + Drag (component)", description: "Move it around" },
    { keys: "Click + Drag (empty area)", description: "Rectangle-select" },
    { keys: "Shift / ⌘ / Ctrl + Click", description: "Add to current selection" },
    { keys: "Alt + Click (input pin)", description: "Disconnect the feeding wire" },
    { keys: "Alt + Drag / Middle-mouse drag", description: "Pan the workspace" },
    { keys: "Mouse wheel", description: "Zoom in / out (centered on cursor)" },
    { keys: "Delete / Backspace", description: "Remove the current selection" },
    { keys: "⌘ / Ctrl + Z", description: "Undo" },
    { keys: "⌘ / Ctrl + Shift + Z", description: "Redo" },
    { keys: "⌘ / Ctrl + A", description: "Select all" },
    { keys: "⌘ / Ctrl + D", description: "Duplicate selection" },
    { keys: "Space", description: "Pause / resume the simulation" },
    { keys: ".", description: "Step the simulation by one tick" },
    { keys: "Esc", description: "Cancel placement / wire / selection" },
    { keys: "?", description: "Toggle this dialog" },
  ];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Keyboard &amp; mouse</DialogTitle>
          <DialogDescription>
            Logic Lab supports both ANSI / IEEE 91 distinctive shapes and IEC / IEEE 91
            qualifying-symbol rectangles. Toggle styles in the toolbar.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className="rounded-md border border-border divide-y divide-border">
            {items.map((it) => (
              <div key={it.keys} className="flex items-center px-3 py-2 text-sm">
                <code className="text-[12px] font-mono bg-muted px-1.5 py-0.5 rounded text-foreground/85 shrink-0">
                  {it.keys}
                </code>
                <span className="ml-3 text-muted-foreground">{it.description}</span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/*  About dialog                                                              */
/* -------------------------------------------------------------------------- */

export function AboutDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="items-center text-center">
          <Logo size={56} />
          <DialogTitle className="text-xl">Logic Lab</DialogTitle>
          <DialogDescription className="text-center">
            A professional offline-first digital circuit workbench.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="rounded-md border border-border bg-muted/30 p-4 text-center space-y-1">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Developed by
            </div>
            <div className="font-semibold">Siyabonga B Phakathi</div>
            <div className="text-xs text-muted-foreground">
              Voice and Eye of Bhambatha Inc.
            </div>
            <div className="text-[11px] text-muted-foreground/80 font-mono pt-1">
              C@2026
            </div>
          </div>

          <ul className="text-xs text-muted-foreground leading-relaxed list-disc pl-5 space-y-1">
            <li>Drag-and-drop palette covering 30+ digital components.</li>
            <li>ANSI distinctive shapes <em>and</em> IEC qualifying symbols.</li>
            <li>Latches, edge-triggered flip-flops, multiplexers, decoders, adders, counters and a 7-segment display.</li>
            <li>Undo / redo, truth-table analyzer, waveform timing panel.</li>
            <li>Saves locally; works fully offline as an installable PWA.</li>
          </ul>

          <div className="text-[11px] text-muted-foreground/70 text-center pt-2 border-t border-border">
            Built with React, Vite and TypeScript.
            <br />
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 mt-1 hover:text-foreground"
            >
              <Github className="h-3 w-3" />
              <Cpu className="h-3 w-3" />
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/*  Truth-table dialog                                                        */
/* -------------------------------------------------------------------------- */

export function TruthTableDialog({
  open,
  onOpenChange,
  circuit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  circuit: Circuit;
}) {
  const result = useMemo(
    () => (open ? analyzeTruthTable(circuit) : null),
    [open, circuit],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Truth table</DialogTitle>
          <DialogDescription>
            All combinations of toggles vs. their resulting outputs (LEDs and probes).
            Combinational circuits should produce stable rows; sequential feedback may
            be marked oscillating.
          </DialogDescription>
        </DialogHeader>

        {!result || result.inputs.length === 0 || result.outputs.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-10">
            Add at least one Toggle input and one LED / Probe output to generate a
            truth table.
          </div>
        ) : (
          <>
            {result.truncated && (
              <div className="text-xs text-accent border border-accent/30 bg-accent/10 rounded px-3 py-2">
                Truncated to the first 8 toggle inputs (256 rows).
              </div>
            )}
            <ScrollArea className="max-h-[60vh] pr-2">
              <table className="w-full text-xs font-mono border-collapse">
                <thead className="sticky top-0 bg-card/95 backdrop-blur">
                  <tr>
                    {result.inputs.map((inp) => (
                      <th
                        key={inp.id}
                        className="border-b border-border px-2 py-1.5 text-left text-foreground"
                      >
                        {inp.label}
                      </th>
                    ))}
                    <th className="border-b border-l border-border px-2 py-1.5 w-1" />
                    {result.outputs.map((out) => (
                      <th
                        key={out.id}
                        className="border-b border-border px-2 py-1.5 text-left text-primary"
                      >
                        {out.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row, i) => (
                    <tr
                      key={i}
                      className={
                        row.oscillating
                          ? "bg-destructive/10"
                          : i % 2 === 0
                            ? "bg-transparent"
                            : "bg-muted/20"
                      }
                    >
                      {row.inputs.map((v, k) => (
                        <td key={k} className="px-2 py-1 border-b border-border/50">
                          {v}
                        </td>
                      ))}
                      <td className="border-b border-l border-border/50" />
                      {row.outputs.map((v, k) => (
                        <td
                          key={k}
                          className={`px-2 py-1 border-b border-border/50 ${
                            v === 1
                              ? "text-signal-high"
                              : v === 0
                                ? "text-foreground/70"
                                : "text-signal-unknown"
                          }`}
                        >
                          {v}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/*  Expression → Circuit import                                               */
/* -------------------------------------------------------------------------- */

export function ExprImportDialog({
  open,
  onOpenChange,
  onImport,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onImport: (circuit: Circuit) => void;
}) {
  const [expr, setExpr] = useState("");
  const [touched, setTouched] = useState(false);

  const result = useMemo(() => {
    if (!expr.trim()) return null;
    return exprToCircuit(expr);
  }, [expr]);

  const hasError = result?.error != null;
  const gateCount = result ? Object.keys(result.circuit.gates).length : 0;
  const wireCount = result ? Object.keys(result.circuit.wires).length : 0;

  useEffect(() => {
    if (open) { setExpr(""); setTouched(false); }
  }, [open]);

  const EXPR_EXAMPLES = [
    { label: "A AND B", expr: "A AND B" },
    { label: "NOT(A OR B)", expr: "NOT (A OR B)" },
    { label: "(A XOR B) AND C", expr: "(A XOR B) AND C" },
    { label: "AB + AC + BC", expr: "AB + AC + BC" },
    { label: "Full adder sum", expr: "A XOR B XOR Cin" },
    { label: "NAND chain", expr: "(A NAND B) NAND (C NAND D)" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-accent" />
            Boolean Expression → Circuit
          </DialogTitle>
          <DialogDescription>
            Type a boolean expression — it will be converted into gates and wires placed on the canvas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Expression</Label>
            <Textarea
              value={expr}
              onChange={(e) => { setExpr(e.target.value); setTouched(true); }}
              placeholder="e.g.  (A AND B) OR NOT C"
              className="font-mono text-sm resize-none"
              rows={3}
              autoFocus
            />
            <p className="text-[10px] text-muted-foreground">
              Operators: <code>AND</code> · <code>OR</code> · <code>NOT</code> · <code>XOR</code> · <code>NAND</code> · <code>NOR</code> · <code>XNOR</code>
              &nbsp;|&nbsp; Symbols: <code>+</code>=OR · <code>*</code>=AND · <code>!</code>=NOT · <code>^</code>=XOR
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Quick examples:</p>
            <div className="flex flex-wrap gap-1.5">
              {EXPR_EXAMPLES.map((ex) => (
                <button
                  key={ex.label}
                  onClick={() => setExpr(ex.expr)}
                  className="px-2 py-0.5 rounded border border-border text-xs font-mono bg-muted/30 hover:bg-muted/60 transition-colors"
                >
                  {ex.label}
                </button>
              ))}
            </div>
          </div>

          {touched && expr.trim() && (
            <div className={`rounded-md p-3 text-xs font-mono space-y-1 border ${
              hasError ? "border-destructive/50 bg-destructive/10" : "border-border/60 bg-muted/30"
            }`}>
              {hasError ? (
                <div className="flex items-center gap-2 text-destructive">
                  <XCircle className="h-3.5 w-3.5 shrink-0" />
                  {result?.error}
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    Valid expression
                  </div>
                  <div className="text-muted-foreground">
                    Variables: <span className="text-foreground">{result?.vars.join(", ") || "—"}</span>
                    &nbsp;·&nbsp; Gates: <span className="text-foreground">{gateCount}</span>
                    &nbsp;·&nbsp; Wires: <span className="text-foreground">{wireCount}</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={!result || hasError || !expr.trim()}
            onClick={() => {
              if (result && !hasError) {
                onImport(result.circuit);
                onOpenChange(false);
              }
            }}
          >
            <Zap className="mr-2 h-4 w-4" />
            Import Circuit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

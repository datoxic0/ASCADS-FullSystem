import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Trash2, X } from "lucide-react";
import type { Gate, Selection, SimulationResult } from "@/lib/types";
import {
  KIND_DESCRIPTIONS,
  isVariableInputKind,
  pinsFor,
} from "@/lib/component-defs";
import { signalColor } from "@/lib/simulator";

type Props = {
  selection: Selection;
  gates: Record<string, Gate>;
  onUpdateGate: (id: string, partial: Partial<Gate>, commit?: boolean) => void;
  onDeleteSelection: () => void;
  onClearSelection: () => void;
  simulation?: SimulationResult;
};

export function Inspector({
  selection,
  gates,
  onUpdateGate,
  onDeleteSelection,
  onClearSelection,
  simulation,
}: Props) {
  const selectedGateIds = Array.from(selection.gates);
  const selectedWireCount = selection.wires.size;
  const totalSelected = selectedGateIds.length + selectedWireCount;

  if (totalSelected === 0) {
    return (
      <aside className="w-72 shrink-0 border-l border-border bg-sidebar/80 backdrop-blur-sm flex flex-col">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Inspector
          </h2>
        </div>
        <div className="flex-1 flex items-center justify-center px-6 text-center text-xs text-muted-foreground">
          Select a component or wire to view its properties.
        </div>
        <div className="border-t border-border px-4 py-3 space-y-1 text-[10px] text-muted-foreground/70">
          <div>• Click INPUT toggle to flip value</div>
          <div>• Drag from a pin to draw a wire</div>
          <div>• Right-click wire to delete it</div>
          <div>• Alt+click input pin to disconnect</div>
        </div>
      </aside>
    );
  }

  if (selectedGateIds.length > 1 || (selectedGateIds.length >= 1 && selectedWireCount > 0)) {
    return (
      <aside className="w-72 shrink-0 border-l border-border bg-sidebar/80 backdrop-blur-sm flex flex-col">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            {totalSelected} selected
          </h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onClearSelection}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="flex-1 px-4 py-4 space-y-3 text-sm">
          <div className="text-xs text-muted-foreground">
            {selectedGateIds.length} component{selectedGateIds.length === 1 ? "" : "s"}
            {selectedWireCount > 0 ? `, ${selectedWireCount} wire${selectedWireCount === 1 ? "" : "s"}` : ""}
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={onDeleteSelection}
            className="w-full gap-2"
            data-testid="button-delete-selection"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete selection
          </Button>
          <p className="text-[11px] text-muted-foreground/70 leading-snug">
            Tip: hold ⌘ / Ctrl while clicking to add to selection.
          </p>
        </div>
      </aside>
    );
  }

  if (selectedWireCount === 1 && selectedGateIds.length === 0) {
    const wireId = Array.from(selection.wires)[0]!;
    const wireSig = simulation?.wireValues.get(wireId);
    const sigLabel = wireSig === 1 ? "HIGH (1)" : wireSig === 0 ? "LOW (0)" : "Unknown (X)";
    return (
      <aside className="w-72 shrink-0 border-l border-border bg-sidebar/80 backdrop-blur-sm flex flex-col">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Wire
            </h2>
            <p className="text-[11px] text-muted-foreground/80 mt-0.5">
              Carries a single bit between an output and an input.
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onClearSelection}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="flex-1 px-4 py-4 space-y-4">
          {simulation && (
            <div className="flex items-center justify-between rounded-md border border-border/70 bg-muted/30 px-3 py-2">
              <span className="text-xs text-muted-foreground">Signal</span>
              <span
                className="text-xs font-mono font-bold"
                style={{ color: signalColor(wireSig) }}
              >
                {sigLabel}
              </span>
            </div>
          )}
          <Button
            variant="destructive"
            size="sm"
            onClick={onDeleteSelection}
            className="w-full gap-2"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete wire
          </Button>
          <p className="text-[11px] text-muted-foreground/70 leading-snug">
            Tip: right-click any wire on the canvas to instantly delete it.
          </p>
        </div>
      </aside>
    );
  }

  const gateId = selectedGateIds[0]!;
  const gate = gates[gateId];
  if (!gate) return null;

  const hasLabel =
    gate.kind === "INPUT" ||
    gate.kind === "OUTPUT" ||
    gate.kind === "CLOCK" ||
    gate.kind === "PROBE";

  // Compute live pin signals for this gate
  const pins = pinsFor(gate);
  const pinSignals = pins.map((p, i) => {
    const sig = simulation?.pinValues.get(`${gateId}:${i}`);
    return { pin: p, index: i, sig };
  });

  return (
    <aside className="w-72 shrink-0 border-l border-border bg-sidebar/80 backdrop-blur-sm flex flex-col">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            {gate.kind}
          </h2>
          <p className="text-[11px] text-muted-foreground/80 mt-0.5 leading-snug max-w-[14rem]">
            {KIND_DESCRIPTIONS[gate.kind]}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={onClearSelection}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4 space-y-4">
        {hasLabel && (
          <div>
            <Label htmlFor="g-label" className="text-xs">Label</Label>
            <Input
              id="g-label"
              value={gate.label ?? ""}
              onChange={(e) => onUpdateGate(gate.id, { label: e.target.value })}
              placeholder="optional"
              className="mt-1 h-8 text-sm"
              data-testid="input-label"
            />
          </div>
        )}

        {gate.kind === "INPUT" && (
          <div className="flex items-center justify-between rounded-md border border-border/70 bg-muted/30 px-3 py-2.5">
            <div>
              <div className="text-sm font-medium">Value</div>
              <div
                className="text-[11px] font-mono font-bold"
                style={{ color: gate.on ? "var(--color-signal-high)" : "var(--color-signal-low)" }}
              >
                {gate.on ? "HIGH (1)" : "LOW (0)"}
              </div>
            </div>
            <Switch
              checked={!!gate.on}
              onCheckedChange={(v) => onUpdateGate(gate.id, { on: v })}
              data-testid="switch-input-value"
            />
          </div>
        )}

        {gate.kind === "CLOCK" && (
          <div>
            <div className="flex items-baseline justify-between">
              <Label className="text-xs">Frequency</Label>
              <span className="text-xs font-mono text-foreground/90">
                {gate.hz?.toFixed(1) ?? 1} Hz
              </span>
            </div>
            <Slider
              value={[gate.hz ?? 1]}
              min={0.5}
              max={20}
              step={0.5}
              onValueChange={([v]) => onUpdateGate(gate.id, { hz: v })}
              className="mt-2"
              data-testid="slider-clock-hz"
            />
            <p className="text-[11px] text-muted-foreground mt-2 leading-snug">
              The clock toggles {((gate.hz ?? 1) * 2).toFixed(1)} times per second.
            </p>
          </div>
        )}

        {isVariableInputKind(gate.kind) && (
          <div>
            <div className="flex items-baseline justify-between">
              <Label className="text-xs">Inputs</Label>
              <span className="text-xs font-mono text-foreground/90">{gate.inputs}</span>
            </div>
            <Slider
              value={[gate.inputs]}
              min={2}
              max={5}
              step={1}
              onValueChange={([v]) => onUpdateGate(gate.id, { inputs: v })}
              className="mt-2"
              data-testid="slider-inputs"
            />
            <p className="text-[11px] text-muted-foreground mt-2 leading-snug">
              Adjust how many input pins this gate exposes (2 – 5).
            </p>
          </div>
        )}

        {/* Live signal values */}
        {simulation && pinSignals.length > 0 && (
          <>
            <Separator />
            <div>
              <h3 className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase mb-2">
                Live Signals
              </h3>
              <div className="space-y-1">
                {pinSignals.map(({ pin, index, sig }) => {
                  const sigLabel = sig === 1 ? "1" : sig === 0 ? "0" : "X";
                  const pinLabel = pin.label ?? (pin.type === "out" ? `OUT${index}` : `IN${index}`);
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between text-[11px] font-mono px-2 py-1 rounded bg-muted/30"
                    >
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <span
                          className="inline-block w-1.5 h-1.5 rounded-full"
                          style={{ background: signalColor(sig) }}
                        />
                        <span>{pinLabel}</span>
                        <span className="text-muted-foreground/50 text-[9px]">
                          ({pin.type})
                        </span>
                      </span>
                      <span
                        className="font-bold text-xs"
                        style={{ color: signalColor(sig) }}
                      >
                        {sigLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        <Separator />

        <div className="text-[11px] text-muted-foreground space-y-1.5 font-mono">
          <div className="flex justify-between">
            <span>id</span>
            <span className="text-foreground/80 truncate ml-2 max-w-[10rem]">{gate.id}</span>
          </div>
          <div className="flex justify-between">
            <span>x, y</span>
            <span className="text-foreground/80">{Math.round(gate.x)}, {Math.round(gate.y)}</span>
          </div>
        </div>

        <Button
          variant="destructive"
          size="sm"
          onClick={onDeleteSelection}
          className="w-full gap-2"
          data-testid="button-delete-gate"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete component
        </Button>
      </div>
    </aside>
  );
}

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import type {
  Circuit,
  Gate,
  GateKind,
  Selection,
  Signal,
  SimulationResult,
  Wire,
  ViewState,
} from "@/lib/types";
import { simulate, createSimState, clearSimState } from "@/lib/simulator";
import {
  loadAutosave,
  loadPrefs,
  importCircuitFromJson,
  downloadCircuit,
  savePrefs,
  writeAutosave,
} from "@/lib/storage";
import { useHardwareBus } from "@/lib/hardware-bus";
import { EXAMPLES } from "@/lib/examples";
import {
  type History,
  canRedo,
  canUndo,
  createHistory,
  push as pushHistory,
  redo as redoHistory,
  undo as undoHistory,
} from "@/lib/history";
import { Toolbar } from "@/components/circuit/Toolbar";
import { Palette } from "@/components/circuit/Palette";
import { Inspector } from "@/components/circuit/Inspector";
import { StatusBar } from "@/components/circuit/StatusBar";
import { CircuitCanvas } from "@/components/circuit/CircuitCanvas";
import { WaveformPanel, type WaveSample } from "@/components/circuit/WaveformPanel";
import { loadSignalLabels, saveSignalLabels } from "@/lib/storage";
import {
  AboutDialog,
  ExamplesDialog,
  HelpDialog,
  OpenDialog,
  SaveDialog,
  TruthTableDialog,
  ExprImportDialog,
} from "@/components/circuit/Dialogs";
import { exprToCircuit } from "@/lib/expr-to-circuit";
import { digitalToPLC } from "@/lib/bridge-utils";
import { useToast } from "@/hooks/use-toast";

const EMPTY_CIRCUIT: Circuit = { gates: {}, wires: {} };

type Action =
  | { type: "set"; circuit: Circuit; kind: string }
  | { type: "patch"; circuit: Circuit; kind: string; commit?: boolean }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "reset"; circuit: Circuit };

function historyReducer(state: History, action: Action): History {
  switch (action.type) {
    case "set":
    case "patch":
      return pushHistory(state, action.circuit, action.kind);
    case "undo":
      return undoHistory(state);
    case "redo":
      return redoHistory(state);
    case "reset":
      return createHistory(action.circuit);
  }
}

const WAVE_HISTORY_MS = 6000;
const WAVE_SAMPLE_MIN_MS = 24;

import type { AnalogProject } from "@/lib/analog-types";

export default function Editor({ initialCircuit: bridgeCircuit, project, onProjectChange }: { initialCircuit?: Circuit, project?: AnalogProject, onProjectChange?: (p: AnalogProject) => void }) {
  const { toast } = useToast();

  // Preferences
  const [prefs, setPrefs] = useState(() => loadPrefs());
  useEffect(() => savePrefs(prefs), [prefs]);

  useEffect(() => {
    if (prefs.dark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [prefs.dark]);

  // Circuit history
  const initialCircuitMemo = useMemo(() => {
    if (project?.data && project.data.gates && project.data.wires) return project.data;
    const loaded = bridgeCircuit ?? loadAutosave();
    if (loaded && loaded.gates && loaded.wires) return loaded;
    return EMPTY_CIRCUIT;
  }, []);
  const [history, dispatch] = useReducer(historyReducer, initialCircuitMemo, createHistory);
  const circuit = (history.present.circuit && history.present.circuit.gates) ? history.present.circuit : EMPTY_CIRCUIT;
  const [circuitName, setCircuitName] = useState<string>(project?.name || (bridgeCircuit ? "Analog Bridge" : "Untitled circuit"));
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (project?.data && project.data.gates && project.data.wires) {
      dispatch({ type: "reset", circuit: project.data });
      setCircuitName(project.name);
      setDirty(false);
      clearSimState(simStateRef.current);
    }
  }, [project?.id]);

  // Selection / view
  const [selection, setSelection] = useState<Selection>(() => ({
    gates: new Set(),
    wires: new Set(),
  }));
  const [view, setView] = useState<ViewState>({ tx: 0, ty: 0, scale: 1 });

  // Signal labels toggle (persisted)
  const [showSignalLabels, setShowSignalLabels] = useState(() => loadSignalLabels());
  useEffect(() => saveSignalLabels(showSignalLabels), [showSignalLabels]);

  // Simulation control
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(1); // multiplier on clock frequency
  const [stepNonce, setStepNonce] = useState(0);
  const [clockState, setClockState] = useState<Record<string, boolean>>({});

  // Persistent simulator memory across renders
  const simStateRef = useRef(createSimState());

  // Drive clocks
  useEffect(() => {
    if (!running) return;
    let raf = 0;
    let last = performance.now();
    const phases: Record<string, number> = {};
    let lastHwStateStr = "";
    const tick = (t: number) => {
      const dt = ((t - last) / 1000) * speed;
      last = t;
      const next: Record<string, boolean> = { ...clockState };
      let changed = false;
      for (const g of Object.values(circuit.gates)) {
        if (g.kind !== "CLOCK") continue;
        const hz = g.hz ?? 1;
        const period = 1 / Math.max(0.1, hz);
        phases[g.id] = (phases[g.id] ?? 0) + dt;
        const nowOn = phases[g.id] % period < period / 2;
        if (next[g.id] !== nowOn) {
          next[g.id] = nowOn;
          changed = true;
        }
      }
      if (changed) setClockState(next);

      const hwStateStr = JSON.stringify(useHardwareBus.getState().analogOut);
      if (hwStateStr !== lastHwStateStr) {
        lastHwStateStr = hwStateStr;
        setStepNonce((n) => n + 1);
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, speed, circuit.gates]);

  // Run simulation on every change
  const simulation: SimulationResult = useMemo(
    () => simulate(circuit, clockState, simStateRef.current),
    [circuit, clockState, stepNonce],
  );

  // Reset memory whenever the circuit topology changes substantially
  const topologyKey = useMemo(() => {
    const gateIds = Object.values(circuit.gates).map((g) => `${g.id}:${g.kind}`).sort().join(",");
    return gateIds;
  }, [circuit.gates]);
  useEffect(() => {
    clearSimState(simStateRef.current);
  }, [topologyKey]);

  // Waveform recording — capture relevant signals as a ring buffer
  const [waveformOpen, setWaveformOpen] = useState(false);
  const [samples, setSamples] = useState<WaveSample[]>([]);
  const lastSampleAt = useRef(0);
  useEffect(() => {
    const now = performance.now();
    if (now - lastSampleAt.current < WAVE_SAMPLE_MIN_MS) return;
    lastSampleAt.current = now;
    setSamples((prev) => {
      const trace: Record<string, Signal> = {};
      for (const g of Object.values(circuit.gates)) {
        if (
          g.kind === "INPUT" ||
          g.kind === "OUTPUT" ||
          g.kind === "PROBE" ||
          g.kind === "CLOCK"
        ) {
          // Use input pin 0 for OUTPUT/PROBE (their only pin),
          // otherwise output pin 0
          const pinIdx =
            g.kind === "OUTPUT" || g.kind === "PROBE" ? 0 : 0;
          trace[g.id] = simulation.pinValues.get(`${g.id}:${pinIdx}`) ?? "X";
        }
      }
      const next = [...prev, { t: now, values: trace }];
      const cutoff = now - WAVE_HISTORY_MS;
      const trimmed = next.filter((s) => s.t >= cutoff);
      return trimmed;
    });
  }, [simulation, circuit.gates]);

  // Cursor for status bar
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);

  // Pending placement
  const [pendingPlace, setPendingPlace] = useState<GateKind | null>(null);

  // Dialogs
  const [saveOpen, setSaveOpen] = useState(false);
  const [openOpen, setOpenOpen] = useState(false);
  const [examplesOpen, setExamplesOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [truthOpen, setTruthOpen] = useState(false);
  const [exprImportOpen, setExprImportOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Bootstrap demo
  useEffect(() => {
    if (Object.keys(circuit.gates).length === 0) {
      const half = EXAMPLES[0]!.build();
      dispatch({ type: "reset", circuit: half });
      setCircuitName(EXAMPLES[0]!.name);
      setDirty(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autosave
  useEffect(() => {
    const t = setTimeout(() => {
      writeAutosave(circuit);
      if (project && onProjectChange) {
        onProjectChange({ ...project, data: circuit, name: circuitName });
      }
    }, 300);
    return () => clearTimeout(t);
  }, [circuit, project, onProjectChange, circuitName]);

  /* ---------- Mutators ---------- */

  const apply = useCallback(
    (mutator: (c: Circuit) => Circuit, kind: string) => {
      dispatch({ type: "patch", circuit: mutator(circuit), kind });
      setDirty(true);
    },
    [circuit],
  );

  const addGate = useCallback(
    (gate: Gate) => {
      apply((c) => ({ ...c, gates: { ...c.gates, [gate.id]: gate } }), "add-gate");
      setSelection({ gates: new Set([gate.id]), wires: new Set() });
    },
    [apply],
  );

  const updateGate = useCallback(
    (id: string, partial: Partial<Gate>, _commit = true) => {
      apply((c) => {
        const existing = c.gates[id];
        if (!existing) return c;
        return { ...c, gates: { ...c.gates, [id]: { ...existing, ...partial } } };
      }, `update:${id}:${Object.keys(partial).join(",")}`);
    },
    [apply],
  );

  const moveGates = useCallback(
    (dx: number, dy: number, ids: string[], commit = false) => {
      if (ids.length === 0) return;
      if (commit && dx === 0 && dy === 0) {
        // Drag finished — push a fresh history entry by tagging differently
        apply((c) => ({ ...c, gates: { ...c.gates } }), "move-commit");
        return;
      }
      if (dx === 0 && dy === 0) return;
      apply((c) => {
        const nextGates = { ...c.gates };
        for (const id of ids) {
          const g = nextGates[id];
          if (!g) continue;
          nextGates[id] = { ...g, x: g.x + dx, y: g.y + dy };
        }
        return { ...c, gates: nextGates };
      }, `move:${ids.join(",")}`);
    },
    [apply],
  );

  const addWire = useCallback(
    (wire: Wire) => {
      apply((c) => {
        const cleanedWires: Record<string, Wire> = {};
        for (const w of Object.values(c.wires)) {
          const sameInput =
            w.to.gateId === wire.to.gateId && w.to.pinIndex === wire.to.pinIndex;
          if (!sameInput) cleanedWires[w.id] = w;
        }
        cleanedWires[wire.id] = wire;
        return { ...c, wires: cleanedWires };
      }, "add-wire");
    },
    [apply],
  );

  const deleteWire = useCallback(
    (id: string) => {
      apply((c) => {
        const next: Record<string, Wire> = {};
        for (const w of Object.values(c.wires)) {
          if (w.id !== id) next[w.id] = w;
        }
        return { ...c, wires: next };
      }, "delete-wire");
    },
    [apply],
  );

  const updateWire = useCallback(
    (id: string, partial: Partial<Wire>) => {
      apply((c) => {
        const existing = c.wires[id];
        if (!existing) return c;
        return { ...c, wires: { ...c.wires, [id]: { ...existing, ...partial } } };
      }, `update-wire:${id}`);
    },
    [apply]
  );

  const removeWiresAtInput = useCallback(
    (gateId: string, pinIndex: number) => {
      apply((c) => {
        const next: Record<string, Wire> = {};
        for (const w of Object.values(c.wires)) {
          if (!(w.to.gateId === gateId && w.to.pinIndex === pinIndex)) {
            next[w.id] = w;
          }
        }
        return { ...c, wires: next };
      }, "remove-wire-at-input");
    },
    [apply],
  );

  const deleteSelection = useCallback(() => {
    apply((c) => {
      const nextGates = { ...c.gates };
      for (const id of selection.gates) delete nextGates[id];
      const nextWires: Record<string, Wire> = {};
      for (const w of Object.values(c.wires)) {
        if (selection.wires.has(w.id)) continue;
        if (selection.gates.has(w.from.gateId)) continue;
        if (selection.gates.has(w.to.gateId)) continue;
        nextWires[w.id] = w;
      }
      return { gates: nextGates, wires: nextWires };
    }, "delete");
    setSelection({ gates: new Set(), wires: new Set() });
  }, [apply, selection]);

  const selectAll = useCallback(() => {
    setSelection({
      gates: new Set(Object.keys(circuit.gates)),
      wires: new Set(Object.keys(circuit.wires)),
    });
  }, [circuit]);

  const duplicateSelection = useCallback(() => {
    if (selection.gates.size === 0) return;
    const newIdMap: Record<string, string> = {};
    const newGates: Record<string, Gate> = {};
    for (const id of selection.gates) {
      const g = circuit.gates[id];
      if (!g) continue;
      const newId = `${g.kind.toLowerCase()}_${Math.random().toString(36).slice(2, 9)}`;
      newIdMap[id] = newId;
      newGates[newId] = { ...g, id: newId, x: g.x + 30, y: g.y + 30 };
    }
    const newWires: Record<string, Wire> = {};
    for (const w of Object.values(circuit.wires)) {
      if (selection.gates.has(w.from.gateId) && selection.gates.has(w.to.gateId)) {
        const newId = `w_${Math.random().toString(36).slice(2, 9)}`;
        newWires[newId] = {
          id: newId,
          from: { gateId: newIdMap[w.from.gateId], pinIndex: w.from.pinIndex },
          to: { gateId: newIdMap[w.to.gateId], pinIndex: w.to.pinIndex },
        };
      }
    }
    apply(
      (c) => ({
        gates: { ...c.gates, ...newGates },
        wires: { ...c.wires, ...newWires },
      }),
      "duplicate",
    );
    setSelection({
      gates: new Set(Object.keys(newGates)),
      wires: new Set(Object.keys(newWires)),
    });
  }, [apply, circuit, selection]);

  /* ---------- Undo/redo/step ---------- */

  const onUndo = useCallback(() => {
    if (canUndo(history)) {
      dispatch({ type: "undo" });
      clearSimState(simStateRef.current);
    }
  }, [history]);
  const onRedo = useCallback(() => {
    if (canRedo(history)) {
      dispatch({ type: "redo" });
      clearSimState(simStateRef.current);
    }
  }, [history]);
  const onStep = useCallback(() => {
    setStepNonce((n) => n + 1);
  }, []);
  const onResetSim = useCallback(() => {
    clearSimState(simStateRef.current);
    setStepNonce((n) => n + 1);
  }, []);

  /* ---------- File operations ---------- */

  const newCircuit = () => {
    dispatch({ type: "reset", circuit: EMPTY_CIRCUIT });
    setCircuitName("Untitled circuit");
    setSelection({ gates: new Set(), wires: new Set() });
    setView({ tx: 0, ty: 0, scale: 1 });
    setDirty(false);
    clearSimState(simStateRef.current);
  };

  const exportNow = () => {
    downloadCircuit(circuitName, circuit);
    toast({ title: "Exported", description: `Saved ${circuitName}.logiclab.json` });
  };

  const importNow = () => fileInputRef.current?.click();

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const c = importCircuitFromJson(String(reader.result));
        dispatch({ type: "reset", circuit: c });
        setCircuitName(file.name.replace(/\.logiclab\.json$|\.json$/, ""));
        setSelection({ gates: new Set(), wires: new Set() });
        setDirty(false);
        clearSimState(simStateRef.current);
        toast({ title: "Imported", description: `Loaded ${file.name}` });
      } catch (err) {
        toast({
          title: "Import failed",
          description: (err as Error).message,
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  /* ---------- Keyboard shortcuts ---------- */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      const meta = e.metaKey || e.ctrlKey;
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selection.gates.size + selection.wires.size > 0) {
          e.preventDefault();
          deleteSelection();
        }
      } else if (e.key === "Escape") {
        setPendingPlace(null);
        setSelection({ gates: new Set(), wires: new Set() });
      } else if (meta && e.shiftKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        onRedo();
      } else if (meta && e.key.toLowerCase() === "z") {
        e.preventDefault();
        onUndo();
      } else if (meta && e.key.toLowerCase() === "y") {
        e.preventDefault();
        onRedo();
      } else if (meta && e.key.toLowerCase() === "a") {
        e.preventDefault();
        selectAll();
      } else if (meta && e.key.toLowerCase() === "d") {
        e.preventDefault();
        duplicateSelection();
      } else if (meta && e.key.toLowerCase() === "s") {
        e.preventDefault();
        setSaveOpen(true);
      } else if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        setHelpOpen((v) => !v);
      } else if (e.key === " ") {
        e.preventDefault();
        setRunning((r) => !r);
      } else if (e.key === ".") {
        e.preventDefault();
        onStep();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selection, deleteSelection, selectAll, duplicateSelection, onUndo, onRedo, onStep]);

  return (
    <div className="h-full w-full flex flex-col bg-background text-foreground overflow-hidden">
      <Toolbar
        circuitName={circuitName}
        onCircuitNameChange={(n) => {
          setCircuitName(n);
          setDirty(true);
        }}
        dirty={dirty}
        symbolStyle={prefs.symbolStyle}
        onSetSymbolStyle={(s) => setPrefs({ ...prefs, symbolStyle: s })}
        dark={prefs.dark}
        onToggleDark={() => setPrefs({ ...prefs, dark: !prefs.dark })}
        running={running}
        onToggleRunning={() => setRunning((r) => !r)}
        onStep={onStep}
        speed={speed}
        onSpeedChange={setSpeed}
        onUndo={onUndo}
        onRedo={onRedo}
        canUndo={canUndo(history)}
        canRedo={canRedo(history)}
        onNew={newCircuit}
        onSaveClick={() => setSaveOpen(true)}
        onOpenClick={() => setOpenOpen(true)}
        onClear={newCircuit}
        onExport={exportNow}
        onImport={importNow}
        onExamplesClick={() => setExamplesOpen(true)}
        onHelpClick={() => setHelpOpen(true)}
        onAboutClick={() => setAboutOpen(true)}
        onTruthTableClick={() => setTruthOpen(true)}
        showWaveforms={waveformOpen}
        onToggleWaveforms={() => setWaveformOpen((v) => !v)}
        onResetSim={onResetSim}
        showSignalLabels={showSignalLabels}
        onToggleSignalLabels={() => setShowSignalLabels((v) => !v)}
        onImportExpr={() => setExprImportOpen(true)}
        onExportToPLC={() => {
          const bridge = digitalToPLC(circuit);
          localStorage.setItem('ascads_bridge_digital_plc', JSON.stringify(bridge));
          toast({ title: 'Bridge Export', description: `${bridge.tags.length} tags, ${bridge.rungs.length} rungs exported to PLC` });
        }}
        onImportFromPLC={() => {
          try {
            const raw = localStorage.getItem('ascads_bridge_plc_digital');
            if (!raw) { toast({ title: 'Bridge Import', description: 'No PLC bridge data — export from Industrial PLC first', variant: 'destructive' }); return; }
            const parsed = JSON.parse(raw);
            const bridged = parsed.circuit;
            if (!bridged || !bridged.gates || !bridged.wires) {
               throw new Error("Invalid or legacy bridge data");
            }
            dispatch({ type: 'set', circuit: bridged, kind: 'Import from PLC' });
            setCircuitName('PLC Bridge');
            setView({ tx: 0, ty: 0, scale: 1 });
            setDirty(false);
            toast({ title: 'Bridge Import', description: 'PLC ladder logic loaded as digital gates' });
          } catch { toast({ title: 'Bridge Import', description: 'Failed to parse PLC bridge data. Please export from PLC again.', variant: 'destructive' }); }
        }}
      />

      <div className="flex-1 flex min-h-0">
        <Palette
          style={prefs.symbolStyle}
          onClickPlace={(k) =>
            setPendingPlace((curr) => (curr === k ? null : k))
          }
          activeKind={pendingPlace}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <CircuitCanvas
            circuit={circuit}
            view={view}
            setView={setView}
            selection={selection}
            setSelection={setSelection}
            symbolStyle={prefs.symbolStyle}
            showGrid={prefs.showGrid}
            snap={prefs.snap}
            simulation={simulation}
            pendingPlace={pendingPlace}
            setPendingPlace={setPendingPlace}
            onAddGate={addGate}
            onUpdateGate={updateGate}
            onMoveGates={moveGates}
            onAddWire={addWire}
            onUpdateWire={updateWire}
            onRemoveWiresAtInput={removeWiresAtInput}
            onDeleteWire={deleteWire}
            onCursorChange={setCursor}
            showSignalLabels={showSignalLabels}
          />

          {waveformOpen && (
            <WaveformPanel
              circuit={circuit}
              samples={samples}
              onClose={() => setWaveformOpen(false)}
              onClear={() => setSamples([])}
            />
          )}
        </div>

        <Inspector
          selection={selection}
          gates={circuit.gates}
          onUpdateGate={updateGate}
          onDeleteSelection={deleteSelection}
          onClearSelection={() =>
            setSelection({ gates: new Set(), wires: new Set() })
          }
          simulation={simulation}
        />
      </div>

      <StatusBar
        gateCount={Object.keys(circuit.gates).length}
        wireCount={Object.keys(circuit.wires).length}
        iterations={simulation.iterations}
        oscillating={simulation.oscillating}
        zoom={view.scale}
        cursor={cursor}
        onAboutClick={() => setAboutOpen(true)}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.logiclab.json,application/json"
        className="hidden"
        onChange={handleFileSelected}
      />

      <SaveDialog
        open={saveOpen}
        onOpenChange={setSaveOpen}
        circuit={circuit}
        defaultName={circuitName}
        onSaved={(n) => {
          setCircuitName(n);
          setDirty(false);
          toast({ title: "Saved", description: `Stored "${n}" in this browser.` });
        }}
      />

      <OpenDialog
        open={openOpen}
        onOpenChange={setOpenOpen}
        onLoad={(c, n) => {
          dispatch({ type: "reset", circuit: c });
          setCircuitName(n);
          setSelection({ gates: new Set(), wires: new Set() });
          setDirty(false);
          clearSimState(simStateRef.current);
        }}
      />

      <ExamplesDialog
        open={examplesOpen}
        onOpenChange={setExamplesOpen}
        onLoad={(c, n) => {
          dispatch({ type: "reset", circuit: c });
          setCircuitName(n);
          setSelection({ gates: new Set(), wires: new Set() });
          setView({ tx: 0, ty: 0, scale: 1 });
          setDirty(false);
          clearSimState(simStateRef.current);
        }}
      />

      <HelpDialog open={helpOpen} onOpenChange={setHelpOpen} />
      <AboutDialog open={aboutOpen} onOpenChange={setAboutOpen} />
      <TruthTableDialog open={truthOpen} onOpenChange={setTruthOpen} circuit={circuit} />
      <ExprImportDialog
        open={exprImportOpen}
        onOpenChange={setExprImportOpen}
        onImport={(c) => {
          dispatch({ type: "reset", circuit: c });
          setCircuitName("Expression Import");
          setSelection({ gates: new Set(), wires: new Set() });
          setView({ tx: 60, ty: 60, scale: 1 });
          setDirty(true);
          toast({ title: "Circuit imported", description: "Boolean expression converted to gates." });
        }}
      />
    </div>
  );
}

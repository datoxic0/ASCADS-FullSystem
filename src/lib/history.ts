/**
 * A small immutable undo/redo stack for circuits.
 *
 * Each entry is a snapshot of the circuit at a point in time. We coalesce
 * rapid repeated edits (e.g. dragging a gate) by attaching a "kind" tag —
 * if the new entry's kind matches the head and was within the coalesce
 * window, we replace rather than push, keeping the stack light.
 */

import type { Circuit } from "./types";

export type HistoryEntry = {
  circuit: Circuit;
  kind: string;
  at: number;
};

export type History = {
  past: HistoryEntry[];
  present: HistoryEntry;
  future: HistoryEntry[];
};

const COALESCE_WINDOW_MS = 250;
const MAX_HISTORY = 100;

export function createHistory(circuit: Circuit): History {
  return {
    past: [],
    present: { circuit, kind: "initial", at: Date.now() },
    future: [],
  };
}

export function push(h: History, circuit: Circuit, kind: string): History {
  if (circuit === h.present.circuit) return h;
  const now = Date.now();
  // Coalesce: if same kind within window, replace head without growing past
  if (
    kind !== "initial" &&
    h.present.kind === kind &&
    now - h.present.at < COALESCE_WINDOW_MS
  ) {
    return {
      past: h.past,
      present: { circuit, kind, at: now },
      future: [],
    };
  }
  const newPast = [...h.past, h.present].slice(-MAX_HISTORY);
  return {
    past: newPast,
    present: { circuit, kind, at: now },
    future: [],
  };
}

export function undo(h: History): History {
  if (h.past.length === 0) return h;
  const prev = h.past[h.past.length - 1];
  return {
    past: h.past.slice(0, -1),
    present: prev,
    future: [h.present, ...h.future],
  };
}

export function redo(h: History): History {
  if (h.future.length === 0) return h;
  const next = h.future[0];
  return {
    past: [...h.past, h.present],
    present: next,
    future: h.future.slice(1),
  };
}

export function reset(circuit: Circuit): History {
  return createHistory(circuit);
}

export function canUndo(h: History): boolean {
  return h.past.length > 0;
}

export function canRedo(h: History): boolean {
  return h.future.length > 0;
}

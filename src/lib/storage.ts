import type { Circuit } from "./types";

const STORAGE_KEY = "logic-lab:saved-circuits";
const AUTOSAVE_KEY = "logic-lab:autosave";
const PREFS_KEY = "logic-lab:prefs";

export type SavedCircuit = {
  name: string;
  savedAt: number;
  circuit: Circuit;
};

export type Preferences = {
  symbolStyle: "ansi" | "iec";
  dark: boolean;
  showGrid: boolean;
  snap: boolean;
};

const DEFAULT_PREFS: Preferences = {
  symbolStyle: "ansi",
  dark: true,
  showGrid: true,
  snap: true,
};

export function loadPrefs(): Preferences {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_PREFS, ...parsed };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function savePrefs(prefs: Preferences): void {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // ignore quota errors
  }
}

export function loadAutosave(): Circuit | null {
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Circuit;
  } catch {
    return null;
  }
}

export function writeAutosave(circuit: Circuit): void {
  try {
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(circuit));
  } catch {
    // ignore quota errors
  }
}

export function listSavedCircuits(): SavedCircuit[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedCircuit[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCircuit(name: string, circuit: Circuit): void {
  const all = listSavedCircuits();
  const existingIdx = all.findIndex((c) => c.name === name);
  const entry: SavedCircuit = { name, savedAt: Date.now(), circuit };
  if (existingIdx >= 0) {
    all[existingIdx] = entry;
  } else {
    all.push(entry);
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
}

export function deleteSavedCircuit(name: string): void {
  const all = listSavedCircuits().filter((c) => c.name !== name);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
}

export function exportCircuitToJson(circuit: Circuit): string {
  return JSON.stringify(circuit, null, 2);
}

export function importCircuitFromJson(json: string): Circuit {
  const parsed = JSON.parse(json);
  if (
    !parsed ||
    typeof parsed !== "object" ||
    typeof parsed.gates !== "object" ||
    typeof parsed.wires !== "object"
  ) {
    throw new Error("Invalid circuit file");
  }
  return parsed as Circuit;
}

const SIGNAL_LABELS_KEY = "logic-lab:signal-labels";

export function loadSignalLabels(): boolean {
  try {
    return localStorage.getItem(SIGNAL_LABELS_KEY) === "true";
  } catch {
    return false;
  }
}

export function saveSignalLabels(v: boolean): void {
  try {
    localStorage.setItem(SIGNAL_LABELS_KEY, String(v));
  } catch {
    // ignore
  }
}

export function downloadCircuit(name: string, circuit: Circuit): void {
  const data = exportCircuitToJson(circuit);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name || "circuit"}.logiclab.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Play,
  Square,
  RotateCcw,
  Download,
  Upload,
  Trash2,
  MousePointer2,
  Plus,
  Minus,
  X,
  Settings2,
  Info,
  ChevronRight,
  Database,
  Cpu,
  PanelLeft,
  PanelRight,
  Monitor,
  Maximize2,
  Activity,
  ChevronDown,
  Zap,
  Search,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { toast } from "sonner";

import {
  LineChart,
  Line,
  AreaChart,
  Area,
  ResponsiveContainer,
} from "recharts";

import { useHardwareBus } from "@/lib/hardware-bus";

import {
  LadderState,
  LadderNode,
  NodeType,
  GRID_SIZE,
  NODE_WIDTH,
  NODE_HEIGHT,
  LEFT_RAIL_X,
  RIGHT_RAIL_X,
  RUNG_HEIGHT,
} from "@/lib/plc-types";
import { TagManager } from "@/components/plc/TagManager";
import { solveCircuit } from "@/lib/plc-simulator";
import { Sidebar } from "@/components/plc/Sidebar";
import {
  playClick,
  playConnect,
  playSuccess,
  playError,
  playModeChange,
} from "@/lib/audio";
import { LadderCanvas } from "@/components/plc/LadderCanvas";
import { PropertyInspector } from "@/components/plc/PropertyInspector";
import { Toolbar } from "@/components/plc/Toolbar";
import { BlockView } from "@/components/plc/BlockView";
import { MechatronicsView } from "@/components/plc/MechatronicsView";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const INITIAL_STATE: LadderState = {
  nodes: [],
  wires: [],
  rungComments: {},
  simulation: {
    isRunning: false,
    forcesEnabled: true,
    forces: {},
    values: {
      "I:0/1": false,
      "O:0/1": false,
    },
    history: {},
    logs: [
      {
        id: "l1",
        timestamp: Date.now(),
        message: "Kernel Buffer Initialized",
        type: "info",
      },
      {
        id: "l2",
        timestamp: Date.now(),
        message: "System Ready",
        type: "info",
      },
    ],
  },
};

import { IOSimulator } from "@/components/plc/IOSimulator";
import type { AnalogProject } from "@/lib/analog-types";
import { EcosystemTranslator } from "@/lib/EcosystemTranslator";

export default function PLCPage({ project, onProjectChange }: { project?: AnalogProject, onProjectChange?: (p: AnalogProject) => void }) {
  const [state, setState] = useState<LadderState>(() => {
    try {
      const saved = project?.data ? JSON.stringify(project.data) : localStorage.getItem("voltlogic_circuit_v3");
      const parsed = saved ? JSON.parse(saved) : INITIAL_STATE;

      // Migration: Ensure all simulation properties exist
      if (parsed.simulation) {
        if (!parsed.simulation.logs)
          parsed.simulation.logs = INITIAL_STATE.simulation.logs || [];
        if (!parsed.simulation.forces) parsed.simulation.forces = {};
        if (!parsed.simulation.history) parsed.simulation.history = {};
        if (!parsed.simulation.values)
          parsed.simulation.values = INITIAL_STATE.simulation.values;
      }

      return parsed;
    } catch (e) {
      return INITIAL_STATE;
    }
  });

  const [history, setHistory] = useState<LadderState[]>([]);
  const [future, setFuture] = useState<LadderState[]>([]);

  useEffect(() => {
    if (project?.data) {
      setState(project.data);
      setHistory([]);
      setFuture([]);
    } else if (!project) {
       // if we unmount project or go to raw PLC page, maybe load localstorage?
    }
  }, [project?.id]);

  const pushToHistory = useCallback(
    (nextState: LadderState) => {
      setHistory((prev) => [...prev.slice(-49), state]);
      setFuture([]);
      setState(nextState);
    },
    [state],
  );

  const undo = useCallback(() => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setFuture((f) => [state, ...f]);
    setHistory((h) => h.slice(0, -1));
    setState(prev);
    addNotification("Undo successful", "info");
  }, [history, state]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    setHistory((h) => [...h, state]);
    setFuture((f) => f.slice(1));
    setState(next);
    addNotification("Redo successful", "info");
  }, [future, state]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const jumpToNode = (nodeId: string) => {
    const node = state.nodes.find((n) => n.id === nodeId);
    if (node) {
      const containerWidth =
        window.innerWidth -
        (isSidebarOpen ? sidebarWidth : 80) -
        (selectedId ? inspectorWidth : 0);
      const containerHeight =
        window.innerHeight - 64 - (isConsoleOpen ? consoleHeight : 0);

      setViewport({
        x: -node.x * viewport.zoom + containerWidth / 2,
        y: -node.y * viewport.zoom + containerHeight / 2,
        zoom: viewport.zoom,
      });
      setSelectedId(nodeId);
      setIsSearchOpen(false);
      addNotification(`Jumped to ${node.address || nodeId}`, "info");
    }
  };

  const handleExport = () => {
    const data = JSON.stringify(state, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ladder_project_${new Date().toISOString().split("T")[0]}.vlp`;
    a.click();
    URL.revokeObjectURL(url);
    addNotification("Project exported successfully", "success");
    setActiveMenu(null);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (parsed.nodes && parsed.wires) {
          pushToHistory(parsed);
          addNotification("Project imported successfully", "success");
        } else {
          throw new Error("Invalid format");
        }
      } catch (err) {
        addNotification(
          "Import failed: File data corrupted or invalid",
          "error",
        );
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setActiveMenu(null);
  };

  const filteredNodes = useMemo(() => {
    if (!searchQuery) return [];
    const q = searchQuery.toLowerCase();
    return state.nodes.filter(
      (n) =>
        n.address.toLowerCase().includes(q) ||
        n.tag.toLowerCase().includes(q) ||
        n.type.toLowerCase().includes(q),
    );
  }, [state.nodes, searchQuery]);

  const [placementType, setPlacementType] = useState<NodeType | "wire" | null>(
    null,
  );
  const [viewport, setViewport] = useState({ x: 50, y: 50, zoom: 0.9 });
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [consoleTab, setConsoleTab] = useState<
    "watch" | "cross" | "forces" | "trends" | "logs"
  >("watch");
  const [pausedTrends, setPausedTrends] = useState<Record<string, boolean>>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [isPropertyOpen, setIsPropertyOpen] = useState(true);
  const [inspectorWidth, setInspectorWidth] = useState(350);
  const [isConsoleOpen, setIsConsoleOpen] = useState(true);
  const [consoleHeight, setConsoleHeight] = useState(190);
  const [ioSimulatorWidth, setIoSimulatorWidth] = useState(290);

  const resizingPanel = useRef<
    "sidebar" | "inspector" | "console" | "ioSimulator" | null
  >(null);

  const startResizing = useCallback(
    (panel: "sidebar" | "inspector" | "console" | "ioSimulator") => {
      resizingPanel.current = panel;
      document.body.style.cursor =
        panel === "console" ? "row-resize" : "col-resize";
      document.body.style.userSelect = "none";
    },
    [],
  );

  const stopResizing = useCallback(() => {
    resizingPanel.current = null;
    document.body.style.cursor = "default";
    document.body.style.userSelect = "auto";
  }, []);

  const resize = useCallback(
    (e: MouseEvent) => {
      if (resizingPanel.current === "inspector") {
        const newWidth = window.innerWidth - e.clientX;
        if (newWidth > 250 && newWidth < 700) {
          setInspectorWidth(newWidth);
        }
      } else if (resizingPanel.current === "sidebar") {
        const newWidth = e.clientX;
        if (newWidth > 150 && newWidth < 500) {
          setSidebarWidth(newWidth);
        }
      } else if (resizingPanel.current === "ioSimulator") {
        const offsetLeft = isSidebarOpen ? sidebarWidth : 0;
        const newWidth = e.clientX - offsetLeft;
        if (newWidth > 180 && newWidth < 600) {
          setIoSimulatorWidth(newWidth);
        }
      } else if (resizingPanel.current === "console") {
        const newHeight = window.innerHeight - e.clientY - 32;
        if (newHeight > 100 && newHeight < 600) {
          setConsoleHeight(newHeight);
        }
      }
    },
    [isSidebarOpen, sidebarWidth],
  );

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);

  const [currentView, setCurrentView] = useState<
    "routine" | "tags" | "blocks" | "mechatronics"
  >("routine");
  const [showIOSim, setShowIOSim] = useState(false);
  const [isCommunicating, setIsCommunicating] = useState<string | null>(null);
  const [showWhoActive, setShowWhoActive] = useState(false);
  const [notifications, setNotifications] = useState<
    { id: string; text: string; type: "info" | "error" | "success" }[]
  >([]);

  const addLog = (
    message: string,
    type: "info" | "warning" | "error" = "info",
  ) => {
    const id = Math.random().toString(36).substr(2, 9);
    setState((prev) => ({
      ...prev,
      simulation: {
        ...prev.simulation,
        logs: [
          { id, timestamp: Date.now(), message, type },
          ...prev.simulation.logs.slice(0, 99),
        ],
      },
    }));
  };

  const addNotification = (
    text: string,
    type: "info" | "error" | "success" = "info",
  ) => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications((prev) => [...prev, { id, text, type }]);
    addLog(text, type === "error" ? "error" : "info");
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4000);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      if (e.key === "F2") {
        e.preventDefault();
        setIsSidebarOpen((prev) => !prev);
      } else if (e.key === "F4") {
        e.preventDefault();
        setIsPropertyOpen((prev) => !prev);
      } else if (e.key === "F6") {
        e.preventDefault();
        setIsConsoleOpen((prev) => !prev);
      } else if (e.key === "k" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setIsSearchOpen(true);
      } else if (e.key === "z" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        undo();
      } else if (e.key === "y" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        redo();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedId) {
          deleteNode(selectedId);
          playClick();
        }
      } else if (e.key === " ") {
        e.preventDefault();
        toggleSimulation();
      } else if (e.key === "Escape") {
        setPlacementType(null);
        setActiveMenu(null);
        if (isSearchOpen) setIsSearchOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId, undo, redo, isSearchOpen, state.simulation.isRunning]);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target as HTMLElement).closest(".menu-container")) {
        setActiveMenu(null);
      }
    };
    if (activeMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activeMenu]);

  const handleVerify = () => {
    const errors: string[] = [];
    state.nodes.forEach((node) => {
      if (!node.tag || node.tag.trim() === "") {
        errors.push(`Empty tag at ${node.address || "unassigned address"}`);
      }
    });

    if (errors.length > 0) {
      addNotification(
        `Verification failed: ${errors.length} errors found.`,
        "error",
      );
      playError();
    } else {
      addNotification("Routine verified: 0 errors, 0 warnings.", "success");
      playSuccess();
    }
    setActiveMenu(null);
  };

  const disableAllForces = () => {
    setState((prev) => ({
      ...prev,
      simulation: { ...prev.simulation, forcesEnabled: false },
    }));
    addNotification("Forces Disabled Globally", "info");
    setActiveMenu(null);
  };

  const removeAllForces = () => {
    setState((prev) => ({
      ...prev,
      simulation: { ...prev.simulation, forces: {} },
    }));
    addNotification("All Forces Removed", "info");
    setActiveMenu(null);
  };

  const enableForces = () => {
    setState((prev) => ({
      ...prev,
      simulation: { ...prev.simulation, forcesEnabled: true },
    }));
    addNotification("Forces Enabled Globally", "success");
    setActiveMenu(null);
  };

  // PERSISTENCE Save (Debounced to maintain pristine 60FPS simulation performance)
  useEffect(() => {
    const handler = setTimeout(() => {
      // Create a cloned state without transient log arrays and charts to optimize disk space and performance
      const { simulation, ...rest } = state;
      const sanitizedState = {
        ...rest,
        simulation: {
          ...simulation,
          history: {}, // Purge transient chart trace arrays on disk storage
          logs: (simulation.logs || []).slice(-20), // Truncate transient warning logs to save write space
        }
      };
      
      if (project && onProjectChange) {
        onProjectChange({ ...project, data: sanitizedState });
      } else {
        localStorage.setItem("voltlogic_circuit_v3", JSON.stringify(sanitizedState));
      }
    }, 1500);

    return () => clearTimeout(handler);
  }, [state, project, onProjectChange]);

  // Simulation loop
  useEffect(() => {
    if (!state.simulation.isRunning) return;

    const interval = setInterval(() => {
      const hw = useHardwareBus.getState();
      
      setState((prev) => {
        // Integrate inputs from Global Hardware Bus
        const incomingValues = { ...prev.simulation.values };
        Object.entries(hw.analogOut).forEach(([id, val]) => {
          incomingValues[`ANALOG_${id}`] = val > 2.5; // High threshold
        });
        Object.entries(hw.robotSensors).forEach(([id, val]) => {
          incomingValues[`ROBOT_${id}`] = val;
        });
        
        const stateToSolve = {
          ...prev,
          simulation: { ...prev.simulation, values: incomingValues }
        };

        const nextValues = solveCircuit(stateToSolve);

        // Publish outputs to Global Hardware Bus
        const newPlcOut: Record<string, boolean> = {};
        Object.entries(nextValues).forEach(([k, v]) => {
          if (typeof v === 'boolean' && !k.startsWith('__')) {
            newPlcOut[k] = v;
          }
        });
        useHardwareBus.setState((s) => ({ ...s, plcOut: { ...s.plcOut, ...newPlcOut } }));

        // Loop through all nodes, and update dynamic device percent levels
        let deviceStateChanged = false;
        const nextNodes = prev.nodes.map((node) => {
          if (node.deviceProfile && node.deviceProfile.deviceType !== "none") {
            const profile = node.deviceProfile;
            const isEnergized = !!nextValues[node.address];

            const step = 10000 / (profile.transitTimeMs || 1000);
            let nextPercent = profile.currentPercent || 0;

            if (isEnergized) {
              nextPercent = Math.min(100, nextPercent + step);
            } else {
              nextPercent = Math.max(0, nextPercent - step);
            }

            if (Math.abs(nextPercent - (profile.currentPercent || 0)) > 0.01) {
              deviceStateChanged = true;
              return {
                ...node,
                deviceProfile: {
                  ...profile,
                  currentPercent: nextPercent,
                },
              };
            }
          }
          return node;
        });

        // Resolve feedback register mappings based on nextNodes
        nextNodes.forEach((node) => {
          if (node.deviceProfile && node.deviceProfile.deviceType !== "none") {
            const profile = node.deviceProfile;
            const pct = profile.currentPercent || 0;
            const type = profile.deviceType;

            if (type === "motor") {
              if (profile.feedbackAddr1) {
                nextValues[profile.feedbackAddr1] = pct > 10;
              }
            } else if (type === "piston") {
              if (profile.feedbackAddr1) {
                nextValues[profile.feedbackAddr1] = pct <= 1;
              }
              if (profile.feedbackAddr2) {
                nextValues[profile.feedbackAddr2] = pct >= 99;
              }
            } else if (type === "valve") {
              if (profile.feedbackAddr1) {
                nextValues[profile.feedbackAddr1] = pct <= 1;
              }
              if (profile.feedbackAddr2) {
                nextValues[profile.feedbackAddr2] = pct >= 99;
              }
            } else if (type === "light") {
              if (profile.feedbackAddr1) {
                nextValues[profile.feedbackAddr1] = pct > 0;
              }
            } else if (type === "siren") {
              if (profile.feedbackAddr1) {
                nextValues[profile.feedbackAddr1] = pct > 0;
              }
            } else if (type === "heater") {
              if (profile.feedbackAddr1) {
                nextValues[profile.feedbackAddr1] = pct >= 80;
              }
            }
          }
        });

        const nextHistory = { ...prev.simulation.history };
        let valueDiff = false;
        const addrs = Object.keys(nextValues);
        for (let i = 0; i < addrs.length; i++) {
          const addr = addrs[i];
          if (nextValues[addr] !== prev.simulation.values[addr]) {
            valueDiff = true;
            break;
          }
        }

        // Rolling history queues (Optimized: only track addresses of actual active schema components or targets to protect memory and avoid execution lag)
        const activeTrackSet = new Set<string>();
        prev.nodes.forEach((node) => {
          if (!node.address) return;
          activeTrackSet.add(node.address);
          if (node.type.startsWith("timer") || node.type.startsWith("counter")) {
            activeTrackSet.add(`${node.address}_ACC`);
            activeTrackSet.add(`${node.address}_DN`);
          }
          if (node.deviceProfile) {
            if (node.deviceProfile.feedbackAddr1) activeTrackSet.add(node.deviceProfile.feedbackAddr1);
            if (node.deviceProfile.feedbackAddr2) activeTrackSet.add(node.deviceProfile.feedbackAddr2);
          }
          if (node.params) {
            if (node.params.sourceA && typeof node.params.sourceA === "string") activeTrackSet.add(node.params.sourceA);
            if (node.params.sourceB && typeof node.params.sourceB === "string") activeTrackSet.add(node.params.sourceB);
            if (node.params.dest) activeTrackSet.add(node.params.dest);
          }
        });
        activeTrackSet.add("I:0/0"); // default oscilloscope target

        activeTrackSet.forEach((addr) => {
          if (nextValues[addr] === undefined) return;
          // If the primary address or its ACC/DN subkeys are paused, skip logging
          if (pausedTrends[addr] || pausedTrends[addr.split("_")[0]]) return;
          const val = nextValues[addr];
          const numVal =
            typeof val === "boolean" ? (val ? 1 : 0) : (val as number);
          const h = nextHistory[addr] || [];
          nextHistory[addr] = [...h.slice(-49), numVal];
        });

        const changed = deviceStateChanged || valueDiff || addrs.length > 0;

        if (!changed) return prev;

        return {
          ...prev,
          nodes: nextNodes,
          simulation: {
            ...prev.simulation,
            values: nextValues,
            history: nextHistory,
          },
        };
      });
    }, 100);

    return () => clearInterval(interval);
  }, [state.simulation.isRunning, pausedTrends]);

  const addNode = (type: NodeType, x: number, y: number) => {
    let address = `B3:0/${state.nodes.length}`;
    if (type === "coil" || type === "coil-latch" || type === "coil-unlatch")
      address = `O:0/${state.nodes.length}`;
    else if (type.startsWith("contact") || type === "one-shot")
      address = `I:0/${state.nodes.length}`;
    else if (type.startsWith("timer")) address = `T4:${state.nodes.length}`;
    else if (type.startsWith("counter")) address = `C5:${state.nodes.length}`;
    else if (type.startsWith("compare") || type.startsWith("math"))
      address = `N7:${state.nodes.length}`;

    const isJunction = type === "wire-junction";
    const nodeWidth = isJunction ? 16 : NODE_WIDTH;
    const nodeHeight = isJunction ? 16 : NODE_HEIGHT;

    const newNode: LadderNode = {
      id: `node-${Date.now()}`,
      type,
      x: isJunction
        ? Math.round(x / 8) * 8 - 8
        : Math.round(x / GRID_SIZE) * GRID_SIZE,
      y: isJunction
        ? Math.round(y / 8) * 8 - 8
        : Math.round((y - RUNG_HEIGHT / 2) / RUNG_HEIGHT) * RUNG_HEIGHT +
          (RUNG_HEIGHT / 2 - nodeHeight / 2),
      width: nodeWidth,
      height: nodeHeight,
      tag: `${type.toUpperCase().replace("-", "_")}_${state.nodes.length + 1}`,
      address,
      params: {
        preset: type.startsWith("timer")
          ? 5
          : type.startsWith("counter")
            ? 10
            : undefined,
        sourceA:
          type.startsWith("compare") || type.startsWith("math")
            ? `N7:0`
            : undefined,
        sourceB:
          type.startsWith("compare") || type.startsWith("math") ? 0 : undefined,
        dest: type.startsWith("math") ? `N7:1` : undefined,
      },
    };
    pushToHistory({
      ...state,
      nodes: [...state.nodes, newNode],
    });
    setSelectedId(newNode.id);
  };

  const updateNode = useCallback(
    (id: string, updates: Partial<LadderNode>) => {
      pushToHistory({
        ...state,
        nodes: state.nodes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
      });
    },
    [state, pushToHistory],
  );

  const updateNodeDragging = useCallback(
    (id: string, updates: Partial<LadderNode>) => {
      setState((prev) => ({
        ...prev,
        nodes: prev.nodes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
      }));
    },
    [],
  );

  const deleteNode = useCallback(
    (id: string) => {
      pushToHistory({
        ...state,
        nodes: state.nodes.filter((n) => n.id !== id),
        wires: state.wires.filter((w) => w.fromId !== id && w.toId !== id),
      });
      setSelectedId(null);
    },
    [state, pushToHistory],
  );

  const addWire = useCallback(
    (
      fromId: string,
      fromSide: "left" | "right",
      toId: string,
      toSide: "left" | "right",
    ) => {
      const newWire = {
        id: `wire-${Date.now()}`,
        fromId,
        fromSide,
        toId,
        toSide,
        points: [],
      };
      pushToHistory({
        ...state,
        wires: [...state.wires, newWire],
      });
      addNotification("Connection established", "success");
    },
    [state, pushToHistory],
  );

  const deleteWire = useCallback(
    (id: string) => {
      pushToHistory({
        ...state,
        wires: state.wires.filter((w) => w.id !== id),
      });
      addNotification("Connection removed", "info");
    },
    [state, pushToHistory],
  );

  const updateWire = useCallback(
    (id: string, updates: Partial<import('@/lib/plc-types').Wire>) => {
      pushToHistory({
        ...state,
        wires: state.wires.map((w) => w.id === id ? { ...w, ...updates } : w)
      });
    },
    [state, pushToHistory]
  );

  const toggleSimulation = () => {
    const nextRunning = !state.simulation.isRunning;
    setState((prev) => ({
      ...prev,
      simulation: {
        ...prev.simulation,
        isRunning: nextRunning,
      },
    }));
    playModeChange(nextRunning);
  };

  const toggleAddress = (address: string) => {
    setState((prev) => {
      const nextValues = {
        ...prev.simulation.values,
        [address]: !prev.simulation.values[address],
      };

      const updatedState = {
        ...prev,
        simulation: {
          ...prev.simulation,
          isRunning: true, // Auto-start runner for instant interactive feedback if offline
          values: nextValues,
        },
      };

      // Solve circuit logic and update state in sync immediately
      const solved = solveCircuit(updatedState);

      return {
        ...updatedState,
        simulation: {
          ...updatedState.simulation,
          values: solved,
        },
      };
    });
  };

  const simulateCommAction = (type: "UPLOAD" | "DOWNLOAD") => {
    setIsCommunicating(type);

    setTimeout(() => {
      setIsCommunicating(null);
      addNotification(`${type} COMPLETED SUCCESSFULLY`, "success");
      if (type === "DOWNLOAD") {
        setState((prev) => ({
          ...prev,
          simulation: { ...prev.simulation, isRunning: true },
        }));
      }
    }, 2500);
  };

  const handleForceIO = (address: string, value?: boolean) => {
    setState((prev) => {
      const nextForces = { ...(prev.simulation.forces || {}) };
      if (value === undefined) {
        delete nextForces[address];
      } else {
        nextForces[address] = value;
      }

      const updatedState = {
        ...prev,
        simulation: {
          ...prev.simulation,
          forces: nextForces,
        },
      };

      const solved = solveCircuit(updatedState);

      return {
        ...updatedState,
        simulation: {
          ...updatedState.simulation,
          values: solved,
        },
      };
    });
  };

  const updateTagByAddress = (address: string, newTag: string) => {
    setState((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) =>
        n.address === address ? { ...n, tag: newTag } : n,
      ),
    }));
    addNotification(`Tag updated: ${address} -> ${newTag}`, "success");
  };

  const handleRungAction = (
    index: number,
    action: "delete" | "edit-comment",
    newValue?: string
  ) => {
    if (action === "delete") {
      setState((prev) => ({
        ...prev,
        nodes: prev.nodes.filter((n) => {
          const rungIdx = Math.round((n.y + n.height / 2 - 48) / 96);
          return rungIdx !== index;
        }),
        rungComments: Object.fromEntries(
          Object.entries(prev.rungComments || {}).filter(
            ([k]) => Number(k) !== index,
          ),
        ),
      }));
      addNotification(`Rung ${index} cleared`, "info");
    } else {
      let comment: string | undefined | null = newValue;
      if (comment === undefined) {
        comment = prompt(
          "Enter Rung Comment:",
          state.rungComments?.[index] || "",
        );
      }
      if (comment !== null && comment !== undefined) {
        setState((prev) => ({
          ...prev,
          rungComments: { ...prev.rungComments, [index]: comment as string },
        }));
      }
    }
  };

  const handleSearch = (term: string) => {
    const node = state.nodes.find(
      (n) =>
        n.tag?.toLowerCase().includes(term.toLowerCase()) ||
        n.address?.toLowerCase().includes(term.toLowerCase()),
    );
    if (node) {
      setViewport({
        x: -node.x * viewport.zoom + 400,
        y: -node.y * viewport.zoom + 300,
        zoom: viewport.zoom,
      });
      setSelectedId(node.id);
      addNotification(`Moved to ${node.tag || node.address}`, "info");
    } else {
      addNotification(`Search term "${term}" not found`, "error");
    }
  };

  const deleteTagByAddress = (address: string) => {
    setState((prev) => ({
      ...prev,
      nodes: prev.nodes.filter((n) => n.address !== address),
    }));
    addNotification(`All instructions with address ${address} removed`, "info");
  };

  const handleClear = () => {
    setState({ ...INITIAL_STATE, nodes: [] });
    setSelectedId(null);
  };

  const handleCanvasClick = (x: number, y: number) => {
    if (placementType === "wire") {
      const id = `junction-${Date.now()}`;
      const snappedX = Math.round(x / 8) * 8;
      const snappedY = Math.round(y / 8) * 8;

      const newNode: LadderNode = {
        id,
        type: "wire-junction",
        x: snappedX - 8,
        y: snappedY - 8,
        width: 16,
        height: 16,
        tag: "",
        address: "",
      };

      pushToHistory({
        ...state,
        nodes: [...state.nodes, newNode],
      });
    } else if (placementType) {
      addNode(placementType, x, y);
      setPlacementType(null);
    } else {
      setSelectedId(null);
      setActiveMenu(null);
    }
  };

  const handleNodeDoubleClick = (id: string) => {
    setSelectedId(id);
    setIsPropertyOpen(true);
  };

  return (
    <div className="flex flex-col h-full w-full font-sans overflow-hidden bg-[#07080b] text-slate-200 select-none">
      {/* System Status Bar (Topmost) */}
      <div className="h-7 bg-[#090a0d] flex items-center justify-between px-6 text-[10px] font-medium tracking-tight border-b border-white/5 text-zinc-400 shrink-0 z-[60]">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "w-2 h-2 rounded-full",
                state.simulation.isRunning
                  ? "bg-green-500 animate-pulse shadow-[0_0_10px_#22c55e]"
                  : "bg-zinc-700",
              )}
            />
            <span className="text-zinc-500">
              SYS_KERNEL: <span className="text-slate-300">AIS_3000_RT</span>
            </span>
          </div>
          <div className="w-px h-3 bg-zinc-800" />
          <span className="text-zinc-500">
            MODE:{" "}
            <span
              className={
                state.simulation.isRunning ? "text-green-500" : "text-amber-500"
              }
            >
              {state.simulation.isRunning ? "RUN_REMOTE" : "PROGRAM_LOCAL"}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-zinc-500 font-mono">
            I/O_SYNC: <span className="text-emerald-400 font-black">1.2ms</span>
          </span>
          <span className="text-zinc-500 font-mono">LOCAL_IP: 127.0.0.1</span>
          <div className="w-px h-3 bg-zinc-800" />

          {/* Unobtrusive Global Zoom Controller representing Rockwell Studio 5000 style */}
          <div className="flex items-center bg-zinc-950/80 border border-white/5 px-2 py-0.5 rounded gap-1.5 shadow-sm">
            <span className="text-[9px] font-mono text-zinc-400 font-bold uppercase tracking-widest mr-1">
              ZOOM: {Math.round(viewport.zoom * 100)}%
            </span>
            <div className="w-px h-2 bg-zinc-800" />
            <button
              onClick={() =>
                setViewport((v) => ({
                  ...v,
                  zoom: Math.max(0.2, v.zoom - 0.1),
                }))
              }
              className="hover:text-sky-400 p-0.5 text-zinc-500 transition-colors flex items-center justify-center cursor-pointer"
              title="Zoom Out"
            >
              <Minus size={10} />
            </button>
            <button
              onClick={() => setViewport((v) => ({ ...v, zoom: 0.9 }))}
              className="hover:text-sky-400 hover:bg-white/5 px-1 py-0.5 rounded text-[8.5px] font-mono font-bold text-zinc-400 transition-all select-none cursor-pointer"
              title="Reset Zoom (100%)"
            >
              100%
            </button>
            <button
              onClick={() =>
                setViewport((v) => ({ ...v, zoom: Math.min(2, v.zoom + 0.1) }))
              }
              className="hover:text-sky-400 p-0.5 text-zinc-500 transition-colors flex items-center justify-center cursor-pointer"
              title="Zoom In"
            >
              <Plus size={10} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Header / View Selector */}
      <header className="h-11 bg-[#090a0d]/90 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6 shrink-0 z-50 text-slate-200">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="bg-sky-600 p-1.5 rounded-lg shadow-lg">
              <Zap size={14} className="text-white fill-white" />
            </div>
            <div className="flex flex-col leading-none">
              <h1 className="text-[12px] font-black tracking-tight uppercase text-white">
                VoltLogic Pro
              </h1>
              <span className="text-[7.5px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">
                Industrial Studio
              </span>
            </div>
          </div>

          <div className="flex bg-[#12141c] rounded-lg p-0.5 border border-white/5">
            <button
              onClick={() => setCurrentView("routine")}
              className={cn(
                "px-4 py-1 rounded text-[10px] uppercase font-bold tracking-wider transition-all",
                currentView === "routine"
                  ? "bg-sky-600 text-white shadow-sm font-black"
                  : "text-zinc-400 hover:text-zinc-200",
              )}
            >
              Routine
            </button>
            <button
              onClick={() => setCurrentView("blocks")}
              className={cn(
                "px-4 py-1 rounded text-[10px] uppercase font-bold tracking-wider transition-all",
                currentView === "blocks"
                  ? "bg-sky-600 text-white shadow-sm font-black"
                  : "text-zinc-400 hover:text-zinc-200",
              )}
            >
              Blocks
            </button>
            <button
              onClick={() => setCurrentView("tags")}
              className={cn(
                "px-4 py-1 rounded text-[10px] uppercase font-bold tracking-wider transition-all",
                currentView === "tags"
                  ? "bg-sky-600 text-white shadow-sm font-black"
                  : "text-zinc-400 hover:text-zinc-200",
              )}
            >
              Tags
            </button>
            <button
              onClick={() => setCurrentView("mechatronics")}
              className={cn(
                "px-4 py-1 rounded text-[10px] uppercase font-bold tracking-wider transition-all",
                currentView === "mechatronics"
                  ? "bg-sky-600 text-white shadow-sm font-black"
                  : "text-zinc-400 hover:text-zinc-200",
              )}
            >
              Mechatronics
            </button>
            <div className="w-px h-4 bg-white/10 mx-1 self-center" />
            <button
              onClick={() => setShowIOSim(!showIOSim)}
              className={cn(
                "px-4 py-1 rounded text-[10px] uppercase font-bold tracking-wider transition-all",
                showIOSim
                  ? "bg-amber-600 text-white shadow-sm font-black"
                  : "text-zinc-400 hover:text-zinc-200",
              )}
            >
              I/O Sim
            </button>
          </div>

          <div className="flex items-center px-0.5 bg-[#12141c] rounded-lg border border-white/5">
            {["File", "Edit", "View", "Logic", "Comm", "Help"].map((menu) => (
              <div key={menu} className="relative menu-container">
                <button
                  className={cn(
                    "text-[10px] uppercase tracking-wider font-bold hover:bg-white/5 hover:text-white transition-all px-2.5 h-7 flex items-center rounded-md text-zinc-400",
                    activeMenu === menu &&
                      "bg-[#1f2330] text-sky-400 font-extrabold",
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenu(activeMenu === menu ? null : menu);
                  }}
                >
                  {menu}
                </button>
                {activeMenu === menu && (
                  <div className="absolute top-full left-0 mt-1.5 w-56 bg-[#161922] border border-white/10 rounded-lg shadow-2xl py-1 z-[100] text-slate-200 ring-1 ring-white/5 backdrop-blur-xl">
                    {menu === "File" && (
                      <>
                        <button
                          onClick={() => {
                            handleClear();
                            setActiveMenu(null);
                            addNotification("New Project Created");
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white flex justify-between items-center text-[12px] font-medium transition-colors"
                        >
                          New Project{" "}
                          <span className="opacity-40 text-[10px]">⌘N</span>
                        </button>
                        <button
                          onClick={() => {
                            fileInputRef.current?.click();
                            setActiveMenu(null);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white text-[12px] font-medium transition-colors"
                        >
                          Open Project...
                        </button>
                        <hr className="my-1 border-black/5" />
                        <button
                          onClick={() => {
                            handleExport();
                            setActiveMenu(null);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white text-[12px] font-medium transition-colors"
                        >
                          Save As VLP...
                        </button>
                        <button
                          onClick={() => {
                            setActiveMenu(null);
                            if (confirm("Close application?"))
                              window.location.reload();
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-red-600 hover:text-white text-[12px] font-medium transition-colors"
                        >
                          Exit Application
                        </button>
                      </>
                    )}
                    {menu === "Edit" && (
                      <>
                        <button
                          onClick={() => {
                            undo();
                            setActiveMenu(null);
                          }}
                          disabled={history.length === 0}
                          className={cn(
                            "w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white flex justify-between items-center text-[12px] font-medium transition-colors",
                            history.length === 0 &&
                              "opacity-30 pointer-events-none",
                          )}
                        >
                          Undo{" "}
                          <span className="opacity-40 text-[10px]">⌘Z</span>
                        </button>
                        <button
                          onClick={() => {
                            redo();
                            setActiveMenu(null);
                          }}
                          disabled={future.length === 0}
                          className={cn(
                            "w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white flex justify-between items-center text-[12px] font-medium transition-colors",
                            future.length === 0 &&
                              "opacity-30 pointer-events-none",
                          )}
                        >
                          Redo{" "}
                          <span className="opacity-40 text-[10px]">⌘Y</span>
                        </button>
                        <hr className="my-1 border-black/5" />
                        <button
                          onClick={() => setActiveMenu(null)}
                          className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white flex justify-between items-center text-[12px] font-medium transition-colors"
                        >
                          Cut <span className="opacity-40 text-[10px]">⌘X</span>
                        </button>
                        <button
                          onClick={() => setActiveMenu(null)}
                          className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white flex justify-between items-center text-[12px] font-medium transition-colors"
                        >
                          Copy{" "}
                          <span className="opacity-40 text-[10px]">⌘C</span>
                        </button>
                        <button
                          onClick={() => setActiveMenu(null)}
                          className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white flex justify-between items-center text-[12px] font-medium transition-colors"
                        >
                          Paste{" "}
                          <span className="opacity-40 text-[10px]">⌘V</span>
                        </button>
                        <button
                          onClick={() => {
                            if (selectedId) {
                              deleteNode(selectedId);
                              addNotification("Element deleted");
                            }
                            setActiveMenu(null);
                          }}
                          className={cn(
                            "w-full text-left px-4 py-2 hover:bg-red-600 hover:text-white flex justify-between items-center text-[12px] font-medium transition-colors",
                            !selectedId && "opacity-30 pointer-events-none",
                          )}
                        >
                          Delete{" "}
                          <span className="opacity-40 text-[10px]">⌫</span>
                        </button>
                      </>
                    )}
                    {menu === "View" && (
                      <>
                        <button
                          onClick={() => {
                            setViewport((v) => ({ ...v, zoom: v.zoom + 0.1 }));
                            setActiveMenu(null);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white text-[12px] font-medium transition-colors"
                        >
                          Zoom In (+)
                        </button>
                        <button
                          onClick={() => {
                            setViewport((v) => ({
                              ...v,
                              zoom: Math.max(0.2, v.zoom - 0.1),
                            }));
                            setActiveMenu(null);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white text-[12px] font-medium transition-colors"
                        >
                          Zoom Out (-)
                        </button>
                        <button
                          onClick={() => {
                            setViewport((v) => ({ ...v, zoom: 0.9 }));
                            setActiveMenu(null);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white text-[12px] font-medium transition-colors"
                        >
                          Reset Zoom (0)
                        </button>
                        <hr className="my-1 border-black/5" />
                        <button
                          onClick={() => {
                            setIsSidebarOpen(!isSidebarOpen);
                            setActiveMenu(null);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white flex justify-between items-center text-[12px] font-medium transition-colors"
                        >
                          Controller Organizer{" "}
                          <span>{isSidebarOpen ? "✔" : ""}</span>
                        </button>
                        <button
                          onClick={() => {
                            setIsConsoleOpen(!isConsoleOpen);
                            setActiveMenu(null);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white flex justify-between items-center text-[12px] font-medium transition-colors"
                        >
                          Service Monitor{" "}
                          <span>{isConsoleOpen ? "✔" : ""}</span>
                        </button>
                        <button
                          onClick={() => {
                            setShowIOSim(!showIOSim);
                            setActiveMenu(null);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white flex justify-between items-center text-[12px] font-medium transition-colors"
                        >
                          I/O Simulator <span>{showIOSim ? "✔" : ""}</span>
                        </button>
                      </>
                    )}
                    {menu === "Logic" && (
                      <>
                        <button
                          onClick={() => {
                            handleVerify();
                            setActiveMenu(null);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white text-[11px] font-medium"
                        >
                          Verify Routine
                        </button>
                        <hr className="my-1 border-zinc-800" />
                        <button
                          onClick={() => {
                            state.simulation.forcesEnabled
                              ? disableAllForces()
                              : enableForces();
                            setActiveMenu(null);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white flex justify-between items-center text-[11px] font-medium"
                        >
                          {state.simulation.forcesEnabled
                            ? "Disable"
                            : "Enable"}{" "}
                          Forces
                          <span
                            className={cn(
                              "text-[8px] font-bold px-1 rounded",
                              state.simulation.forcesEnabled
                                ? "bg-amber-500 text-black"
                                : "bg-zinc-700",
                            )}
                          >
                            {state.simulation.forcesEnabled ? "ACTIVE" : "OFF"}
                          </span>
                        </button>
                        <button
                          onClick={() => {
                            removeAllForces();
                            setActiveMenu(null);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white text-[11px] font-medium"
                        >
                          Remove All Forces
                        </button>
                        <hr className="my-1 border-zinc-800" />
                        <button
                          onClick={() => {
                            addNotification("Memory re-optimized");
                            setActiveMenu(null);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white text-[11px] font-medium"
                        >
                          Compact Memory
                        </button>
                      </>
                    )}
                    {menu === "Comm" && (
                      <>
                        <button
                          onClick={() => {
                            setShowWhoActive(true);
                            setActiveMenu(null);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white text-[11px] font-medium"
                        >
                          Who Active...
                        </button>
                        <button
                          onClick={() => {
                            toggleSimulation();
                            setActiveMenu(null);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white text-[11px] font-medium"
                        >
                          {state.simulation.isRunning
                            ? "Go Offline"
                            : "Go Online"}
                        </button>
                        <hr className="my-1 border-zinc-800" />
                        <button
                          onClick={() => {
                            simulateCommAction("UPLOAD");
                            setActiveMenu(null);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white text-[11px] font-medium"
                        >
                          Upload...
                        </button>
                        <button
                          onClick={() => {
                            simulateCommAction("DOWNLOAD");
                            setActiveMenu(null);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white text-[11px] font-medium"
                        >
                          Download...
                        </button>
                      </>
                    )}
                    {menu === "Help" && (
                      <>
                        <button
                          onClick={() => {
                            toast.success(
                              "VoltLogic Pro Industrial Studio v5.0\nEngine: VoltV7000-RT",
                            );
                            setActiveMenu(null);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white text-[11px] font-medium"
                        >
                          About System
                        </button>
                        <button
                          onClick={() => {
                            addNotification(
                              "Help content redirected to console",
                            );
                            setActiveMenu(null);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white text-[11px] font-medium"
                        >
                          Instruction Help
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-0.5 bg-[#12141c] px-1 py-0.5 rounded-lg border border-white/5 mr-2">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={cn(
                "p-1.5 rounded-md transition-all active:scale-95",
                isSidebarOpen
                  ? "bg-white/10 text-sky-400"
                  : "text-zinc-500 hover:bg-white/5",
              )}
              title="Project Explorer (F2)"
            >
              <PanelLeft size={14} />
            </button>
            <button
              onClick={() => setIsConsoleOpen(!isConsoleOpen)}
              className={cn(
                "p-1.5 rounded-md transition-all active:scale-95",
                isConsoleOpen
                  ? "bg-white/10 text-sky-400"
                  : "text-zinc-500 hover:bg-white/5",
              )}
              title="Service Monitor (F6)"
            >
              <Monitor size={14} />
            </button>
            <button
              onClick={() => setIsPropertyOpen(!isPropertyOpen)}
              className={cn(
                "p-1.5 rounded-md transition-all active:scale-95",
                isPropertyOpen
                  ? "bg-white/10 text-sky-400"
                  : "text-zinc-500 hover:bg-white/5",
              )}
              title="Properties (F4)"
            >
              <PanelRight size={14} />
            </button>
          </div>

          <button
            onClick={toggleSimulation}
            className={cn(
              "pl-3.5 pr-4.5 py-1.5 rounded-lg text-[10px] font-bold tracking-tight transition-all shadow-sm active:scale-95 flex items-center gap-2 border uppercase",
              state.simulation.isRunning
                ? "bg-[#10b981] border-[#0ea5e9]/10 text-white shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                : "bg-[#161822] border-white/10 text-zinc-300 hover:bg-[#1f2231]",
            )}
          >
            <div
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                state.simulation.isRunning
                  ? "bg-white animate-pulse"
                  : "bg-zinc-600",
              )}
            />
            {state.simulation.isRunning ? "RUN_ONLINE" : "PROGRAM_OFFLINE"}
          </button>
        </div>
      </header>

      {/* Primary Workspace */}
      <div className="flex-1 flex overflow-hidden">
        <AnimatePresence>
          {isSidebarOpen && (
            <div className="flex shrink-0">
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: sidebarWidth, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ type: "tween", duration: 0 }}
                className="bg-[#0d0f14] border-r border-white/10 flex flex-col overflow-hidden"
              >
                <Sidebar
                  onAddNode={(type) => setPlacementType(type)}
                  placementType={placementType}
                  currentView={currentView}
                  onViewChange={setCurrentView}
                />
              </motion.div>
              {/* Resizer Handle Left */}
              <div
                onMouseDown={() => startResizing("sidebar")}
                className="w-1.5 h-full bg-[#0a0c10] hover:bg-sky-500 cursor-col-resize transition-colors flex items-center justify-center group z-10 border-r border-white/5"
              >
                <div className="w-[1px] h-10 bg-white/10 group-hover:bg-sky-400 opacity-50" />
              </div>
            </div>
          )}

          {showIOSim && (
            <div className="flex shrink-0">
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: ioSimulatorWidth, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ type: "tween", duration: 0 }}
                className="bg-[#0c0d12] border-r border-white/10 flex flex-col overflow-hidden h-full"
              >
                <IOSimulator
                  state={state}
                  onToggleIO={toggleAddress}
                  onForceIO={handleForceIO}
                />
              </motion.div>
              {/* Resizer Handle Simulator */}
              <div
                onMouseDown={() => startResizing("ioSimulator")}
                className="w-1.5 h-full bg-[#0a0c10] hover:bg-sky-500 cursor-col-resize transition-colors flex items-center justify-center group z-10 border-r border-white/5 shrink-0"
              >
                <div className="w-[1px] h-10 bg-white/10 group-hover:bg-sky-400 opacity-50" />
              </div>
            </div>
          )}
        </AnimatePresence>

        <div className="flex-1 flex flex-col relative overflow-hidden bg-[#0a0b10]">
          {currentView === "routine" && (
            <>
              <Toolbar
                isRunning={state.simulation.isRunning}
                hasActiveForces={
                  Object.keys(state.simulation.forces || {}).length > 0
                }
                forcesEnabled={state.simulation.forcesEnabled}
                onToggleSim={toggleSimulation}
                onReset={() =>
                  setState((prev) => ({
                    ...prev,
                    simulation: { ...prev.simulation, values: {} },
                  }))
                }
                onClear={handleClear}
                onSave={handleExport}
                onSearch={handleSearch}
                onImportBridge={() => {
                  try {
                    // Try to get from Digital or Analog
                    let raw = localStorage.getItem('ascads_bridge_digital_plc');
                    if (!raw) {
                      raw = localStorage.getItem('ascads_bridge_analog_plc');
                    }
                    if (!raw) {
                      toast.error('No Bridge logic found from Digital, Analog, or Robot Labs.');
                      return;
                    }
                    const bridge = JSON.parse(raw);
                    
                    if (bridge.nodes && bridge.wires) {
                      // It's a LadderState
                      setState(prev => {
                        let nextY = prev.nodes.length > 0 ? Math.max(...prev.nodes.map(n => n.y)) + RUNG_HEIGHT : RUNG_HEIGHT / 2 - NODE_HEIGHT / 2;
                        const offsetY = nextY - 96; // 96 is rung 0
                        const newNodes = bridge.nodes.map((n: any) => ({ ...n, id: `bridge-${Date.now()}-${n.id}`, y: n.y + offsetY }));
                        const newWires = bridge.wires.map((w: any) => ({ ...w, id: `bridge-${Date.now()}-${w.id}`, fromId: `bridge-${Date.now()}-${w.fromId}`, toId: `bridge-${Date.now()}-${w.toId}` }));
                        return { ...prev, nodes: [...prev.nodes, ...newNodes], wires: [...prev.wires, ...newWires] };
                      });
                    }
                    
                    toast.success('Bridge Import Successful!');
                    playSuccess();
                  } catch (e) {
                    toast.error('Failed to parse bridge data.');
                    console.error(e);
                  }
                }}
                onExportBridge={() => {
                  const digitalCircuit = EcosystemTranslator.plcToDigital(state);
                  localStorage.setItem('ascads_bridge_plc_digital', JSON.stringify(digitalCircuit));
                  
                  const analogDesign = EcosystemTranslator.plcToAnalog(state);
                  localStorage.setItem('ascads_bridge_plc_analog', JSON.stringify(analogDesign));

                  toast.success('Exported to Digital and Analog Logic Bridges!');
                  playSuccess();
                }}
              />
              <div className="flex-1 relative overflow-hidden">
                <LadderCanvas
                  state={state}
                  selectedId={selectedId}
                  viewport={viewport}
                  placementType={placementType}
                  onSelect={setSelectedId}
                  onUpdateNode={updateNode}
                  onUpdateNodeDragging={updateNodeDragging}
                  onToggleAddress={toggleAddress}
                  onViewportChange={setViewport}
                  onCanvasClick={handleCanvasClick}
                  onNodeDoubleClick={handleNodeDoubleClick}
                  onRungAction={handleRungAction}
                  onUpdateTag={(id, tag) => updateNode(id, { tag })}
                  onUpdateAddress={(id, address) => updateNode(id, { address })}
                  onAddWire={addWire}
                  onUpdateWire={updateWire}
                  onDeleteWire={deleteWire}
                />

                {/* Floating Zoom Controls */}
                <div className="hidden">
                  <button
                    onClick={() =>
                      setViewport((v) => ({
                        ...v,
                        zoom: Math.min(2, v.zoom + 0.1),
                      }))
                    }
                    className="w-10 h-10 flex items-center justify-center hover:bg-white/5 rounded-xl transition-colors text-slate-300 active:bg-white/10"
                    title="Zoom In"
                  >
                    <Plus size={18} />
                  </button>
                  <div className="h-px bg-white/10 mx-2" />
                  <button
                    onClick={() =>
                      setViewport((v) => ({
                        ...v,
                        zoom: Math.max(0.2, v.zoom - 0.1),
                      }))
                    }
                    className="w-10 h-10 flex items-center justify-center hover:bg-white/5 rounded-xl transition-colors text-slate-300 active:bg-white/10"
                    title="Zoom Out"
                  >
                    <Minus size={18} />
                  </button>
                  <div className="h-px bg-white/10 mx-2" />
                  <button
                    onClick={() => setViewport((v) => ({ ...v, zoom: 0.9 }))}
                    className="w-10 h-10 flex items-center justify-center text-[10px] font-mono font-bold text-zinc-500 hover:bg-white/5 rounded-xl transition-colors"
                    title="Reset Zoom"
                  >
                    100%
                  </button>
                </div>

                <div className="hidden">
                  CANVAS_VIEW: {Math.round(viewport.zoom * 100)}%
                </div>
              </div>
            </>
          )}

          {currentView === "blocks" && (
            <BlockView
              state={state}
              onNodeClick={(id) => {
                const node = state.nodes.find((n) => n.id === id);
                if (node) {
                  setViewport({
                    x: -node.x * viewport.zoom + 400,
                    y: -node.y * viewport.zoom + 300,
                    zoom: viewport.zoom,
                  });
                  setSelectedId(id);
                  setCurrentView("routine");
                }
              }}
              onToggleAddress={toggleAddress}
              onForceIO={handleForceIO}
            />
          )}

          {currentView === "tags" && (
            <TagManager
              state={state}
              onUpdateTag={updateTagByAddress}
              onDeleteTag={deleteTagByAddress}
            />
          )}

          {currentView === "mechatronics" && (
            <MechatronicsView
              state={state}
              onUpdateAddressValue={(addr, val) => {
                setState((prev) => {
                  const nextValues = { ...prev.simulation.values, [addr]: val };
                  const updatedState = {
                    ...prev,
                    simulation: { ...prev.simulation, values: nextValues },
                  };
                  const solved = solveCircuit(updatedState);
                  return {
                    ...updatedState,
                    simulation: { ...updatedState.simulation, values: solved },
                  };
                });
              }}
              onForceIO={(addr, val, force) => handleForceIO(addr, force ? Boolean(val) : undefined)}
            />
          )}

          <AnimatePresence>
            {isConsoleOpen && (
              <div className="flex flex-col shrink-0">
                {/* Resizer Handle Top (Console) */}
                <div
                  onMouseDown={() => startResizing("console")}
                  className="h-1 w-full bg-black/5 hover:bg-blue-400 cursor-row-resize transition-colors flex items-center justify-center group z-10"
                >
                  <div className="h-[1px] w-8 bg-black/10 group-hover:bg-blue-400 opacity-50" />
                </div>

                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: consoleHeight }}
                  exit={{ height: 0 }}
                  transition={{ type: "tween", duration: 0 }}
                  className="bg-[#0b0c10] border-t border-white/10 flex flex-col overflow-hidden text-slate-200"
                >
                  <div className="h-7 bg-[#090a0e] border-b border-white/10 flex items-center px-4 justify-between text-slate-300 shrink-0 select-none">
                    <div className="flex bg-[#12141a] border border-white/5 rounded p-0.5">
                      {["watch", "trends", "forces", "cross", "logs"].map(
                        (tab) => (
                          <button
                            key={tab}
                            onClick={() => setConsoleTab(tab as any)}
                            className={cn(
                              "px-2 py-0.5 rounded text-[8.5px] font-mono font-bold uppercase tracking-wider transition-all",
                              consoleTab === tab
                                ? "bg-sky-600/95 text-white shadow"
                                : "text-slate-500 hover:text-slate-300",
                            )}
                          >
                            {tab}
                          </button>
                        ),
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[8px] font-mono font-bold text-zinc-500 uppercase tracking-widest bg-zinc-950/40 px-1.5 py-0.5 border border-white/5 rounded">
                        Buffer: Optimal
                      </span>
                      <button
                        onClick={() => setIsConsoleOpen(false)}
                        className="text-zinc-500 hover:text-white transition-colors"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-auto bg-[#0a0b0e] custom-scrollbar text-slate-300">
                    {consoleTab === "watch" && (
                      <div className="p-3">
                        <div className="border border-white/5 bg-[#0a0c12]/50 rounded-xl overflow-hidden shadow-xl">
                          <table className="w-full text-left text-[11px] font-mono border-collapse">
                            <thead className="bg-[#0b0c16] text-[#8e9bb4] sticky top-0 uppercase tracking-widest font-mono font-extrabold text-[8.5px] border-b border-white/5">
                              <tr>
                                <th className="px-5 py-2.5">Address</th>
                                <th className="px-5 py-2.5">Symbolic Tag</th>
                                <th className="px-5 py-2.5 text-right font-mono font-bold">
                                  Real-time Value
                                </th>
                                <th className="px-5 py-2.5 text-right font-mono font-bold">
                                  Force Control Overrides
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-900/40 text-[10.5px]">
                              {state.nodes.map((n) => {
                                const isForced =
                                  state.simulation.forces &&
                                  state.simulation.forces[n.address] !==
                                    undefined;
                                const forcedVal = isForced
                                  ? state.simulation.forces[n.address]
                                  : null;

                                return (
                                  <tr
                                    key={n.id}
                                    className="hover:bg-white/[0.01] transition-colors group"
                                  >
                                    {/* Column 1: Address */}
                                    <td className="px-5 py-2.5 select-all font-bold text-sky-400">
                                      {n.address}
                                    </td>
                                    {/* Column 2: Tag Name */}
                                    <td className="px-5 py-2.5 text-slate-100 font-sans font-semibold tracking-wide flex items-center gap-2">
                                      {n.tag}
                                      <span className="text-[7.5px] text-zinc-500 font-mono font-black uppercase tracking-wider px-1.5 py-0.5 bg-zinc-900/50 border border-white/5 rounded select-none">
                                        {n.type}
                                      </span>
                                    </td>
                                    {/* Column 3: Live Value */}
                                    <td className="px-5 py-2.5 text-right font-black tabular-nums">
                                      <span
                                        className={cn(
                                          "px-2.5 py-1 rounded text-[9.5px] uppercase tracking-wide border font-bold font-mono inline-block min-w-[50px] text-center select-none",
                                          typeof state.simulation.values[
                                            n.address
                                          ] === "boolean"
                                            ? state.simulation.values[n.address]
                                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_8px_rgba(52,211,153,0.1)]"
                                              : "bg-zinc-900 text-zinc-550 border-zinc-800"
                                            : "bg-blue-500/10 text-blue-400 border-blue-500/20",
                                        )}
                                      >
                                        {typeof state.simulation.values[
                                          n.address
                                        ] === "boolean"
                                          ? state.simulation.values[n.address]
                                            ? "ON (1)"
                                            : "OFF (0)"
                                          : state.simulation.values[
                                              n.address
                                            ]?.toString() || "0"}
                                      </span>
                                    </td>
                                    {/* Column 4: Quick Action Buttons */}
                                    <td className="px-5 py-2.5 text-right">
                                      <div className="flex gap-1.5 items-center justify-end select-none">
                                        {isForced ? (
                                          <>
                                            <span
                                              className={cn(
                                                "text-[7.5px] font-mono font-black px-1.5 py-0.5 rounded tracking-wide border",
                                                state.simulation.forcesEnabled
                                                  ? "bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse"
                                                  : "bg-zinc-800 text-zinc-450 border border-zinc-700",
                                              )}
                                            >
                                              FORCED {forcedVal ? "ON" : "OFF"}
                                            </span>
                                            <button
                                              onClick={() =>
                                                handleForceIO(
                                                  n.address,
                                                  !forcedVal,
                                                )
                                              }
                                              className="px-2 py-0.5 border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 font-bold rounded text-[8px] uppercase tracking-wider transition-all"
                                              title="Toggle force direction"
                                            >
                                              Toggle
                                            </button>
                                            <button
                                              onClick={() =>
                                                handleForceIO(
                                                  n.address,
                                                  undefined,
                                                )
                                              }
                                              className="px-2 py-0.5 border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold rounded text-[8px] uppercase tracking-wider transition-all"
                                              title="Clear overriding force"
                                            >
                                              Unforce
                                            </button>
                                          </>
                                        ) : (
                                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 justify-end">
                                            <button
                                              onClick={() =>
                                                handleForceIO(n.address, true)
                                              }
                                              className="px-2 py-0.5 bg-amber-500/10 hover:bg-amber-500/25 text-amber-400 font-extrabold border border-amber-500/20 rounded text-[8.5px] uppercase tracking-wider transition-colors"
                                            >
                                              Force On
                                            </button>
                                            <button
                                              onClick={() =>
                                                handleForceIO(n.address, false)
                                              }
                                              className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-750 text-slate-350 border border-zinc-700 rounded text-[8.5px] uppercase tracking-wider transition-colors"
                                            >
                                              Force Off
                                            </button>
                                            <button
                                              onClick={() =>
                                                setSelectedId(n.id)
                                              }
                                              className="px-2 py-0.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 font-bold border border-blue-500/20 rounded text-[8.5px] uppercase tracking-wider transition-colors"
                                            >
                                              Inspect
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {consoleTab === "trends" && (
                      <div className="p-4 flex flex-col gap-4">
                        {/* Trends Controls Header */}
                        <div className="flex items-center justify-between shrink-0 select-none bg-[#0a101d] border border-white/5 p-3 rounded-xl">
                          <div className="flex items-center gap-2">
                            <Activity size={14} className="text-cyan-400 animate-pulse" />
                            <span className="text-[10px] font-mono font-extrabold text-cyan-400 tracking-wider uppercase">HISTORICAL CHANNEL TRENDS ANALYZER</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                const allChannels = state.nodes.filter(n => n.type.startsWith('timer') || n.type.startsWith('counter') || n.address.startsWith('N7:'));
                                const anyPaused = allChannels.some(n => pausedTrends[n.address] || pausedTrends[`${n.address}_ACC`]);
                                const nextPaused = { ...pausedTrends };
                                allChannels.forEach(n => {
                                  const addr = n.type.startsWith('timer') || n.type.startsWith('counter') ? `${n.address}_ACC` : n.address;
                                  nextPaused[addr] = !anyPaused;
                                });
                                setPausedTrends(nextPaused);
                                addNotification(anyPaused ? "All traces resumed" : "All traces paused", "info");
                              }}
                              className="px-3 py-1 bg-sky-950/40 hover:bg-sky-900/40 text-sky-450 border border-sky-500/20 rounded font-bold text-[9px] uppercase tracking-wider transition-colors"
                            >
                              {state.nodes.filter(n => n.type.startsWith('timer') || n.type.startsWith('counter')).some(n => pausedTrends[`${n.address}_ACC`]) ? 'RESUME ALL CHANNELS' : 'PAUSE ALL CHANNELS'}
                            </button>
                            <button
                              onClick={() => {
                                setState(prev => ({
                                  ...prev,
                                  simulation: { ...prev.simulation, history: {} }
                                }));
                                addNotification("All dynamic plots purged", "info");
                              }}
                              className="px-3 py-1 bg-red-950/40 hover:bg-red-900/40 text-red-400 font-bold border border-red-500/20 rounded text-[9px] uppercase tracking-wider transition-colors"
                            >
                              CLEAR TRACES
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                          {state.nodes
                            .filter(
                              n =>
                                n.type.startsWith('timer') ||
                                n.type.startsWith('counter') ||
                                n.address.startsWith('N7:')
                            )
                            .map(n => {
                              const addr = n.type.startsWith('timer') || n.type.startsWith('counter') ? `${n.address}_ACC` : n.address;
                              const hist = state.simulation.history?.[addr] || [];
                              const isPaused = !!pausedTrends[addr];

                              // Statistics extraction
                              const numHist = hist.filter(v => typeof v === 'number');
                              const curVal = numHist.length > 0 ? numHist[numHist.length - 1] : 0;
                              const maxVal = numHist.length > 0 ? Math.max(...numHist) : 0;
                              const minVal = numHist.length > 0 ? Math.min(...numHist) : 0;
                              const avgVal = numHist.length > 0 ? Math.round(numHist.reduce((acc, v) => acc + v, 0) / numHist.length) : 0;

                              const isTimer = n.type.startsWith('timer');
                              const isCounter = n.type.startsWith('counter');
                              const strokeColor = isTimer ? '#10b981' : isCounter ? '#a855f7' : '#3b82f6';
                              const gradId = `grad_${n.id}`;

                              return (
                                <div key={n.id} className="bg-[#0b0d14]/85 border border-[#1b2132] p-4 rounded-xl flex flex-col gap-3 relative overflow-hidden group">
                                  {/* Subtle background type indicator */}
                                  <div className="absolute right-2 bottom-0 text-[56px] font-black font-mono text-white/[0.012] leading-none select-none tracking-tighter">
                                    {isTimer ? 'T4' : isCounter ? 'C5' : 'N7'}
                                  </div>

                                  <div className="flex justify-between items-start z-10 font-mono">
                                    <div className="flex flex-col">
                                      <span className="text-xs font-extrabold text-slate-100 tracking-wide font-sans">{n.tag}</span>
                                      <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className="text-[9px] font-mono text-[#4a93ff] bg-[#0c1220] border border-[#1b2542] px-1.5 py-0.5 rounded font-black">{addr}</span>
                                        <span className="text-[8px] font-mono text-zinc-500 font-extrabold">{n.type.toUpperCase()}</span>
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-1.5 select-none text-[8.5px] font-mono">
                                      <button
                                        onClick={() => {
                                          setPausedTrends(prev => ({ ...prev, [addr]: !prev[addr] }));
                                          addNotification(`${isPaused ? 'Resumed' : 'Paused'} tracking on ${n.tag}`, "info");
                                        }}
                                        className={cn(
                                          "px-1.5 py-0.5 rounded font-black tracking-wide border transition-all",
                                          isPaused 
                                            ? "bg-amber-600/15 border-amber-500/20 text-amber-400" 
                                            : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                                        )}
                                      >
                                        {isPaused ? 'PAUSED' : 'LIVE'}
                                      </button>
                                      <button
                                        onClick={() => {
                                          setState(prev => {
                                            const nextHistory = { ...prev.simulation.history };
                                            nextHistory[addr] = [];
                                            return {
                                              ...prev,
                                              simulation: {
                                                ...prev.simulation,
                                                history: nextHistory
                                              }
                                            }
                                          });
                                          addNotification(`Purged chart traces for ${n.tag}`, "info");
                                        }}
                                        className="px-1.5 py-0.5 bg-red-950/20 border border-red-900/10 hover:border-red-500/20 text-red-500 hover:bg-red-955/40 rounded font-black transition-all"
                                      >
                                        RESET
                                      </button>
                                    </div>
                                  </div>

                                  {/* Twice-the-size plot area (h-32) */}
                                  <div className="h-32 w-full min-w-0 bg-[#06070a]/80 border border-zinc-950 rounded-lg relative overflow-hidden flex items-end">
                                    {isPaused && (
                                      <div className="absolute inset-0 bg-[#0b0d14]/75 flex items-center justify-center z-10 border border-amber-500/10 animate-fade-in">
                                        <div className="flex flex-col items-center gap-1 text-center font-mono">
                                          <span className="text-[9.5px] text-amber-500 font-black uppercase tracking-widest select-none">HISTORIAN PAUSED</span>
                                          <span className="text-[8px] text-zinc-500 font-bold select-none">Click LIVE above to resume plotting</span>
                                        </div>
                                      </div>
                                    )}
                                    
                                    <ResponsiveContainer width="100%" height="100%">
                                      <AreaChart data={hist.slice(-40).map((v, i) => ({ v, i }))} margin={{ top: 12, right: 0, left: 0, bottom: 0 }}>
                                        <defs>
                                          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={strokeColor} stopOpacity={0.35}/>
                                            <stop offset="95%" stopColor={strokeColor} stopOpacity={0.00}/>
                                          </linearGradient>
                                        </defs>
                                        <Area type="monotone" dataKey="v" stroke={strokeColor} strokeWidth={2} fillOpacity={1} fill={`url(#${gradId})`} isAnimationActive={false} />
                                      </AreaChart>
                                    </ResponsiveContainer>
                                  </div>

                                  {/* Industrial analytical metric blocks */}
                                  <div className="grid grid-cols-4 gap-1.5 text-center font-mono text-[9px] select-none border-t border-zinc-900/60 pt-2 bg-[#08090d]/30 -mx-4 -mb-4 p-2">
                                    <div className="flex flex-col">
                                      <span className="text-zinc-500 text-[7px] font-black uppercase tracking-wider">CURRENT</span>
                                      <span className="text-slate-200 font-extrabold text-[10.5px] m-0.5 tabular-nums">{curVal}</span>
                                    </div>
                                    <div className="flex flex-col border-l border-zinc-900/60 font-mono">
                                      <span className="text-zinc-500 text-[7px] font-black uppercase tracking-wider">MAXIMUM</span>
                                      <span className="text-emerald-400 font-extrabold text-[10.5px] m-0.5 tabular-nums">{maxVal}</span>
                                    </div>
                                    <div className="flex flex-col border-l border-zinc-900/60 font-mono">
                                      <span className="text-zinc-500 text-[7px] font-black uppercase tracking-wider">MINIMUM</span>
                                      <span className="text-[#3b82f6] font-extrabold text-[10.5px] m-0.5 tabular-nums">{minVal}</span>
                                    </div>
                                    <div className="flex flex-col border-l border-zinc-900/60 font-mono">
                                      <span className="text-zinc-500 text-[7px] font-black uppercase tracking-wider">AVERAGE</span>
                                      <span className="text-purple-450 font-extrabold text-[10.5px] m-0.5 tabular-nums">{avgVal}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          {state.nodes.filter(n => n.type.startsWith('timer') || n.type.startsWith('counter') || n.address.startsWith('N7:')).length === 0 && (
                            <div className="col-span-full py-16 text-center text-zinc-650 italic select-none">
                              <div className="flex flex-col items-center gap-1 text-[11px] font-medium tracking-tight">
                                <Activity size={24} className="opacity-30 text-zinc-600 animate-pulse" />
                                <p className="font-bold text-zinc-550 uppercase">No active tracking references found</p>
                                <p className="text-[9px] text-zinc-500 mt-1">Trends track registers like Timers (T4), Counters (C5), or Integer values (N7) automatically.</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {consoleTab === "forces" && (
                      <div className="p-3">
                        <div className="p-4 flex flex-col gap-4 font-mono select-none bg-[#0a0f18]/60 border border-white/5 rounded-xl">
                          <div className="flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                              </span>
                              <span className="text-[11px] font-extrabold text-amber-500 tracking-wider uppercase">
                                Active Override Forces & Maintenance Panel
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  state.simulation.forcesEnabled
                                    ? disableAllForces()
                                    : enableForces()
                                }
                                className={cn(
                                  "px-3 py-1 font-bold rounded text-[9px] uppercase tracking-wider transition-colors border",
                                  state.simulation.forcesEnabled
                                    ? "bg-amber-500/10 border-amber-500/30 text-amber-500 hover:bg-amber-500/20"
                                    : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white"
                                )}
                              >
                                {state.simulation.forcesEnabled
                                  ? "Disable Override Kernel"
                                  : "Enable Override Kernel"}
                              </button>
                              <button
                                onClick={() => removeAllForces()}
                                className="px-3 py-1 bg-red-950/40 hover:bg-red-900/40 text-red-400 font-bold border border-red-500/25 rounded text-[9px] uppercase tracking-wider transition-colors"
                              >
                                Purge Forces
                              </button>
                            </div>
                          </div>

                          <div className="border border-white/5 bg-[#08090d]/60 rounded-lg overflow-hidden shadow-xl">
                            <table className="w-full text-left text-[11.5px] font-mono border-collapse">
                              <thead className="bg-[#05060a] text-zinc-500 sticky top-0 uppercase tracking-widest text-[8.5px] font-extrabold border-b border-white/5">
                                <tr>
                                  <th className="px-5 py-2.5">Forced Address</th>
                                  <th className="px-5 py-2.5">Symbol Designation</th>
                                  <th className="px-5 py-2.5">Force Override State</th>
                                  <th className="px-5 py-2.5 text-right">Emergency Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-zinc-900/40">
                                {Object.entries(state.simulation.forces || {}).map(([addr, val]) => {
                                  const matchingNode = state.nodes.find(n => n.address === addr);
                                  const associatedTag = matchingNode ? matchingNode.tag : 'MEM_REGISTER_COIL';
                                  const instructionType = matchingNode ? matchingNode.type : 'DAT_REG';

                                  return (
                                    <tr key={addr} className="bg-amber-500/[0.02] border-b border-zinc-900 hover:bg-amber-500/[0.04] transition-colors">
                                      {/* Forced Address */}
                                      <td className="px-5 py-3 text-amber-500 font-extrabold font-mono text-[11px] select-all">
                                        {addr}
                                      </td>

                                      {/* Tag Name & Type */}
                                      <td className="px-5 py-3">
                                        <span className="text-slate-100 font-bold tracking-wide font-sans text-[11px] block">{associatedTag}</span>
                                        <span className="text-[7.5px] text-zinc-500 uppercase tracking-wider mt-0.5 block">{instructionType}</span>
                                      </td>

                                      {/* Value Toggle Indicator */}
                                      <td className="px-5 py-3 select-none">
                                        <div className="flex items-center gap-2">
                                          <button
                                            onClick={() => handleForceIO(addr, !val)}
                                            className={cn(
                                              "px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-wider transition-all select-none border",
                                              val
                                                ? "bg-amber-500 text-black border-amber-400 hover:bg-amber-400"
                                                : "bg-[#0c0f16] text-amber-500 border-amber-500/20 hover:bg-amber-500/10"
                                            )}
                                            title="Click to toggle forced state"
                                          >
                                            {val ? 'FORCE ON' : 'FORCE OFF'}
                                          </button>
                                          <span className="text-[8px] text-zinc-550">(Click to Toggle)</span>
                                        </div>
                                      </td>

                                      {/* Action Buttons */}
                                      <td className="px-5 py-3 text-right">
                                        <button
                                          onClick={() => handleForceIO(addr, undefined)}
                                          className="text-red-450 hover:text-white bg-red-950/20 border border-red-500/20 hover:bg-red-900/40 px-3 py-1 rounded-full font-black text-[9px] uppercase tracking-wider transition-colors"
                                        >
                                          REMOVE FORCE
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                                {Object.keys(state.simulation.forces || {}).length === 0 && (
                                  <tr>
                                    <td colSpan={4} className="px-5 py-12 text-center text-zinc-550 italic text-[11px] select-none">
                                      <div className="flex flex-col items-center gap-1.5">
                                        <span className="text-zinc-600 opacity-40">⚠</span>
                                        <p className="font-extrabold uppercase text-zinc-600">No Register Overrides Active</p>
                                        <p className="text-[9.5px]">Forced registers override logical rungs for hardware testing and simulation overrides.</p>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}

                    {consoleTab === "cross" && (
                      <div className="p-3.5 flex flex-col h-full bg-[#0a0b0e]">
                        <div className="max-w-3xl mx-auto w-full space-y-4 flex flex-col h-full select-none">
                          <div className="relative shrink-0">
                            <Search
                              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-550 animate-pulse"
                              size={13}
                              strokeWidth={2.5}
                            />
                            <input
                              type="text"
                              placeholder="Type hardware address (e.g. I:0/1), tag symbol, or instruction type..."
                              className="w-full bg-[#07080b] border border-white/5 rounded-lg py-2.5 pl-9 pr-4 text-xs text-white focus:ring-1 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all placeholder:text-zinc-550 font-mono"
                              autoFocus
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                            />
                          </div>

                          <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar pb-4">
                            {state.nodes
                              .filter((n) => {
                                if (!searchQuery) return true;
                                const query = searchQuery.toLowerCase();
                                return (
                                  n.address.toLowerCase().includes(query) ||
                                  n.tag.toLowerCase().includes(query) ||
                                  n.type.toLowerCase().includes(query)
                                );
                              })
                              .map((n) => {
                                // Scans programmatic elements for reads vs writes
                                const references = state.nodes.filter(
                                  (otherNode) =>
                                    otherNode.address === n.address &&
                                    otherNode.id !== n.id,
                                );
                                const reads = references.filter(
                                  (otherNode) =>
                                    otherNode.type.startsWith("contact") ||
                                    otherNode.type === "one-shot",
                                );
                                const writes = references.filter(
                                  (otherNode) =>
                                    otherNode.type === "coil" ||
                                    otherNode.type === "coil-latch" ||
                                    otherNode.type === "coil-unlatch" ||
                                    otherNode.type.startsWith("math"),
                                );

                                return (
                                  <div
                                    key={n.id}
                                    onClick={() => {
                                      setSelectedId(n.id);
                                      setViewport((v) => ({
                                        ...v,
                                        x: -n.x + 300,
                                        y: -n.y + 200,
                                      }));
                                    }}
                                    className="p-3.5 bg-[#0d0e15]/75 border border-[#1d2232] rounded-xl hover:border-sky-500/50 cursor-pointer flex items-center justify-between group transition-all hover:bg-white/[0.01]"
                                  >
                                    <div className="flex items-center gap-4">
                                      <div className="p-2.5 rounded-lg bg-[#0e1627] border border-[#1b2a47] shrink-0 text-sky-450 group-hover:bg-[#112a53] transition-colors select-none">
                                        <Database size={15} />
                                      </div>
                                      <div className="flex flex-col">
                                        <div className="text-sky-400 font-extrabold text-xs font-mono select-all flex items-center gap-1.5">
                                          {n.address}
                                          <span className="text-[7.5px] font-bold text-zinc-500 bg-zinc-900 border border-white/5 px-1 py-0.2 rounded font-mono select-none uppercase tracking-wide">
                                            {n.type}
                                          </span>
                                        </div>
                                        <div className="text-slate-100 font-semibold text-[11px] tracking-wide mt-0.5">
                                          {n.tag}
                                        </div>

                                        {references.length > 0 ? (
                                          <div className="flex flex-wrap gap-2 mt-2 select-none text-[8.5px] font-mono">
                                            {writes.length > 0 && (
                                              <span className="text-purple-400 bg-purple-950/25 px-1.5 py-0.5 rounded border border-purple-500/15 font-bold">
                                                Written in Rung(s):{" "}
                                                {writes
                                                  .map(
                                                    (w) =>
                                                      Math.floor(w.y / 150) + 1,
                                                  )
                                                  .join(", ")}
                                              </span>
                                            )}
                                            {reads.length > 0 && (
                                              <span className="text-emerald-400 bg-emerald-950/25 px-1.5 py-0.5 rounded border border-emerald-500/15 font-bold">
                                                Referenced on Contact(s):{" "}
                                                {reads
                                                  .map(
                                                    (r) =>
                                                      Math.floor(r.y / 150) + 1,
                                                  )
                                                  .join(", ")}
                                              </span>
                                            )}
                                          </div>
                                        ) : (
                                          <div className="text-[8px] font-mono text-zinc-500 select-none mt-1">
                                            No secondary register reference links inside program memory.
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 select-none">
                                      <div className="text-[9px] font-extrabold text-zinc-400 uppercase bg-[#07090e] px-2 py-0.5 rounded border border-white/5 font-mono group-hover:text-white transition-colors">
                                        RUNG {Math.floor(n.y / 150) + 1}
                                      </div>
                                      <ChevronRight
                                        size={14}
                                        className="text-zinc-500 group-hover:text-sky-400 transition-colors group-hover:translate-x-0.5"
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            {state.nodes.length === 0 && (
                              <div className="text-center py-12 text-zinc-700 italic text-xs select-none">
                                No project tags available for program scanning.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {consoleTab === "logs" && (
                      <div className="p-2 h-full overflow-auto custom-scrollbar">
                        <div className="space-y-1">
                          {(state.simulation.logs || []).map((log) => (
                            <div
                              key={log.id}
                              className="flex items-center gap-4 px-4 py-1.5 bg-black/20 border-l-2 border-transparent hover:border-blue-500 transition-all font-mono text-[10px]"
                            >
                              <span className="text-zinc-600 shrink-0">
                                {new Date(log.timestamp).toLocaleTimeString()}
                              </span>
                              <span
                                className={cn(
                                  "px-1.5 py-0.5 rounded text-[8px] font-black uppercase shrink-0",
                                  log.type === "error"
                                    ? "bg-red-500 text-white"
                                    : log.type === "warning"
                                      ? "bg-amber-500 text-black"
                                      : "bg-blue-500/20 text-blue-400",
                                )}
                              >
                                {log.type}
                              </span>
                              <span className="text-zinc-400">
                                {log.message}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {isPropertyOpen && (
            <div className="flex shrink-0">
              {/* Resizer Handle Right */}
              <div
                onMouseDown={() => startResizing("inspector")}
                className="w-1 h-full bg-black/5 hover:bg-blue-400 cursor-col-resize transition-colors flex items-center justify-center group z-10"
              >
                <div className="w-[1px] h-8 bg-black/10 group-hover:bg-blue-400 opacity-50" />
              </div>

              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: inspectorWidth, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ type: "tween", duration: 0 }}
                className="bg-[#12141a] border-l border-white/10 flex flex-col overflow-hidden"
              >
                <PropertyInspector
                  selectedNode={
                    state.nodes.find((n) => n.id === selectedId) || null
                  }
                  values={state.simulation.values}
                  history={state.simulation.history || {}}
                  onUpdate={updateNode}
                  onDelete={deleteNode}
                  onForceIO={handleForceIO}
                  onJumpToNode={jumpToNode}
                  forces={state.simulation.forces || {}}
                  nodes={state.nodes}
                />
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Final System Footer */}
      <footer className="h-12 md:h-8 bg-[#090b0e] border-t border-white/10 flex flex-col md:flex-row items-center justify-between px-6 py-2 md:py-0 text-[10px] font-mono text-zinc-500 shrink-0 select-none gap-1.5 md:gap-0">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_8px_#0087ff]" />
            <span className="tracking-tight">Station: LAB_CONTROL_RACK_01</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                state.simulation.isRunning
                  ? "bg-emerald-500 shadow-[0_0_8px_#10b981]"
                  : "bg-zinc-800",
              )}
            />
            <span className="tracking-tight">
              PLC_LINK:{" "}
              <span
                className={
                  state.simulation.isRunning
                    ? "text-emerald-400 font-bold drop-shadow-[0_0_6px_rgba(16,185,129,0.35)]"
                    : ""
                }
              >
                {state.simulation.isRunning ? "ONLINE_RUN" : "OFFLINE"}
              </span>
            </span>
          </div>
        </div>

        {/* Developer Attribution and Links */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 text-[9px] text-zinc-500 font-sans tracking-wide">
          <span>Developed by</span>
          <span className="text-zinc-400 font-semibold select-all">
            Siyabonga B Phakathi of The Voice & Eye of Bhambatha Inc.
          </span>
          <span className="text-zinc-800 select-none">|</span>
          <a
            href="https://websim.creation/@whisperinggalaxyd"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-500 hover:text-cyan-400 font-medium transition-colors hover:underline"
          >
            @whisperinggalaxyd
          </a>
          <span className="text-zinc-800 select-none">|</span>
          <a
            href="https://www.facebook.com/@C.Datoxic.P"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-400 font-medium transition-colors hover:underline"
          >
            Facebook
          </a>
        </div>

        <div className="flex items-center gap-6">
          <span className="opacity-50 font-mono text-[9px]">v5.0.21-LTS</span>
          <span className="font-mono tracking-tighter tabular-nums text-[9.5px]">
            {new Date().toLocaleTimeString()}
          </span>
        </div>
      </footer>

      {/* Common Overlays */}
      <AnimatePresence>
        {isCommunicating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-lg flex items-center justify-center"
          >
            <div className="text-center space-y-4">
              <div className="inline-block p-4 bg-blue-600/20 rounded-full animate-bounce">
                <Zap size={48} className="text-blue-500" />
              </div>
              <h2 className="text-2xl font-black text-white tracking-[0.4em] uppercase">
                Synchronizing Controller
              </h2>
              <div className="w-64 h-1 bg-zinc-800 rounded-full overflow-hidden mx-auto">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2 }}
                  className="h-full bg-blue-500"
                />
              </div>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                Applying station routine to virtual L32E kernel...
              </p>
            </div>
          </motion.div>
        )}

        {showWhoActive && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowWhoActive(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 shadow-2xl rounded-lg overflow-hidden flex flex-col h-[500px]"
            >
              <div className="bg-black p-3 flex justify-between items-center text-white">
                <span className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                  <Cpu size={16} className="text-blue-400" />
                  Who Active - Controller Discovery
                </span>
                <button
                  onClick={() => setShowWhoActive(false)}
                  className="hover:bg-zinc-700 p-1 rounded-sm"
                >
                  <Square size={12} className="rotate-45" />
                </button>
              </div>

              <div className="flex-1 flex overflow-hidden">
                <div className="w-1/3 border-r border-zinc-800 bg-black/20 p-4 space-y-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">
                      <ChevronRight size={10} /> Workstation
                    </div>
                    <div className="ml-4 space-y-1">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-blue-600">
                        <ChevronRight size={10} className="rotate-90" /> PLC
                        Gateways
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex-1 p-4 overflow-y-auto">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4">
                    Discovered Devices on Local Network
                  </h4>
                  <div className="space-y-2">
                    {[
                      {
                        name: "AIS_PLC_01",
                        ip: "192.168.1.10",
                        type: "ControlLogix 5580",
                        status: "Online",
                      },
                      {
                        name: "PACK_SIM_04",
                        ip: "192.168.1.15",
                        type: "CompactLogix 5370",
                        status: "Online",
                      },
                      {
                        name: "LAB_TEST_RACK",
                        ip: "192.168.1.42",
                        type: "ControlLogix 5570",
                        status: "Busy",
                      },
                    ].map((device) => (
                      <div
                        key={device.ip}
                        className="p-3 bg-black/40 border border-zinc-800 rounded-xl hover:border-blue-500 hover:bg-blue-600/10 cursor-pointer transition-all group"
                        onClick={() => {
                          addNotification(
                            `Connected to ${device.name}`,
                            "success",
                          );
                          setShowWhoActive(false);
                        }}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-xs font-bold text-white">
                            {device.name}
                          </span>
                          <span
                            className={cn(
                              "text-[8px] font-black px-2 py-0.5 rounded-full uppercase",
                              device.status === "Online"
                                ? "bg-green-500/20 text-green-500"
                                : "bg-amber-500/20 text-amber-500",
                            )}
                          >
                            {device.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-zinc-500">
                            {device.ip}
                          </span>
                          <span className="text-[9px] text-zinc-600">
                            SLOT 0{device.ip.slice(-1)}
                          </span>
                        </div>
                        <div className="mt-2 text-[9px] text-zinc-500 font-medium">
                          Model: {device.type}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-12 right-6 z-[200] flex flex-col-reverse gap-2">
        <AnimatePresence>
          {notifications.map((n) => (
            <motion.div
              key={n.id}
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              className={cn(
                "px-4 py-2 rounded-lg shadow-xl text-xs font-bold border flex items-center gap-3",
                n.type === "success"
                  ? "bg-green-600 border-green-500 text-white shadow-green-500/20"
                  : n.type === "error"
                    ? "bg-red-600 border-red-500 text-white shadow-red-500/20"
                    : "bg-zinc-800 border-zinc-700 text-zinc-300 shadow-black/50",
              )}
            >
              <div
                className={cn(
                  "w-2 h-2 rounded-full animate-pulse",
                  n.type === "success"
                    ? "bg-green-300"
                    : n.type === "error"
                      ? "bg-red-300"
                      : "bg-blue-400",
                )}
              />
              {n.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* SEARCH COMMAND PALETTE */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-start justify-center pt-[15vh] p-4"
            onClick={() => setIsSearchOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: -20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: -20 }}
              className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-zinc-800 flex items-center gap-3">
                <Search size={18} className="text-zinc-500" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search tags, addresses, or instructions... (Esc to close)"
                  className="bg-transparent border-none outline-none text-zinc-100 flex-1 text-sm font-medium"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setIsSearchOpen(false);
                    if (e.key === "Enter" && filteredNodes.length > 0)
                      jumpToNode(filteredNodes[0].id);
                  }}
                />
              </div>
              <div className="max-h-[60vh] overflow-y-auto p-2 custom-scrollbar">
                {filteredNodes.map((node) => (
                  <button
                    key={node.id}
                    onClick={() => jumpToNode(node.id)}
                    className="w-full flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-colors group text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[10px] font-black text-blue-400 uppercase">
                        {node.type.slice(0, 3)}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-zinc-200">
                          {node.address}
                        </div>
                        <div className="text-[10px] text-zinc-500 font-mono italic">
                          {node.tag || "No tag assigned"}
                        </div>
                      </div>
                    </div>
                    <div className="text-[10px] text-zinc-600 font-black uppercase tracking-widest group-hover:text-blue-400">
                      Rung {Math.floor(node.y / 150)}
                    </div>
                  </button>
                ))}
                {searchQuery && filteredNodes.length === 0 && (
                  <div className="p-8 text-center text-zinc-600 text-sm">
                    No results found for "{searchQuery}"
                  </div>
                )}
                {!searchQuery && (
                  <div className="p-8 text-center text-zinc-600">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] mb-2">
                      Search Logic Kernel
                    </div>
                    <div className="text-[9px] opacity-40">
                      Search for physical I/O map or symbolic primitives
                    </div>
                  </div>
                )}
              </div>
              <div className="p-3 bg-black/40 border-t border-zinc-800 flex items-center justify-between text-[9px] text-zinc-500 font-black uppercase tracking-widest px-6">
                <div className="flex gap-4">
                  <span>
                    <span className="text-zinc-700">↵</span> Select
                  </span>
                  <span>
                    <span className="text-zinc-700">↑↓</span> Navigate
                  </span>
                </div>
                <span>Cmd+K</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImport}
        className="hidden"
        accept=".vlp"
      />
    </div>
  );
}

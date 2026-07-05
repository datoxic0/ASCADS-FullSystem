import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import "./index.css";

import { UNIFIED_REGISTRY } from "./lib/unified-components";
import { solveDC, buildNetlist } from "./lib/analog-sim-engine";

// Expose Central Component Library to global scope for Engigraph (vanilla JS)
(window as any).ASCADComponentLibrary = UNIFIED_REGISTRY;

// Expose SPICE Engine to global scope for Engigraph
(window as any).ASCADSpiceEngine = { solveDC, buildNetlist };

createRoot(document.getElementById("root")!).render(<App />);


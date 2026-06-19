# ASCADS: The Architect’s Blueprint
**Advanced EDA Suite (ASCADS)**

> "To make the unseen tangible, and the complex effortlessly logical."

## 1. The Vision: What is ASCADS?

Imagine a digital sandbox where the fundamental laws of physics, mathematics, and logic bend to your will. **ASCADS** is not merely a software application—it is a **unified engineering ecosystem**. It is designed so that whether you are designing microscopic digital logic gates, orchestrating massive industrial programmable logic controllers (PLCs), simulating advanced robotic kinematics, or drawing precise engineering schematics, you never have to leave the environment. 

Even if you have never seen a circuit before, ASCADS visualizes the invisible. It turns abstract math into glowing lines of force, binary logic into pulsing signals, and rigid code into fluid, drag-and-drop schematics. It is the ultimate translation layer between human intent and machine execution.

### The Core Realms
1. **Digital Logic Lab**: Build, simulate, and debug complex digital circuits with sub-millisecond precision.
2. **Analog Schematic Editor**: A sprawling canvas for high-fidelity component routing, offering both legacy flow engines and an advanced engine for deep physical modeling.
3. **Industrial PLC (VoltLogicPRO)**: IEC 61131-3 standard ladder logic simulation bridging software with real-world industrial control.
4. **Robotics Workspace**: Solve complex inverse kinematics and plan motion for automated systems.
5. **Maths System (Beyond CAS)**: A scientific computation engine designed for symbolic and numerical mastery.
6. **EngiGraph Pro (Hybrid Code CAD)**: A dual-engine professional visual engineering suite featuring both 2D legacy architectural drafting and a modern, OpenSCAD-style 3D Constructive Solid Geometry (CSG) compiler for robotics and 3D printing.
7. **Genesis AI Hub**: An omnipresent, context-aware artificial intelligence assistant powered by Gemini (Power Mode) or OpenRouter (Economy Mode), capable of inspecting schematics, optimizing logic, and generating code templates.

---

## 2. System Architecture: How It Works

ASCADS operates as a monolithic frontend ecosystem compiled via Vite. The architecture relies on an intelligent separation of concerns:

- **State Management Layer (Zustand)**: Fast, decentralized state stores manage millions of updates per second, handling dragging events, node changes, and real-time simulation ticks without causing unnecessary React re-renders.
- **Rendering Engines**:
  - **Canvas/Konva**: Utilized for ultra-high-performance 2D rendering of circuits and robots, capable of rendering thousands of nodes seamlessly.
  - **React Flow**: Drives node-based connections and structured workflows in the analog editor.
- **Component & Style Layer**: Built on **React 19**, **Tailwind CSS v4**, and **Radix UI**, ensuring an accessible, highly customizable, and dark-mode-first aesthetic (glassmorphism, micro-animations, rich gradients).
- **3D Physics & Geometry**: Powered by `Three.js`, `@react-three/fiber`, and `three-csg-ts`. Transforms raw mathematical functions into fully rendered WebGL CSG solid models instantly.
- **Simulation Layer**: A custom tick-based logic and analog engine running in parallel with the main thread, continuously evaluating graphs to update visual state instantly.
- **AI Integration**: Dual-engine integration supporting direct HTTP calls to large language models, feeding them live context about the user's active schematic or workspace.

---

## 3. Environment & Initialization

To unleash ASCADS on any compatible machine, you must prepare the environment for extensive upgrades and logic perfection.

### Prerequisites
- **Node.js**: `v20.x` or higher (LTS recommended)
- **NPM**: `v10.x` or higher
- **Git**: For version control

### Bootstrapping on a New Machine

1. **Clone the Repository**
   ```bash
   git clone <your-repo-url>
   cd Advanced-Schematic-Design-FullSystem-main/artifacts/logic-lab
   ```

2. **Install Dependencies**
   Perform a clean installation to guarantee maximum logic perfection:
   ```bash
   npm install
   ```

3. **Environment Variables**
   Create a `.env` file in the root `logic-lab` directory if you intend to customize the hosting or AI services:
   ```env
   # AI Configuration (Optional but recommended)
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   VITE_OPENROUTER_API_KEY=your_openrouter_api_key_here
   
   # Server Configuration
   PORT=5173
   BASE_PATH=/
   ```

---

## 4. Operational Commands

ASCADS comes equipped with an optimized build and execution pipeline. From the terminal in the `logic-lab` directory, the following commands command the system:

| Command | Action | Description |
| :--- | :--- | :--- |
| `npm run dev` | **Start Dev Server** | Ignites the Vite development server on `0.0.0.0`, allowing access across your local network with HMR (Hot Module Replacement) enabled. |
| `npm run build` | **Production Compilation** | Compresses, minifies, and bundles the entire ecosystem into the `dist/public` folder. Prepares service workers for offline-first (PWA) capability. |
| `npm run serve` | **Preview Production** | Spawns a local web server to test the highly optimized production build locally before deployment. |
| `npm run typecheck` | **Logic Validation** | Invokes the TypeScript Compiler (`tsc`) in strict mode without emitting files. This ensures logic perfection and catches type anomalies before runtime. |

---

## 5. Extensive Upgrades & Code Quality Standards

The environment is now primed for expansion. When contributing or modifying the core systems, engineers must adhere strictly to these dogmas:

1. **Zero-Stutter Principle**: Any logic added to the simulation loops must complete in `<16ms` to maintain 60FPS. Offload heavy math (e.g., Robot Kinematics, SPICE sims) to Web Workers if complexity increases.
2. **Immutable State Transitions**: When updating global context in Zustand or React hooks, never mutate state directly. Always return fresh objects to prevent subtle visual bugs.
3. **Bridge Protocols**: When writing new "Bridges" (e.g., Analog to Digital), ensure they utilize the global bus standard established in `useBridgeStatus()`, utilizing `localStorage` or robust cross-tab communication.
4. **Absolute Aesthetics**: No generic UIs. Every component must utilize the established design language—deep slates, vibrant neon accents (indigo, emerald, cyan), and responsive hover states. 

Welcome to ASCADS. Let the build begin.


<footer class="footer">
  <p>
    Developed by Siyabonga B Phakathi of The Voice & Eye of Bhambatha Inc.
    <br>
    <a href="https://www.bhambathablog.wordpress.com" target="_blank" rel="noopener noreferrer">Blog</a> |
    <a href="https://www.facebook.com/C.Datoxic.P" target="_blank" rel="noopener noreferrer">Facebook</a> |
    <a href="https://www.websim.com/@whisperinggalaxyd" target="_blank" rel="noopener noreferrer">WebSim</a> |
    <a href="https://www.github.com/datoxic0" target="_blank" rel="noopener noreferrer">GitHub</a> |
    <a href="https://discord.com/channels/datoxic0" target="_blank" rel="noopener noreferrer">Discord</a> |
    <a href="https://x.com/Siya_B_Phakathi" target="_blank" rel="noopener noreferrer">X</a>
  </p>
</footer>
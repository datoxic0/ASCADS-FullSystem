# ASCADS: The Architect’s Blueprint
**Advanced EDA Suite (ASCADS)**

> "To make the unseen tangible, and the complex effortlessly logical."

## 1. The Vision: What is ASCADS?

Imagine a digital sandbox where the fundamental laws of physics, mathematics, and logic bend to your will. **ASCADS** is not merely a software application—it is a **unified engineering ecosystem**. It is designed so that whether you are designing microscopic digital logic gates, orchestrating massive industrial programmable logic controllers (PLCs), simulating advanced robotic kinematics, or drawing precise engineering schematics, you never have to leave the environment. 

Even if you have never seen a circuit before, ASCADS visualizes the invisible. It turns abstract math into glowing lines of force, binary logic into pulsing signals, and rigid code into fluid, drag-and-drop schematics. It is the ultimate translation layer between human intent and machine execution.

> [!TIP]
> **ASCADS** is currently in an active evolution phase. New modules for 3D AI Vision and Dynamic CSG Modeling have recently come online.

### The Core Realms
1. **Digital Logic Lab**: Build, simulate, and debug complex digital circuits with sub-millisecond precision. Now featuring premium glassmorphism interfaces and seamless PLC bridging.
2. **Analog Schematic Editor**: A sprawling canvas for high-fidelity component routing, offering both legacy flow engines and an advanced engine for deep physical modeling.
3. **Industrial PLC (VoltLogicPRO)**: IEC 61131-3 standard ladder logic simulation bridging software with real-world industrial control.
4. **Robotics Workspace**: Solve complex inverse kinematics and plan motion for automated systems across **Industrial, Corporate, and Domestic** environments.
5. **Context-Aware Vision Sandbox**: Newly minted module allowing robots to autonomously map and navigate their environment using raycasted LiDAR, recognizing objects uniquely based on their category (e.g., Sofas vs. Pallets).
6. **Maths System (Beyond CAS)**: A scientific computation engine designed for symbolic and numerical mastery.
7. **EngiGraph Pro (Hybrid Code CAD)**: A dual-engine professional visual engineering suite featuring both 2D legacy architectural drafting and a modern, OpenSCAD-style 3D Constructive Solid Geometry (CSG) compiler for robotics and 3D printing.
8. **Genesis AI Hub**: An omnipresent, context-aware artificial intelligence assistant powered by Gemini (Power Mode) or OpenRouter (Economy Mode), capable of inspecting schematics, optimizing logic, and generating code templates.

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

> [!IMPORTANT]
> The environment is now primed for expansion. When contributing or modifying the core systems, engineers must adhere strictly to these dogmas:

1. **Zero-Stutter Principle**: Any logic added to the simulation loops must complete in `<16ms` to maintain 60FPS. Offload heavy math (e.g., Robot Kinematics, SPICE sims) to Web Workers if complexity increases.
2. **Immutable State Transitions**: When updating global context in Zustand or React hooks, never mutate state directly. Always return fresh objects to prevent subtle visual bugs.
3. **Bridge Protocols**: When writing new "Bridges" (e.g., Analog to Digital), ensure they utilize the global bus standard established in `useBridgeStatus()`, utilizing `localStorage` or robust cross-tab communication.
4. **Absolute Aesthetics**: No generic UIs. Every component must utilize the established design language—deep slates, vibrant neon accents (indigo, emerald, cyan), and responsive hover states. 
5. **Context-Aware Consistency**: System models (such as Robot Designers or 2D Digital Twins) must strictly respect their environment category (Domestic, Corporate, Industrial). An industrial conveyor should never render in a domestic living room.

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

---

# ASCADS Scientific Engine (Beyond CAS)

The **Scientific Engine** is an advanced mathematical and computational analysis workspace built directly into the ASCADS EDA Suite. It goes beyond simple Computer Algebra Systems (CAS) to provide plotting, symbolic derivation, digital signal processing (DSP), and Control Systems analysis.

This tutorial covers the primary modes and syntax required to utilize the engine effectively.

---

## 1. Cartesian 2D Plotting
The 2D mode allows you to plot standard `y = f(x)` functions, implicit relations, and compute symbolic derivatives.

**Examples:**
- **Standard Function:** `f(x) = sin(a * x)`
- **Algebraic Analysis:** `3x^2 + 5x - 2` *(The engine will symbolically parse this, render LaTeX, and calculate the derivative `d/dx = 6x + 5`)*
- **Variables:** `a = 5` *(Sets a global variable 'a' that can be used in subsequent blocks)*

## 2. Parametric Curves
Parametric mode evaluates equations based on a shared time variable `t`. Your expression should return a coordinate pair `x(t), y(t)`.

**Examples:**
- **Lissajous Curve:** `x = sin(3*t), y = sin(4*t)`
- **Circle:** `x = cos(t), y = sin(t)`

## 3. Polar Coordinates
Polar mode evaluates equations in terms of radius `r` and angle `t` (theta).

**Examples:**
- **Archimedean Spiral:** `r = 0.5 * t`
- **Rose Curve:** `r = sin(4 * t)`

## 4. Surface 3D
Evaluate functions in 3D space using variables `x` and `y` to define the Z-axis height.

**Examples:**
- **Ripple Effect:** `z = sin(sqrt(x^2 + y^2))`
- **Saddle Plot:** `z = x^2 - y^2`

## 5. Vector Fields (2D)
Vector Fields are used for fluid dynamics, electromagnetics, and gradient plotting. You must provide the `u` (x-magnitude) and `v` (y-magnitude) vector components separated by a comma.

**Examples:**
- **Rotational Field:** `-y, x`
- **Gradient Field:** `2*x, 2*y`

## 6. Linear Algebra (Matrix Mode)
Perform matrix operations symbolically and numerically. Matrices are defined using standard bracket notation: `[row1; row2; row3]`.

**Examples:**
- **Define Matrices:**
  - `A = [1, 2; 3, 4]`
  - `B = [0, 1; -1, 0]`
- **Operations:**
  - `A * B` (Matrix Multiplication)
  - `det(A)` (Determinant)
  - `inv(A)` (Inverse)
  - `cross([1,0,0], [0,1,0])` (Cross Product)

## 7. DSP / Telemetry
The Telemetry module allows you to import real-world data (via `.csv` upload) and perform advanced signal analysis.

**Features:**
- **CSV Import:** Upload a CSV. The system auto-detects numerical columns for the X (Domain) and Y (Signal) axes.
- **FFT Spectrum:** Toggle the "Compute FFT Spectrum" to perform a Fast Fourier Transform and analyze the frequency domain of your signal based on a specified sampling rate (Fs).
- **Linear Regression:** Toggle "Linear Regression Fit" to plot a line of best fit over scattered telemetry data and calculate the `R²` correlation value.

## 8. Control Systems (Bode Plots)
Analyze continuous-time transfer functions in the frequency domain. Define your transfer function using the Laplace variable `s`.

**Examples:**
- **Low Pass Filter:** `10 / (s + 5)`
- **Second Order System:** `100 / (s^2 + 10*s + 100)`

The engine will automatically generate both the Magnitude (`dB`) and Phase (`degrees`) Bode plots on a logarithmic frequency axis.

---

## 9. Robotics Kinematics Calculator
The Kinematics engine allows for rapid computation of robotic joint transformations and inverse mathematics.

**Built-In Functions:**
- `dh(theta, d, a, alpha)`: Generates a 4x4 Denavit-Hartenberg transformation matrix (angles in degrees).
- `fk(M1, M2, M3...)`: Computes the Forward Kinematics by multiplying an array of sequential transformation matrices.
- `ik2(x, y, L1, L2)`: Computes the 2D Inverse Kinematics for a 2-link planar arm, returning the two joint angles `[theta1, theta2]` in degrees.

## 10. Energy & Power Dynamics Calculator
Quickly analyze power requirements across electrical and mechanical mechatronics systems.

**Built-In Functions:**
- `elec_power(v, i, pf)`: Calculates single-phase AC power in Watts. (Default Power Factor `pf = 1`).
- `elec_3phase(v, i, pf)`: Calculates 3-phase AC power in Watts.
- `mech_power(torque, rpm)`: Calculates mechanical shaft power in Watts.
- `kinetic_e(m, v)`: Calculates Kinetic Energy in Joules (m in kg, v in m/s).
- `potential_e(m, h)`: Calculates Potential Energy in Joules.

## 11. Fluid Power & Pneumatics Calculator
Calculate hydraulic and pneumatic system parameters for actuating heavy machinery.

**Built-In Functions:**
- `fluid_power(pressure_bar, flow_Lmin)`: Calculates fluid power in kilowatts (kW).
- `cylinder_force(pressure_bar, diameter_mm)`: Calculates the extension force of a pneumatic cylinder in Newtons.
- `flow_vel(flow_Lmin, diameter_mm)`: Calculates the velocity of fluid flowing through a pipe in meters per second (m/s).

---

# Compute Tools & Utilities Manual

The **Compute Tools** section in ASCADS provides a suite of advanced calculators and converters for digital logic, number formatting, and electrotechnology. It is designed to assist engineers with rapid mathematical verification without needing to leave the environment.

## 1. Contextual Info Blocks
Across the entire suite of Compute Tools, the interface features **Dynamic Info Blocks**. If you haven't provided enough inputs, or if the inputs are invalid/empty, a rich overlay appears explaining what is required. 
This ensures you are never left staring at empty screens or raw NaN values.

## 2. Electrotechnology Suite
The **Electrotechnology** tab is dedicated to analog circuit math and RF analysis.

### RLC / Impedance Calculator
Provides rapid calculations for:
- **Inductive Reactance (XL)**
- **Capacitive Reactance (XC)**
- **Total Impedance (Z)**
- **Phase Angle (θ)**
- **Resonance Frequency (f0)**

Simply input the Resistor (Ω), Inductor (mH), Capacitor (µF), and frequency (Hz).

### Ohm's Law & Power
A reactive calculator that deduces the missing values based on any **two** known variables out of Voltage (V), Current (I), Resistance (R), and Power (P). 

### Component Parameters
Calculate fundamental properties for physical components:
- **Resistivity (ρ):** Determine resistance based on material resistivity, length, and cross-sectional area.
- **Equivalent Resistors & Capacitors:** Quickly compute equivalent values for series and parallel configurations.

### Ideal Transformer
Enter any three values from Primary Voltage, Secondary Voltage, Primary Turns, and Secondary Turns to instantly solve for the fourth and determine the Turns Ratio.

### 3-Phase Power Analyzer
Analyze balanced 3-phase systems. Input Line-to-Line Voltage, Line Current, and Power Factor to compute:
- Apparent Power (S) in kVA
- Real Power (P) in kW
- Reactive Power (Q) in kVAR

## 3. Advanced Maths Module
The **Advanced Maths** section provides specialized calculators for complex engineering mathematics. Note: This module features split-panel **Dynamic Info Blocks** that guide you when inputs are empty or invalid.

### Complex Numbers
Perform arithmetic operations (Add, Subtract, Multiply, Divide) on complex numbers defined in rectangular form `a + bi`. Converts results directly into polar form `r∠θ` for AC circuit analysis.

### Matrix Algebra
A 2x2 matrix operations suite. Input matrices A and B to rapidly compute:
- Addition and Subtraction
- Matrix Multiplication (A × B)
- Determinants and Inverses of both matrices

### Fourier Series
Compute the coefficients ( $a_0$, $a_n$, $b_n$ ) for the Fourier series representation of standard periodic waveforms. Supported wave types include Square, Triangle, and Sawtooth waves with configurable amplitude and frequency.

### Vector Geometry
Analyze 3D vectors. Input components for Vector A and Vector B to determine:
- Vector Addition and Subtraction
- Dot Product and Cross Product
- The Angle between the two vectors (in degrees)

## 4. Digital Logic & Formats
- **Boolean Logic**: Synthesizes minimized K-maps, SOP, and POS expressions instantly from a 3-variable truth table.
- **Number Formats**: Provides IEEE 754 float visualizations, Gray code conversion, BCD/Excess-3 formats, and Hamming (7,4) error detection and correction.
- **Base Converter**: Seamlessly converts between Decimal, Binary, Octal, Hexadecimal, and supports fast bitwise toggling.

*End of Compute Tools Documentation*

---

# ASCADS Engigraph Pro: 3D Code CAD Manual

Welcome to the **Engigraph 3D Code CAD** environment. Engigraph Pro allows you to build complex, 3D-printable robotics and mechanical parts using purely parametric JavaScript code. It utilizes a Constructive Solid Geometry (CSG) engine powered by `three-csg-ts`.

---

## 1. The CSG API

The engine exposes several global functions you can use in your scripts to generate geometry.

### Primitive Shapes
- **`box(w, d, h)`**: Creates a rectangular prism. (width, depth, height)
- **`cylinder(r, h)`**: Creates a cylinder. Oriented along the Z-axis by default.
- **`sphere(r)`**: Creates a sphere with radius `r`.

### Boolean Operations
CSG allows you to combine solid shapes to create complex models.
- **`union(a, b)`**: Fuses two shapes together into a single solid.
- **`subtract(a, b)`**: Cuts shape `b` out of shape `a`. (Essential for making screw holes).
- **`intersect(a, b)`**: Returns only the overlapping volume between `a` and `b`.

### Transformations
- **`translate(obj, x, y, z)`**: Moves an object in 3D space.
- **`rotate(obj, rx, ry, rz)`**: Rotates an object (angles are in radians).
- **`scale(obj, sx, sy, sz)`**: Scales an object uniformly or non-uniformly.
- **`mirror(obj, x, y, z)`**: Mirrors an object across the specified axes.

---

## 2. Tutorials & Code Samples

Below are reference tutorials to help you understand how to design robotics parts using Engigraph 3D.

### Tutorial 1: Basic Bracket with Holes
A standard mounting bracket. We create a large base box, and then `subtract` four corner screw holes and one large center bore.

```javascript
// Basic Bracket
const base = box(100, 100, 10);

// Create corner holes
const h1 = translate(cylinder(5, 30), 30, 30, 0);
const h2 = translate(cylinder(5, 30), -30, 30, 0);
const h3 = translate(cylinder(5, 30), 30, -30, 0);
const h4 = translate(cylinder(5, 30), -30, -30, 0);

// Create large center bore
const centerHole = cylinder(20, 30);

// Group all holes together into one solid object using union
const holes = union(union(h1, h2), union(h3, h4));
const allHoles = union(holes, centerHole);

// Subtract the grouped holes from the base and return the final mesh
return subtract(base, allHoles);
```

### Tutorial 2: NEMA 17 Stepper Motor Faceplate
NEMA 17 stepper motors are the backbone of most desktop 3D printers and CNC machines. This faceplate matches their standard mounting pattern (31mm hole spacing for M3 screws).

```javascript
// NEMA 17 Motor Mount Faceplate
const plate = box(42.3, 42.3, 5);
const centerBore = cylinder(11, 20);

// 31mm hole spacing for M3 screws (15.5mm from center)
const m3_1 = translate(cylinder(1.5, 20), 15.5, 15.5, 0);
const m3_2 = translate(cylinder(1.5, 20), -15.5, 15.5, 0);
const m3_3 = translate(cylinder(1.5, 20), 15.5, -15.5, 0);
const m3_4 = translate(cylinder(1.5, 20), -15.5, -15.5, 0);

const m3_holes = union(union(m3_1, m3_2), union(m3_3, m3_4));
const all_holes = union(centerBore, m3_holes);

return subtract(plate, all_holes);
```

### Tutorial 3: Parametric Wheel Hub
A standard wheel hub used in differentially-driven robots. It features a solid inner core for mounting to a 5mm D-shaft, an outer rim, and weight-reduction cutouts.

```javascript
// Parametric Robot Wheel Hub
const outerCyl = cylinder(30, 15);
const innerCyl = translate(cylinder(20, 25), 0, 0, 5);
const hubBase = union(outerCyl, innerCyl);

// 5mm Motor Shaft Hole
const shaft = cylinder(2.5, 40);

// Weight reduction cutouts
const cut1 = translate(box(10, 15, 30), 0, 20, 0);
const cut2 = translate(box(10, 15, 30), 0, -20, 0);
const cut3 = translate(box(15, 10, 30), 20, 0, 0);
const cut4 = translate(box(15, 10, 30), -20, 0, 0);

const cutouts = union(union(cut1, cut2), union(cut3, cut4));
const subtractions = union(shaft, cutouts);

return subtract(hubBase, subtractions);
```

---

## 3. Best Practices
- **Variables**: Always assign your primitives to variables. This keeps your code clean.
- **Deep Nesting**: Avoid nesting `union` or `subtract` too deeply in one line. `union(union(a,b), union(c,d))` is cleaner than `union(a, union(b, union(c, d)))`.
- **Return Statement**: The script evaluator *must* hit a `return` statement at the end that returns a single CSG object. If you do not return an object, the WebGL viewport will be empty.


<footer class="footer">
  <p>
    Developed by Siyabonga B Phakathi of The Voice & Eye of Bhambatha Inc.

---

## 10. Energy & Power Dynamics Calculator
Quickly analyze power requirements across electrical and mechanical mechatronics systems.

**Built-In Functions:**
- `elec_power(v, i, pf)`: Calculates single-phase AC power in Watts. (Default Power Factor `pf = 1`).
- `elec_3phase(v, i, pf)`: Calculates 3-phase AC power in Watts.
- `mech_power(torque, rpm)`: Calculates mechanical shaft power in Watts.
- `kinetic_e(m, v)`: Calculates Kinetic Energy in Joules (m in kg, v in m/s).
- `potential_e(m, h)`: Calculates Potential Energy in Joules.

## 11. Fluid Power & Pneumatics Calculator
Calculate hydraulic and pneumatic system parameters for actuating heavy machinery.

**Built-In Functions:**
- `fluid_power(pressure_bar, flow_Lmin)`: Calculates fluid power in kilowatts (kW).
- `cylinder_force(pressure_bar, diameter_mm)`: Calculates the extension force of a pneumatic cylinder in Newtons.
- `flow_vel(flow_Lmin, diameter_mm)`: Calculates the velocity of fluid flowing through a pipe in meters per second (m/s).

---

# Compute Tools & Utilities Manual

The **Compute Tools** section in ASCADS provides a suite of advanced calculators and converters for digital logic, number formatting, and electrotechnology. It is designed to assist engineers with rapid mathematical verification without needing to leave the environment.

## 1. Contextual Info Blocks
Across the entire suite of Compute Tools, the interface features **Dynamic Info Blocks**. If you haven't provided enough inputs, or if the inputs are invalid/empty, a rich overlay appears explaining what is required. 
This ensures you are never left staring at empty screens or raw NaN values.

## 2. Electrotechnology Suite
The **Electrotechnology** tab is dedicated to analog circuit math and RF analysis.

### RLC / Impedance Calculator
Provides rapid calculations for:
- **Inductive Reactance (XL)**
- **Capacitive Reactance (XC)**
- **Total Impedance (Z)**
- **Phase Angle (θ)**
- **Resonance Frequency (f0)**

Simply input the Resistor (Ω), Inductor (mH), Capacitor (µF), and frequency (Hz).

### Ohm's Law & Power
A reactive calculator that deduces the missing values based on any **two** known variables out of Voltage (V), Current (I), Resistance (R), and Power (P). 

### Component Parameters
Calculate fundamental properties for physical components:
- **Resistivity (ρ):** Determine resistance based on material resistivity, length, and cross-sectional area.
- **Equivalent Resistors & Capacitors:** Quickly compute equivalent values for series and parallel configurations.

### Ideal Transformer
Enter any three values from Primary Voltage, Secondary Voltage, Primary Turns, and Secondary Turns to instantly solve for the fourth and determine the Turns Ratio.

### 3-Phase Power Analyzer
Analyze balanced 3-phase systems. Input Line-to-Line Voltage, Line Current, and Power Factor to compute:
- Apparent Power (S) in kVA
- Real Power (P) in kW
- Reactive Power (Q) in kVAR

## 3. Advanced Maths Module
The **Advanced Maths** section provides specialized calculators for complex engineering mathematics. Note: This module features split-panel **Dynamic Info Blocks** that guide you when inputs are empty or invalid.

### Complex Numbers
Perform arithmetic operations (Add, Subtract, Multiply, Divide) on complex numbers defined in rectangular form `a + bi`. Converts results directly into polar form `r∠θ` for AC circuit analysis.

### Matrix Algebra
A 2x2 matrix operations suite. Input matrices A and B to rapidly compute:
- Addition and Subtraction
- Matrix Multiplication (A × B)
- Determinants and Inverses of both matrices

### Fourier Series
Compute the coefficients ($a_0$, $a_n$, $b_n$) for the Fourier series representation of standard periodic waveforms. Supported wave types include Square, Triangle, and Sawtooth waves with configurable amplitude and frequency.

### Vector Geometry
Analyze 3D vectors. Input components for Vector A and Vector B to determine:
- Vector Addition and Subtraction
- Dot Product and Cross Product
- The Angle between the two vectors (in degrees)

## 4. Digital Logic & Formats
- **Boolean Logic**: Synthesizes minimized K-maps, SOP, and POS expressions instantly from a 3-variable truth table.
- **Number Formats**: Provides IEEE 754 float visualizations, Gray code conversion, BCD/Excess-3 formats, and Hamming (7,4) error detection and correction.
- **Base Converter**: Seamlessly converts between Decimal, Binary, Octal, Hexadecimal, and supports fast bitwise toggling.

*End of Compute Tools Documentation!*

---

# ASCADS Engigraph Pro: 3D Code CAD Manual

Welcome to the **Engigraph 3D Code CAD** environment. Engigraph Pro allows you to build complex, 3D-printable robotics and mechanical parts using purely parametric JavaScript code. It utilizes a Constructive Solid Geometry (CSG) engine powered by `three-csg-ts`.

---

## 1. The CSG API

The engine exposes several global functions you can use in your scripts to generate geometry.

### Primitive Shapes
- **`box(w, d, h)`**: Creates a rectangular prism. (width, depth, height)
- **`cylinder(r, h)`**: Creates a cylinder. Oriented along the Z-axis by default.
- **`sphere(r)`**: Creates a sphere with radius `r`.

### Boolean Operations
CSG allows you to combine solid shapes to create complex models.
- **`union(a, b)`**: Fuses two shapes together into a single solid.
- **`subtract(a, b)`**: Cuts shape `b` out of shape `a`. (Essential for making screw holes).
- **`intersect(a, b)`**: Returns only the overlapping volume between `a` and `b`.

### Transformations
- **`translate(obj, x, y, z)`**: Moves an object in 3D space.
- **`rotate(obj, rx, ry, rz)`**: Rotates an object (angles are in radians).
- **`scale(obj, sx, sy, sz)`**: Scales an object uniformly or non-uniformly.
- **`mirror(obj, x, y, z)`**: Mirrors an object across the specified axes.

---

## 2. Tutorials & Code Samples

Below are reference tutorials to help you understand how to design robotics parts using Engigraph 3D.

### Tutorial 1: Basic Bracket with Holes
A standard mounting bracket. We create a large base box, and then `subtract` four corner screw holes and one large center bore.

```javascript
// Basic Bracket
const base = box(100, 100, 10);

// Create corner holes
const h1 = translate(cylinder(5, 30), 30, 30, 0);
const h2 = translate(cylinder(5, 30), -30, 30, 0);
const h3 = translate(cylinder(5, 30), 30, -30, 0);
const h4 = translate(cylinder(5, 30), -30, -30, 0);

// Create large center bore
const centerHole = cylinder(20, 30);

// Group all holes together into one solid object using union
const holes = union(union(h1, h2), union(h3, h4));
const allHoles = union(holes, centerHole);

// Subtract the grouped holes from the base and return the final mesh
return subtract(base, allHoles);
```

### Tutorial 2: NEMA 17 Stepper Motor Faceplate
NEMA 17 stepper motors are the backbone of most desktop 3D printers and CNC machines. This faceplate matches their standard mounting pattern (31mm hole spacing for M3 screws).

```javascript
// NEMA 17 Motor Mount Faceplate
const plate = box(42.3, 42.3, 5);
const centerBore = cylinder(11, 20);

// 31mm hole spacing for M3 screws (15.5mm from center)
const m3_1 = translate(cylinder(1.5, 20), 15.5, 15.5, 0);
const m3_2 = translate(cylinder(1.5, 20), -15.5, 15.5, 0);
const m3_3 = translate(cylinder(1.5, 20), 15.5, -15.5, 0);
const m3_4 = translate(cylinder(1.5, 20), -15.5, -15.5, 0);

const m3_holes = union(union(m3_1, m3_2), union(m3_3, m3_4));
const all_holes = union(centerBore, m3_holes);

return subtract(plate, all_holes);
```

### Tutorial 3: Parametric Wheel Hub
A standard wheel hub used in differentially-driven robots. It features a solid inner core for mounting to a 5mm D-shaft, an outer rim, and weight-reduction cutouts.

```javascript
// Parametric Robot Wheel Hub
const outerCyl = cylinder(30, 15);
const innerCyl = translate(cylinder(20, 25), 0, 0, 5);
const hubBase = union(outerCyl, innerCyl);

// 5mm Motor Shaft Hole
const shaft = cylinder(2.5, 40);

// Weight reduction cutouts
const cut1 = translate(box(10, 15, 30), 0, 20, 0);
const cut2 = translate(box(10, 15, 30), 0, -20, 0);
const cut3 = translate(box(15, 10, 30), 20, 0, 0);
const cut4 = translate(box(15, 10, 30), -20, 0, 0);

const cutouts = union(union(cut1, cut2), union(cut3, cut4));
const subtractions = union(shaft, cutouts);

return subtract(hubBase, subtractions);
```

---

## 3. Best Practices
- **Variables**: Always assign your primitives to variables. This keeps your code clean.
- **Deep Nesting**: Avoid nesting `union` or `subtract` too deeply in one line. `union(union(a,b), union(c,d))` is cleaner than `union(a, union(b, union(c, d)))`.
- **Return Statement**: The script evaluator *must* hit a `return` statement at the end that returns a single CSG object. If you do not return an object, the WebGL viewport will be empty.


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

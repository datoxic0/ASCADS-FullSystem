/**
 * Static content for the System Thesis and Documentation sections.
 * Refactored to separate technical logic from descriptive content.
 */
export const DocumentationContent = {
    abstract: `
        <h1>Executive Abstract: EngiGraph Pro System</h1>
        <p>EngiGraph Pro is a high-fidelity, mechatronics-aware Computer Aided Design (CAD) system designed to bridge the gap between technical drafting and functional simulation. Built on a modular, parametric engine, it implements rigorous engineering standards while providing real-time nodal logic simulation.</p>
        <h2>System Philosophy</h2>
        <ul>
            <li><strong>Parametric Precision:</strong> Every geometric entity is defined by mathematical constraints rather than visual approximations.</li>
            <li><strong>Standardized Compliance:</strong> Integration of SANS 10111 and ISO 128 ensures all outputs are ready for industrial manufacture.</li>
            <li><strong>Interdisciplinary Integration:</strong> Simultaneous modelling of mechanical components and electrotechnical circuits allows for unified mechatronic design.</li>
            <li><strong>Constructive Solid Geometry (CSG):</strong> A fully featured hybrid 3D engine allows for code-driven parametric solid modelling for robotics and additive manufacturing.</li>
        </ul>
        <h2>Core Architecture</h2>
        <p>The system utilizes <code>paper.js</code> for vector manipulation, extended with custom computational geometry modules for gear generation, section properties calculation, and Canny-edge raster-to-vector digitization.</p>
    `,

    manual: `
        <h1>User Manual: Comprehensive Guide & Reference</h1>
        <p>Welcome to the EngiGraph Pro command center. This manual provides the technical specifications for operating the system with maximum efficiency.</p>
        
        <h2>1. Keyboard Shortcuts (Hotkeys)</h2>
        <div class="tutorial-card">
            <ul style="columns: 2; -webkit-columns: 2; list-style-type: none; padding: 0;">
                <li><kbd>V</kbd> Selection Tool</li>
                <li><kbd>H</kbd> Pan / Hand Tool</li>
                <li><kbd>L</kbd> Line Tool</li>
                <li><kbd>C</kbd> Compass (Circle)</li>
                <li><kbd>R</kbd> Rectangle Tool</li>
                <li><kbd>A</kbd> 3-Point Arc</li>
                <li><kbd>T</kbd> Text Annotation</li>
                <li><kbd>D</kbd> Smart Dimension</li>
                <li><kbd>F</kbd> Fit View (Zoom Extents)</li>
                <li><kbd>G</kbd> Toggle Grid</li>
                <li><kbd>O</kbd> Toggle Ortho Mode</li>
                <li><kbd>S</kbd> Toggle Object Snap</li>
                <li><kbd>I</kbd> Toggle Isometric Mode</li>
                <li><kbd>Q</kbd> Toggle Dark/Light Theme</li>
                <li><kbd>P</kbd> Toggle Sidebar Panel</li>
                <li><kbd>B</kbd> Generate BOM</li>
                <li><kbd>Esc</kbd> Cancel / Reset Tool</li>
                <li><kbd>Del</kbd> Delete Selection</li>
                <li><kbd>Ctrl+Z</kbd> Undo Action</li>
                <li><kbd>Ctrl+Y</kbd> Redo Action</li>
                <li><kbd>Ctrl+S</kbd> Quick SVG Export</li>
                <li><kbd>0-9</kbd> Quick Color/Material</li>
            </ul>
        </div>

        <h2>2. Tinkercad-Style Color Shortcuts</h2>
        <p>Rapidly style your components by pressing numeric keys while an item is selected:</p>
        <div class="tutorial-card">
            <ul style="columns: 2; list-style-type: none; padding: 0; font-size: 11px;">
                <li><span style="color:var(--geometry-default)">■</span> 1: Default</li>
                <li><span style="color:#ff3b30">■</span> 2: Red</li>
                <li><span style="color:#4cd964">■</span> 3: Green</li>
                <li><span style="color:#007aff">■</span> 4: Blue</li>
                <li><span style="color:#ffcc00">■</span> 5: Yellow</li>
                <li><span style="color:#5ac8fa">■</span> 6: Cyan</li>
                <li><span style="color:#ff9500">■</span> 7: Orange</li>
                <li><span style="color:#af52de">■</span> 8: Purple</li>
                <li><span style="color:#555555">■</span> 9: Steel</li>
                <li><span style="color:#000000">■</span> 0: Black</li>
            </ul>
        </div>

        <h2>3. Command Line Interface (CLI)</h2>
        <p>The command bar (bottom status bar) accepts industry-standard CAD aliases. Type a command and press <code>Enter</code>.</p>
        <div class="tutorial-card">
            <table style="width:100%; font-size:12px; border-collapse: collapse;">
                <tr style="border-bottom:1px solid #444"><td style="padding:4px"><code>L</code> / <code>LINE</code></td><td>Activate line tool</td></tr>
                <tr style="border-bottom:1px solid #444"><td style="padding:4px"><code>C</code> / <code>CIRCLE</code></td><td>Activate circle tool</td></tr>
                <tr style="border-bottom:1px solid #444"><td style="padding:4px"><code>Z E</code></td><td>Zoom Extents (Fit all)</td></tr>
                <tr style="border-bottom:1px solid #444"><td style="padding:4px"><code>Z [val]</code></td><td>Zoom to percentage (e.g. <code>Z 100</code>)</td></tr>
                <tr style="border-bottom:1px solid #444"><td style="padding:4px"><code>GRID [on/off/val]</code></td><td>Toggle or set grid step</td></tr>
                <tr style="border-bottom:1px solid #444"><td style="padding:4px"><code>SNAP [on/off]</code></td><td>Toggle Object Snapping</td></tr>
                <tr style="border-bottom:1px solid #444"><td style="padding:4px"><code>THEME [d/l/t]</code></td><td>Set Dark, Light, or Toggle theme</td></tr>
                <tr style="border-bottom:1px solid #444"><td style="padding:4px"><code>BOM</code></td><td>Generate Bill of Materials</td></tr>
                <tr style="border-bottom:1px solid #444"><td style="padding:4px"><code>EXPORT [svg/json]</code></td><td>Download current project</td></tr>
                <tr style="border-bottom:1px solid #444"><td style="padding:4px"><code>MV [x] [y]</code></td><td>Move selected item by offset</td></tr>
                <tr style="border-bottom:1px solid #444"><td style="padding:4px"><code>ROT [deg]</code></td><td>Rotate selected item by degrees</td></tr>
                <tr style="border-bottom:1px solid #444"><td style="padding:4px"><code>OFFSET [d]</code></td><td>Offset curve by distance</td></tr>
                <tr style="border-bottom:1px solid #444"><td style="padding:4px"><code>STD [sans/iso/ansi]</code></td><td>Switch Engineering Standard</td></tr>
                <tr style="border-bottom:1px solid #444"><td style="padding:4px"><code>HELP</code></td><td>Show documentation</td></tr>
                <tr><td style="padding:4px"><code>CLS</code> / <code>CLEAR</code></td><td>Wipe workspace (Warning!)</td></tr>
            </table>
        </div>

        <h2>4. Agentic Drafting Instruments</h2>
        <p>EngiGraph features "active" physical tools that enable precise geometric construction.</p>
        <ul>
            <li><strong>The Scale Ruler:</strong> Provides a 300mm visual guide. When active, lines will snap to millimeter increments along its edge.</li>
            <li><strong>Set Squares (30/60° & 45°):</strong> Force your drawing to adhere to standard engineering angles. Useful for isometric projections.</li>
            <li><strong>360° Protractor:</strong> Snap your vectors to precise angular intervals. Proximity to the center increases snap granularity.</li>
        </ul>

        <h2>5. Pro Tips for Power Users</h2>
        <ul>
            <li><strong>Middle Mouse:</strong> Hold the middle mouse button to pan at any time, regardless of the active tool.</li>
            <li><strong>Shift-Select:</strong> Hold <code>Shift</code> while clicking to select multiple entities for group transformations.</li>
            <li><strong>AI Vision:</strong> If you're stuck on a circuit, use "AI Vision" in the AI tab. It "looks" at your drawing and identifies missing connections.</li>
            <li><strong>BOM Generation:</strong> Use the Output tab to generate a Bill of Materials for all mechatronic components currently on your canvas.</li>
        </ul>
    `,

    standards: `
        <h1>Engineering Standards: SANS 10111 & ISO Reference</h1>
        <p>EngiGraph Pro prioritizes South African National Standards (SANS) for engineering graphics, ensuring alignment with international ISO frameworks.</p>
        <h2>SANS 10111-1 Highlights</h2>
        <ul>
            <li><strong>First vs Third Angle Projection:</strong> The system defaults to Third Angle Projection for South African industrial compatibility, including automatic generation of the standard projection symbol in templates.</li>
            <li><strong>Line Conventions:</strong> Implementation of Type A (Continuous), Type E (Hidden), and Type G (Center) lines as per the standard's requirements for clarity and lack of ambiguity.</li>
            <li><strong>Dimensioning:</strong> Dimensions are formatted as per SANS/ISO 129, with units assumed in millimeters and specific arrowhead geometries.</li>
        </ul>
    `,

    tutorial: `
        <h1>Usage Tutorial: Getting Started</h1>
        <div class="tutorial-card">
            <h3>Mechanical Design</h3>
            <div class="step-number">1</div> Select the 'Draw' tab to begin sketching primitives. Use the command bar for precise input (e.g., <code>CIRCLE</code>).
            <div class="step-number">2</div> Use 'Modelling' tools like <strong>Fillet</strong> or <strong>Trim</strong> to refine geometry into engineering parts.
        </div>
        <div class="tutorial-card">
            <h3>Mechatronics & Simulation</h3>
            <div class="step-number">1</div> Switch to the 'Electrotechnology' tab. Place a <strong>Battery</strong> and some <strong>LEDs</strong> or <strong>Logic Gates</strong>.
            <div class="step-number">2</div> Connect them using the <strong>Wire</strong> tool. Ensure endpoints snap together.
            <div class="step-number">3</div> Click <strong>Run</strong> in the circuit ribbon. Wires will animate when powered, and LEDs will illuminate based on nodal logic states.
        </div>
        <div class="tutorial-card">
            <h3>3D Code CAD (Robotics)</h3>
            <div class="step-number">1</div> Click the <strong>3D Code CAD</strong> button in the top toolbar to switch from 2D Legacy to 3D WebGL mode.
            <div class="step-number">2</div> Use the left-hand script editor to write JavaScript CSG algorithms (e.g. <code>subtract(box(10,10,10), cylinder(5, 10))</code>).
            <div class="step-number">3</div> Click <strong>Compile</strong> to instantly generate your 3D physics mesh! Reference the Library Sidebar for NEMA 17 Faceplate and Wheel Hub tutorials.
        </div>
    `,

    math: `
        <h1>Advanced Computational Algorithms</h1>
        <p>EngiGraph Pro utilizes higher-order mathematics for precision engineering tasks.</p>
        <h2>Involute Geometry</h2>
        <p>Gears are generated using the parametric involute function: <code>inv(φ) = tan(φ) - φ</code>. This ensures constant angular velocity and minimal friction in mechanical transmissions.</p>
        <h2>Section Analysis</h2>
        <p>Area, Centroids, and Moments of Inertia (Ixx, Iyy) are calculated using <strong>Green's Theorem</strong> on the boundary integrals of closed paths. This allows engineers to calculate structural integrity directly within the browser.</p>
    `,

    mechatronics: `
        <h1>The Mechatronics Suite</h1>
        <p>The system features a comprehensive library of mechatronic components with real-world footprints.</p>
        <ul>
            <li><strong>Microcontrollers:</strong> Arduino Uno, ESP32, and Raspberry Pi Pico footprints with precise pin alignments.</li>
            <li><strong>Sensors:</strong> HC-SR04 Ultrasonic modules and 4x4 Matrix keypads.</li>
            <li><strong>Actuators:</strong> NEMA 17 Stepper motors and SG90 servos.</li>
        </ul>
        <p>All components include metadata for BOM (Bill of Materials) generation and functional ports for simulation.</p>
    `,

    caseStudies: `
        <h1>Mechatronics Three Subjects Learning Case Study</h1>
        <p><strong>Intro to Computers and SPS | Electrotechnology | Mechatronics Systems</strong></p>
        <p>This section contains the finalized practical assessments and industrial blueprints for the Mechatronics curriculum.</p>

        <div class="tutorial-card" style="margin-top: 20px;">
            <h2>1. PLC / Function Block Diagram Interpretation</h2>
            <p><strong>Environment:</strong> Digital Logic Lab > Sequential Presets</p>
            <p>This demonstrates simplifying physical switching arrangements using Siemens LOGO! logic principles. The FBD drawing uses main variables, interpreting inversion bubbles correctly rather than treating them as separate switches.</p>
            <div style="margin: 15px 0; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; overflow: hidden; background: #fff;">
                <img src="/case-studies/image3.png" alt="FBD Drawing and Explanation" style="width: 100%; height: auto; object-fit: contain; opacity: 1;" />
            </div>
            <ul>
                <li><strong>Logic:</strong> Z = AB + A'B'</li>
                <li><strong>Inputs:</strong> A, B</li>
            </ul>
        </div>

        <div class="tutorial-card" style="margin-top: 20px;">
            <h2>2. Design: Stop/FWD/REV DC Motor Control</h2>
            <p><strong>Objective:</strong> Implement bidirectional control using 4 relays (R1–R4) and 3 buttons (PB-STOP, PB-FWD, PB-REV).</p>
            <div style="margin: 15px 0; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; overflow: hidden; background: #fff;">
                <img src="/case-studies/image4.png" alt="DC Motor Control Scheme" style="width: 100%; height: auto; object-fit: contain; opacity: 1;" />
            </div>
            <ul>
                <li><strong>FWD Action:</strong> Pressing PB-FWD energizes R1/R2. R1 connects M+ to supply. R2 NO contacts latch the circuit.</li>
                <li><strong>REV Action:</strong> PB-REV energizes R3/R4, swapping motor polarity. R4 NO contacts latch the reverse state.</li>
                <li><strong>Safety Interlock:</strong> The coil for R1/R2 is routed through R3 NC contacts; R3/R4 is routed through R1 NC.</li>
            </ul>
        </div>

        <div class="tutorial-card" style="margin-top: 20px;">
            <h2>3. Electro-Pneumatic Single Cycle Diagram</h2>
            <p><strong>Behavior:</strong> A single PB trigger must execute: Extension → 1s Dwell at limit → Retraction → Termination at home position.</p>
            <div style="margin: 15px 0; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; overflow: hidden; background: #fff;">
                <img src="/case-studies/image7.png" alt="Pneumatic System Diagram" style="width: 100%; height: auto; object-fit: contain; opacity: 1;" />
            </div>
            <ul>
                <li><strong>Stroke Duration (3–5s):</strong> Regulated via one-way flow control valves in the air lines.</li>
                <li><strong>Pause Duration (1s):</strong> Regulated by an electrical timer within the control logic.</li>
                <li><strong>Simplified Logic Path:</strong> PB → K1 (Extension) → S2 Sensor → T1 Timer → T1 Timeout → K2 (Retraction) → S1 (Reset)</li>
            </ul>
        </div>
    `
};
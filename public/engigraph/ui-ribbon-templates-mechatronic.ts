/**
 * Mechatronic & Electronics Tab Templates (Mechatronics, Circuit, AI)
 */
export const MechatronicTemplates = {
    renderComponentsTab: () => `
        <div class="tool-section hidden" data-tab="components">
            <div class="tool-group">
                <button class="tool-btn" data-tool="select" title="Selection Tool"><i data-ribbon-icon="mouse-pointer-2"></i><span>Select</span></button>
                <button class="tool-btn" data-tool="pan" title="Pan Tool"><i data-ribbon-icon="move"></i><span>Pan</span></button>
            </div>
            <div class="tool-separator"></div>
            <div class="tool-group">
                <span class="toggle-label">Controllers</span>
                <button class="tool-btn btn-part-trigger" data-part="arduino_uno" title="Arduino Uno R3"><i data-ribbon-icon="cpu"></i><span>Uno</span></button>
                <button class="tool-btn btn-part-trigger" data-part="esp32" title="ESP32 DevKit"><i data-ribbon-icon="cpu"></i><span>ESP32</span></button>
                <button class="tool-btn btn-part-trigger" data-part="rpi_pico" title="Raspberry Pi Pico"><i data-ribbon-icon="cpu"></i><span>Pico</span></button>
            </div>
            <div class="tool-separator"></div>
            <div class="tool-group">
                <span class="toggle-label">UI & Input</span>
                <button class="tool-btn btn-part-trigger" data-part="lcd_1602" title="LCD 1602 Display"><i data-ribbon-icon="columns"></i><span>LCD</span></button>
                <button class="tool-btn btn-part-trigger" data-part="keypad_4x4" title="4x4 Matrix Keypad"><i data-ribbon-icon="layout-grid"></i><span>Keypad</span></button>
            </div>
            <div class="tool-separator"></div>
            <div class="tool-group">
                <span class="toggle-label">Breadboard</span>
                <button class="tool-btn btn-part-trigger" data-part="breadboard_half" title="Half Breadboard"><i data-ribbon-icon="grid"></i><span>Board</span></button>
            </div>
            <div class="tool-separator"></div>
            <div class="tool-group">
                <span class="toggle-label">Motion</span>
                <button class="tool-btn btn-part-trigger" data-part="nema17" title="NEMA 17 Motor"><i data-ribbon-icon="box"></i><span>NEMA17</span></button>
                <button class="tool-btn btn-part-trigger" data-part="servo_sg90" title="SG90 Micro Servo"><i data-ribbon-icon="refresh-cw"></i><span>Servo</span></button>
                <button class="tool-btn btn-part-trigger" data-part="dc_motor_generic" title="DC Toy Motor"><i data-ribbon-icon="circle"></i><span>DC Motor</span></button>
                <button class="tool-btn btn-part-trigger" data-part="bearing_608" title="608 Bearing"><i data-ribbon-icon="circle"></i><span>Bearing</span></button>
            </div>
            <div class="tool-separator"></div>
            <div class="tool-group">
                <span class="toggle-label">Sensing & Power</span>
                <button class="tool-btn btn-part-trigger" data-part="hcsr04" title="Ultrasonic Sensor"><i data-ribbon-icon="waves"></i><span>Sonar</span></button>
                <button class="tool-btn btn-part-trigger" data-part="battery_18650" title="18650 Battery"><i data-ribbon-icon="battery"></i><span>18650</span></button>
                <button class="tool-btn btn-part-trigger" data-part="buzzer" title="Active Piezo Buzzer"><i data-ribbon-icon="volume-2"></i><span>Buzzer</span></button>
            </div>
            <div class="tool-separator"></div>
            <div class="tool-group">
                <span class="toggle-label">Wiring</span>
                <button class="tool-btn" data-tool="wire" title="Route Smart Wire"><i data-ribbon-icon="git-merge"></i><span>Wire</span></button>
                <button class="tool-btn" id="btn-ai-route" title="AI Auto-Route Wiring"><i data-ribbon-icon="sparkles"></i><span>Auto-Wire</span></button>
            </div>
        </div>
    `,

    renderCircuitTab: () => `
        <div class="tool-section hidden" data-tab="circuit">
            <div class="tool-group">
                <button class="tool-btn" data-tool="select" title="Selection Tool"><i data-ribbon-icon="mouse-pointer-2"></i><span>Select</span></button>
                <button class="tool-btn" data-tool="pan" title="Pan Tool"><i data-ribbon-icon="move"></i><span>Pan</span></button>
            </div>
            <div class="tool-separator"></div>
            <div class="tool-group">
                <span class="toggle-label">Active Simulation</span>
                <button class="tool-btn" id="btn-sim-start" title="Start Simulation"><i data-ribbon-icon="zap"></i><span>Run</span></button>
                <button class="tool-btn" id="btn-sim-stop" title="Stop Simulation"><i data-ribbon-icon="zap-off"></i><span>Stop</span></button>
                <button class="tool-btn" id="btn-sim-scope" title="Logic Analyzer Oscilloscope"><i data-ribbon-icon="activity"></i><span>Logic Scope</span></button>
                <button class="tool-btn" id="btn-sim-terminal" title="UART Serial Communication Monitor"><i data-ribbon-icon="terminal"></i><span>UART Port</span></button>
                <button class="tool-btn" id="btn-sim-flow" title="Computational Fluid Dynamics (CFD)"><i data-ribbon-icon="wind"></i><span>CFD Solver</span></button>
                <button class="tool-btn" id="btn-sim-acoustic" title="Acoustic & Vibration Analysis"><i data-ribbon-icon="mic"></i><span>Acoustic FFT</span></button>
                <button class="tool-btn" id="btn-sim-noise" title="FEA Thermal & Heat Dissipation"><i data-ribbon-icon="flame"></i><span>FEA Thermal</span></button>
            </div>
            <div class="tool-separator"></div>
            <div class="tool-group">
                <span class="toggle-label">Schematic Symbols</span>
                <button class="tool-btn btn-part-trigger" data-part="battery_18650" title="DC Source"><i data-ribbon-icon="battery"></i><span>Source</span></button>
                <button class="tool-btn btn-part-trigger" data-part="ground" title="Ground"><i data-ribbon-icon="minus"></i><span>GND</span></button>
                <button class="tool-btn btn-part-trigger" data-part="resistor" title="Resistor"><i data-ribbon-icon="activity"></i><span>Resistor</span></button>
                <button class="tool-btn btn-part-trigger" data-part="capacitor" title="Capacitor"><i data-ribbon-icon="columns"></i><span>Capacitor</span></button>
                <button class="tool-btn btn-part-trigger" data-part="inductor" title="Inductor"><i data-ribbon-icon="wind"></i><span>Inductor</span></button>
                <button class="tool-btn btn-part-trigger" data-part="diode" title="Diode"><i data-ribbon-icon="play"></i><span>Diode</span></button>
                <button class="tool-btn btn-part-trigger" data-part="transistor" title="Transistor (NPN)"><i data-ribbon-icon="share-2"></i><span>Transistor</span></button>
                <button class="tool-btn btn-part-trigger" data-part="mosfet" title="MOSFET (N-Ch)"><i data-ribbon-icon="cpu"></i><span>MOSFET</span></button>
                <button class="tool-btn btn-part-trigger" data-part="op_amp" title="Operational Amplifier"><i data-ribbon-icon="triangle"></i><span>Op-Amp</span></button>
                <button class="tool-btn btn-part-trigger" data-part="voltage_regulator" title="Voltage Regulator"><i data-ribbon-icon="zap"></i><span>V-Reg</span></button>
                <button class="tool-btn btn-part-trigger" data-part="relay" title="SPDT Relay"><i data-ribbon-icon="toggle-right"></i><span>Relay</span></button>
                <button class="tool-btn btn-part-trigger" data-part="led_red" title="LED Red"><i data-ribbon-icon="lightbulb"></i><span>Red LED</span></button>
                <button class="tool-btn btn-part-trigger" data-part="led_blue" title="LED Blue"><i data-ribbon-icon="lightbulb"></i><span>Blue LED</span></button>
                <button class="tool-btn btn-part-trigger" data-part="switch_spst" title="SPST Switch"><i data-ribbon-icon="toggle-left"></i><span>Switch</span></button>
            </div>
            <div class="tool-separator"></div>
            <div class="tool-group">
                <span class="toggle-label">Logic Gates</span>
                <button class="tool-btn btn-part-trigger" data-part="gate_and" title="AND Gate"><i data-ribbon-icon="git-merge"></i><span>AND</span></button>
                <button class="tool-btn btn-part-trigger" data-part="gate_or" title="OR Gate"><i data-ribbon-icon="git-branch"></i><span>OR</span></button>
                <button class="tool-btn btn-part-trigger" data-part="gate_not" title="NOT Gate"><i data-ribbon-icon="circle-slash"></i><span>NOT</span></button>
                <button class="tool-btn btn-part-trigger" data-part="gate_xor" title="XOR Gate"><i data-ribbon-icon="git-pull-request"></i><span>XOR</span></button>
                <button class="tool-btn btn-part-trigger" data-part="gate_nand" title="NAND Gate"><i data-ribbon-icon="git-commit"></i><span>NAND</span></button>
                <button class="tool-btn btn-part-trigger" data-part="gate_nor" title="NOR Gate"><i data-ribbon-icon="corner-down-right"></i><span>NOR</span></button>
            </div>
            <div class="tool-separator"></div>
            <div class="tool-group">
                <span class="toggle-label">Conductors</span>
                <button class="tool-btn" data-tool="wire" title="Electrical Wire"><i data-ribbon-icon="git-commit"></i><span>Wire</span></button>
            </div>
        </div>
    `,

    renderAITab: () => `
        <div class="tool-section hidden" data-tab="ai">
            <div class="tool-group">
                <button class="tool-btn" id="btn-open-ai" title="Launch EngiGraph AI"><i data-ribbon-icon="bot"></i><span>Assistant</span></button>
                <button class="tool-btn" id="btn-ai-vision" title="AI Vision Analysis"><i data-ribbon-icon="eye"></i><span>See All</span></button>
                <button class="tool-btn" id="btn-ai-architect" title="AI Component Architect"><i data-ribbon-icon="cpu"></i><span>Architect</span></button>
            </div>
            <div class="tool-separator"></div>
            <div class="tool-group">
                <span class="toggle-label">Agentic Audit</span>
                <button class="tool-btn" id="btn-ai-compliance" title="Run Vision-based Compliance Audit"><i data-ribbon-icon="shield-check"></i><span>Deep Audit</span></button>
                <button class="tool-btn" id="btn-ai-optimize" title="AI Design Optimizer"><i data-ribbon-icon="zap"></i><span>Optimize</span></button>
            </div>
        </div>
    `
};
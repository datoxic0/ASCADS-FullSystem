import paper from 'https://esm.sh/paper';
import { CircuitUtils } from './engine-circuit-utils.js';
import { CircuitSolver } from './engine-circuit-solver.js';
/**
 * Advanced Nodal Simulation Engine for Mechatronics
 * Orchestrates DC circuit propagation and logic state analysis.
 */
export class CircuitEngine {
    constructor(app) {
        this.app = app;
        this.isRunning = false;
        this.timer = null;
        this.updateInterval = 100;
        this.scopeData = {}; // NetID -> Array of states [0/1]
        this.probedNetId = null;
        this.needsDiscovery = true;
        this.cachedNets = [];
    }
    start() {
        if (this.isRunning)
            return;
        this.isRunning = true;
        this.needsDiscovery = true; // Force discovery on first run
        this.timer = setInterval(() => this.tick(), this.updateInterval);
        this.app.ai.logAI("System", "Circuit simulation engine engaged. Analyzing netlist...");
    }
    stop() {
        const wasRunning = this.isRunning;
        this.isRunning = false;
        if (this.timer)
            clearInterval(this.timer);
        this.resetStates();
        if (wasRunning) {
            this.app.ai.logAI("System", "Simulation halted.");
        }
    }
    resetStates() {
        if (!this.app.themeColors)
            return;
        const defaultColor = this.app.themeColors.geometry;
        const geomLayer = paper.project.layers.find(l => l.name === 'geometry_layer');
        if (!geomLayer)
            return;
        geomLayer.children.forEach(item => {
            if (item.data && item.data.type === 'component') {
                item.data.powered = false;
                item.data.state = 'off';
                this.updateComponentVisuals(item, false);
            }
            if (item.data && item.data.type === 'wire') {
                item.strokeColor = '#3b82f6';
                item.shadowColor = '#3b82f6';
                item.shadowBlur = 4;
                item.strokeWidth = 3;
                item.dashArray = [];
                item.dashOffset = 0;
            }
        });
    }
    tick() {
        this.resetCalculatedStates();
        if (Math.random() > 0.95)
            this.simulateSerialTraffic();
        const items = CircuitUtils.getSimulatableItems();
        // Use Real SPICE Simulation Engine if available
        if (window.ASCADSpiceEngine) {
            const { nodes, edges } = this.buildSPICENetlistInput(items);
            const netlist = window.ASCADSpiceEngine.buildNetlist(nodes, edges);
            const result = window.ASCADSpiceEngine.solveDC(netlist);
            this.applySPICEResults(items, result);
        }
        else {
            // Fallback to Toyish Logic if SPICE is missing
            if (this.needsDiscovery) {
                this.cachedNets = CircuitUtils.discoverNets(items);
                this.needsDiscovery = false;
            }
            CircuitSolver.solveStaticNets(this.cachedNets);
            for (let i = 0; i < 12; i++) {
                if (!CircuitSolver.solveLogicIteration(this.cachedNets))
                    break;
            }
            this.applyVisualFeedback();
        }
        this.updateTelemetry(items);
        // Update Scope Data (Virtual Logic Analyzer)
        if (!this.scopeData[0])
            this.scopeData[0] = [];
        // Sample the first high net, or default to 0
        let sampledState = 0;
        if (this.cachedNets && this.cachedNets.length > 0) {
            const probeTarget = this.cachedNets.find(n => n.state === 'HIGH') || this.cachedNets[0];
            sampledState = probeTarget.state === 'HIGH' ? 1 : 0;
        }
        this.scopeData[0].push(sampledState);
        if (this.scopeData[0].length > 100)
            this.scopeData[0].shift();
    }
    buildSPICENetlistInput(items) {
        const nodes = [];
        const edges = [];
        const comps = items.filter(it => it.data && it.data.type === 'component');
        const wires = items.filter(it => it.data && (it.data.type === 'wire' || (it.data.type === 'line' && it.segments.length > 1)));
        comps.forEach(it => {
            let tpl = it.data.partType;
            if (tpl === 'switch_spst')
                tpl = 'switch';
            else if (tpl === 'button')
                tpl = 'push-button';
            else if (tpl === 'battery_18650')
                tpl = 'battery';
            else if (tpl === 'led_red')
                tpl = 'led-red';
            const stateVal = it.data.state;
            let isClosed = false;
            if (tpl === 'push-button') {
                isClosed = (stateVal === true || stateVal === 'true' || stateVal === 'Closed');
            }
            else {
                isClosed = (stateVal !== 'open' && stateVal !== 'Open' && stateVal !== false && stateVal !== 'false');
            }
            nodes.push({
                id: it.id.toString(),
                data: {
                    templateId: tpl,
                    state: { closed: isClosed },
                    values: { voltage: '5V', resistance: '1000' } // defaults
                }
            });
        });
        // Resolve connections: If a component pin touches a wire, or another component pin directly
        const pins = [];
        comps.forEach(it => {
            const pts = CircuitUtils.getPointsOfEntry(it);
            pts.forEach((p, idx) => {
                let tpl = it.data.partType;
                // Pin handle mapping: vcc/p1 -> 1, gnd/p2 -> 2
                let handle = (p.role === 'gnd' || p.role === 'p2') ? '2' : '1';
                if (tpl === 'ground')
                    handle = 'gnd';
                pins.push({ compId: it.id.toString(), handle, pos: p.pos || p });
            });
        });
        // Basic O(n^2) connection check (fine for small circuits)
        let edgeId = 0;
        // 1. Direct Pin to Pin connections
        for (let i = 0; i < pins.length; i++) {
            for (let j = i + 1; j < pins.length; j++) {
                if (pins[i].pos.getDistance(pins[j].pos) < 15) {
                    edges.push({ id: `e${edgeId++}`, source: pins[i].compId, sourceHandle: pins[i].handle, target: pins[j].compId, targetHandle: pins[j].handle });
                }
            }
        }
        // 2. Wire connections: Find which pins touch which wires. 
        // Wires that touch each other effectively bridge the pins.
        // For simplicity: each wire connects any pins it touches.
        wires.forEach(w => {
            const wPts = CircuitUtils.getPointsOfEntry(w).map(p => p.pos || p);
            const touchingPins = pins.filter(p => wPts.some(wp => wp && wp.getDistance(p.pos) < 15));
            for (let i = 0; i < touchingPins.length; i++) {
                for (let j = i + 1; j < touchingPins.length; j++) {
                    edges.push({
                        id: `e${edgeId++}`,
                        source: touchingPins[i].compId, sourceHandle: touchingPins[i].handle,
                        target: touchingPins[j].compId, targetHandle: touchingPins[j].handle
                    });
                }
            }
        });
        return { nodes, edges };
    }
    applySPICEResults(items, result) {
        if (!result.converged)
            return;
        // Reset visual state
        items.forEach(it => { if (it.data)
            it.data.isPowered = false; });
        // Apply Branch Currents
        const comps = items.filter(it => it.data && it.data.type === 'component');
        comps.forEach(it => {
            const br = result.branchResults.find(b => b.componentId === it.id.toString());
            if (br && br.isActive) {
                it.data.isPowered = true;
                // For motors, map voltage to speed
                if (it.data.partType === 'nema17' || it.data.partType === 'dc_motor_generic') {
                    it.data.speed = br.voltage * 2;
                }
            }
        });
        // Wires - simple power indication if attached to an active node
        const activeNodes = result.nodeVoltages.filter(nv => nv.voltage > 0.5 && !nv.isGround).map(nv => nv.nodeId);
        // Actually to color wires, we could just fallback to the old visual feedback or mark them true if they touch powered components
        // We'll rely on updateComponentVisuals in applyVisualFeedback
        const wires = items.filter(it => it.data && (it.data.type === 'wire' || it.data.type === 'line'));
        wires.forEach(w => {
            const wPts = CircuitUtils.getPointsOfEntry(w).map(p => p.pos || p);
            w.data.isPowered = comps.some(c => c.data.isPowered && wPts.some(wp => wp && wp.getDistance(c.position) < 50));
        });
        this.applyVisualFeedback();
    }
    simulateSerialTraffic() {
        const microcontrollers = paper.project.getItems({
            data: (d) => d && d.type === 'component' && ['arduino_uno', 'esp32', 'rpi_pico'].includes(d.partType)
        });
        microcontrollers.forEach(mcu => {
            if (mcu.data.isPowered) {
                const logs = [
                    `[MCU-${mcu.id.slice(0, 4)}] ADC Read: ${Math.floor(Math.random() * 1024)}`,
                    `[MCU-${mcu.id.slice(0, 4)}] Pin state toggle: HIGH`,
                    `[MCU-${mcu.id.slice(0, 4)}] Task heartbeat: OK`,
                    `[MCU-${mcu.id.slice(0, 4)}] Memory usage: ${Math.floor(Math.random() * 20)}%`
                ];
                const msg = logs[Math.floor(Math.random() * logs.length)];
                this.app.ui.logToTerminal(msg, 'mcu');
            }
        });
    }
    updateTelemetry(items) {
        let totalCurrentMA = 0;
        let voltage = 0;
        items.forEach(it => {
            if (it.data.isPowered) {
                totalCurrentMA += (it.data.powerDrawMA || 0);
                if (it.data.partType === 'battery_18650')
                    voltage = it.data.voltage || 3.7;
            }
        });
        const powerMW = totalCurrentMA * voltage;
        const chip = document.getElementById('power-telemetry');
        if (chip) {
            if (powerMW > 0) {
                chip.classList.remove('hidden');
                (document.getElementById('telemetry-val') || {}).textContent = `${powerMW.toFixed(0)}mW`;
            }
            else {
                chip.classList.add('hidden');
            }
        }
    }
    resetCalculatedStates() {
        paper.project.layers.forEach(l => {
            if (l.name === 'grid_layer')
                return;
            l.children.forEach(item => {
                item.data.isPowered = false;
            });
        });
    }
    applyVisualFeedback() {
        if (!this.app.themeColors)
            return;
        const defaultColor = this.app.themeColors.geometry;
        paper.project.layers.forEach(l => {
            if (l.name === 'grid_layer' || !l.visible)
                return;
            l.children.forEach(item => {
                const isWire = item.data.type === 'wire' || (item.data.type === 'line' && item.data.type !== 'component' && item.segments.length === 2);
                if (item.data.isPowered) {
                    if (isWire) {
                        item.strokeColor = item.data.type === 'wire' ? '#22c55e' : '#ffdd44';
                        item.dashArray = item.data.type === 'wire' ? [8, 8] : [6, 4];
                        item.dashOffset = (item.dashOffset || 0) - 2;
                        item.strokeWidth = item.data.type === 'wire' ? 3 : 2.5;
                        item.shadowColor = item.data.type === 'wire' ? '#22c55e' : 'rgba(255, 221, 68, 0.4)';
                        item.shadowBlur = item.data.type === 'wire' ? 10 : 8;
                    }
                    this.updateComponentVisuals(item, true);
                }
                else {
                    if (isWire) {
                        item.strokeColor = item.data.type === 'wire' ? '#3b82f6' : defaultColor;
                        item.dashArray = [];
                        item.shadowBlur = item.data.type === 'wire' ? 4 : 0;
                        item.shadowColor = item.data.type === 'wire' ? '#3b82f6' : 'transparent';
                        item.strokeWidth = item.data.type === 'wire' ? 3 : 1.5;
                    }
                    this.updateComponentVisuals(item, false);
                }
            });
        });
    }
    updateComponentVisuals(item, powered) {
        const defaultColor = this.app.themeColors.geometry;
        const partType = item.data.partType;
        if (partType === 'led_red' || partType === 'led_blue') {
            const isActive = item.data.isPowered;
            const isBlue = partType === 'led_blue';
            item.children.forEach(c => {
                if (c.data && c.data.role === 'bulb') {
                    const activeColor = isBlue ? '#3b82f6' : '#ff0000';
                    const activeStroke = isBlue ? '#8fb6f9' : '#ff6666';
                    c.fillColor = isActive ? activeColor : 'transparent';
                    c.strokeColor = isActive ? activeStroke : defaultColor;
                    if (isActive) {
                        c.shadowColor = activeColor;
                        c.shadowBlur = 15;
                    }
                    else {
                        c.shadowBlur = 0;
                        c.fillColor = 'transparent';
                    }
                }
            });
        }
        if (partType === 'buzzer') {
            const isActive = item.data.isPowered;
            item.children.forEach(c => {
                if (c.data && c.data.role === 'wave') {
                    c.strokeColor = isActive ? '#00aaff' : 'transparent';
                    c.strokeWidth = isActive ? 2 : 0;
                    if (isActive) {
                        // Vibrate effect
                        const shift = Math.random() > 0.5 ? 1 : -1;
                        c.position.x += shift;
                        setTimeout(() => { if (c.position)
                            c.position.x -= shift; }, 50);
                    }
                }
            });
        }
        if (partType === 'switch_spst') {
            const lever = item.children.find(c => c.data && c.data.role === 'lever');
            if (lever) {
                const isOpen = item.data.state === 'open';
                lever.segments[1].point = item.position.add(isOpen ? [5, -8] : [5, 0]);
                lever.strokeColor = powered ? '#ffcc00' : defaultColor;
            }
        }
        if (partType === 'button') {
            const isPushed = item.data.state === true;
            const plungerLine = item.children[2]; // bPlunger
            const stem = item.children[3]; // bStem
            const cap = item.children[4]; // bCap
            if (plungerLine && stem && cap) {
                const pushY = isPushed ? 0 : -5;
                plungerLine.segments[0].point = item.position.add([-5, pushY]);
                plungerLine.segments[1].point = item.position.add([5, pushY]);
                stem.segments[0].point = item.position.add([0, pushY]);
                stem.segments[1].point = item.position.add([0, pushY - 5]);
                cap.position = item.position.add([0, pushY - 6]);
            }
        }
        if (partType === 'relay') {
            const lever = item.children[7]; // swLever
            if (lever) {
                // If powered (isPowered is set by solver), lever touches NO (which is at -8)
                // Otherwise it touches NC (which is at +8)
                const targetY = powered ? -8 : 8;
                lever.segments[1].point = item.position.add([5, targetY]);
                lever.strokeColor = powered ? '#ffcc00' : defaultColor;
            }
        }
        // Mechanical Animation for Mechatronics
        if (powered) {
            if (partType === 'dc_motor_generic' || partType === 'nema17') {
                const shaft = item.children.find(c => c.data && c.data.role === 'shaft');
                if (shaft) {
                    const speed = item.data.speed || 5;
                    shaft.rotate(speed);
                }
            }
            if (partType === 'servo_sg90') {
                const horn = item.children.find(c => c.data && c.data.role === 'horn');
                if (horn) {
                    const targetAngle = item.data.targetAngle || 90;
                    const currentAngle = item.data.currentAngle || 0;
                    const diff = targetAngle - currentAngle;
                    if (Math.abs(diff) > 1) {
                        const step = Math.sign(diff) * 2;
                        horn.rotate(step, item.position.add([5.75, 0]));
                        item.data.currentAngle = currentAngle + step;
                    }
                }
            }
        }
        if (partType === 'resistor' || partType?.startsWith('gate_') || partType?.includes('arduino') || partType?.includes('esp32')) {
            item.strokeColor = powered ? '#ffcc00' : defaultColor;
            item.strokeWidth = powered ? 2 : 1.2;
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW5naW5lLWNpcmN1aXQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9lbmdpbmUtY2lyY3VpdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEtBQUssTUFBTSxzQkFBc0IsQ0FBQztBQUN6QyxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0sMkJBQTJCLENBQUM7QUFDekQsT0FBTyxFQUFFLGFBQWEsRUFBRSxNQUFNLDRCQUE0QixDQUFDO0FBRTNEOzs7R0FHRztBQUNILE1BQU0sT0FBTyxhQUFhO0lBQ3RCLFlBQVksR0FBRztRQUNYLElBQUksQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDO1FBQ2YsSUFBSSxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUM7UUFDdkIsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7UUFDbEIsSUFBSSxDQUFDLGNBQWMsR0FBRyxHQUFHLENBQUM7UUFDMUIsSUFBSSxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUMsQ0FBQyxpQ0FBaUM7UUFDdEQsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7UUFDeEIsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUM7UUFDM0IsSUFBSSxDQUFDLFVBQVUsR0FBRyxFQUFFLENBQUM7SUFDekIsQ0FBQztJQUVELEtBQUs7UUFDRCxJQUFJLElBQUksQ0FBQyxTQUFTO1lBQUUsT0FBTztRQUMzQixJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztRQUN0QixJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQyxDQUFDLCtCQUErQjtRQUMzRCxJQUFJLENBQUMsS0FBSyxHQUFHLFdBQVcsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBQ2pFLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUseURBQXlELENBQUMsQ0FBQztJQUMzRixD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
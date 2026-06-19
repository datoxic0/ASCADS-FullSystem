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
        if (this.isRunning) return;
        this.isRunning = true;
        this.needsDiscovery = true; // Force discovery on first run
        this.timer = setInterval(() => this.tick(), this.updateInterval);
        this.app.ai.logAI("System", "Circuit simulation engine engaged. Analyzing netlist...");
    }

    stop() {
        const wasRunning = this.isRunning;
        this.isRunning = false;
        if (this.timer) clearInterval(this.timer);
        this.resetStates();
        if (wasRunning) {
            this.app.ai.logAI("System", "Simulation halted.");
        }
    }

    resetStates() {
        if (!this.app.themeColors) return;
        const defaultColor = this.app.themeColors.geometry;
        const geomLayer = paper.project.layers.find(l => l.name === 'geometry_layer');
        if (!geomLayer) return;

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

        if (Math.random() > 0.95) this.simulateSerialTraffic();
        
        const items = CircuitUtils.getSimulatableItems();
        
        // Use Real SPICE Simulation Engine if available
        if (window.ASCADSpiceEngine) {
            const { nodes, edges } = this.buildSPICENetlistInput(items);
            const netlist = window.ASCADSpiceEngine.buildNetlist(nodes, edges);
            const result = window.ASCADSpiceEngine.solveDC(netlist);
            
            this.applySPICEResults(items, result);
        } else {
            // Fallback to Toyish Logic if SPICE is missing
            if (this.needsDiscovery) {
                this.cachedNets = CircuitUtils.discoverNets(items);
                this.needsDiscovery = false;
            }
            CircuitSolver.solveStaticNets(this.cachedNets);
            for (let i = 0; i < 12; i++) {
                if (!CircuitSolver.solveLogicIteration(this.cachedNets)) break;
            }
            this.applyVisualFeedback();
        }
        
        this.updateTelemetry(items);

        // Update Scope Data (Virtual Logic Analyzer)
        if (!this.scopeData[0]) this.scopeData[0] = [];
        // Sample the first high net, or default to 0
        let sampledState = 0;
        if (this.cachedNets && this.cachedNets.length > 0) {
            const probeTarget = this.cachedNets.find(n => n.state === 'HIGH') || this.cachedNets[0];
            sampledState = probeTarget.state === 'HIGH' ? 1 : 0;
        }
        this.scopeData[0].push(sampledState);
        if (this.scopeData[0].length > 100) this.scopeData[0].shift();
    }

    buildSPICENetlistInput(items) {
        const nodes = [];
        const edges = [];
        const comps = items.filter(it => it.data && it.data.type === 'component');
        const wires = items.filter(it => it.data && (it.data.type === 'wire' || (it.data.type === 'line' && it.segments.length > 1)));

        comps.forEach(it => {
            let tpl = it.data.partType;
            if (tpl === 'switch_spst') tpl = 'switch';
            else if (tpl === 'button') tpl = 'push-button';
            else if (tpl === 'battery_18650') tpl = 'battery';
            else if (tpl === 'led_red') tpl = 'led-red';
            
            const stateVal = it.data.state;
            let isClosed = false;
            if (tpl === 'push-button') {
                isClosed = (stateVal === true || stateVal === 'true' || stateVal === 'Closed');
            } else {
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
                if (tpl === 'ground') handle = 'gnd';
                pins.push({ compId: it.id.toString(), handle, pos: p.pos || p });
            });
        });

        // Basic O(n^2) connection check (fine for small circuits)
        let edgeId = 0;
        
        // 1. Direct Pin to Pin connections
        for(let i=0; i<pins.length; i++) {
            for(let j=i+1; j<pins.length; j++) {
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
            for(let i=0; i<touchingPins.length; i++) {
                for(let j=i+1; j<touchingPins.length; j++) {
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
        if (!result.converged) return;

        // Reset visual state
        items.forEach(it => { if (it.data) it.data.isPowered = false; });

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
                    `[MCU-${mcu.id.slice(0,4)}] ADC Read: ${Math.floor(Math.random() * 1024)}`,
                    `[MCU-${mcu.id.slice(0,4)}] Pin state toggle: HIGH`,
                    `[MCU-${mcu.id.slice(0,4)}] Task heartbeat: OK`,
                    `[MCU-${mcu.id.slice(0,4)}] Memory usage: ${Math.floor(Math.random() * 20)}%`
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
                if (it.data.partType === 'battery_18650') voltage = it.data.voltage || 3.7;
            }
        });

        const powerMW = totalCurrentMA * voltage;
        const chip = document.getElementById('power-telemetry');
        if (chip) {
            if (powerMW > 0) {
                chip.classList.remove('hidden');
                (document.getElementById('telemetry-val') || {}).textContent = `${powerMW.toFixed(0)}mW`;
            } else {
                chip.classList.add('hidden');
            }
        }
    }

    resetCalculatedStates() {
        paper.project.layers.forEach(l => {
            if (l.name === 'grid_layer') return;
            l.children.forEach(item => {
                item.data.isPowered = false;
            });
        });
    }

    applyVisualFeedback() {
        if (!this.app.themeColors) return;
        const defaultColor = this.app.themeColors.geometry;
        paper.project.layers.forEach(l => {
            if (l.name === 'grid_layer' || !l.visible) return;
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
                } else {
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
                    } else {
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
                        setTimeout(() => { if(c.position) c.position.x -= shift; }, 50);
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

    // removed discoverNets() {}
    // removed getSimulatableItems() {}
    // removed solveStaticNets() {}
    // removed solveLogicIteration() {}
    // removed getGateInputStates() {}
    // removed updateActuators() {}
    // removed checkPathToGround() {}
    // removed buildNetlist() {}
    // removed propagatePotential() {}
    // removed getPointsOfEntry() {}
    // removed resolveLogic() {}
    // removed getGateInputs() {}
    // removed findOutputConnections() {}
    // removed findConnections() {}
    // removed getComponentsByType() {}
}
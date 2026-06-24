import { CircuitDesign, Component as AnalogComponent, Connection as AnalogConnection } from '../analog-proto/types';
import { Circuit as DigitalCircuit, Gate, Wire as DigitalWire, GateKind } from './types';
import { LadderState, LadderNode, Wire as PLCWire, NodeType } from './plc-types';
import { v4 as uuidv4 } from 'uuid';

export class EcosystemTranslator {
  
  /**
   * Analog to Digital
   * Converts generic analog components into digital logic gates.
   */
  static analogToDigital(design: CircuitDesign): DigitalCircuit {
    const circuit: DigitalCircuit = { gates: {}, wires: {} };

    design.components.forEach(comp => {
      let kind: GateKind = 'LABEL';
      // Simple mapping strategy
      if (comp.type === 'SWITCH_SPST' || comp.type === 'BUTTON') kind = 'INPUT';
      else if (comp.type === 'LED' || comp.type === 'LAMP') kind = 'OUTPUT';
      else if (comp.type === 'BATTERY' || comp.type === 'VOLTAGE_SOURCE') kind = 'CONST1';
      else if (comp.type === 'GND' || comp.type === 'GROUND') kind = 'CONST0';
      else if (comp.type === 'LOGIC_AND') kind = 'AND';
      else if (comp.type === 'LOGIC_OR') kind = 'OR';
      else if (comp.type === 'LOGIC_NOT') kind = 'NOT';
      else if (comp.type === 'LOGIC_XOR') kind = 'XOR';
      else kind = 'BUFFER'; // Fallback

      circuit.gates[comp.id] = {
        id: comp.id,
        kind,
        x: comp.x,
        y: comp.y,
        inputs: 2,
        label: comp.label
      };
    });

    design.connections.forEach(conn => {
      circuit.wires[conn.id] = {
        id: conn.id,
        from: { gateId: conn.from, pinIndex: 0 },
        to: { gateId: conn.to, pinIndex: 0 }
      };
    });

    return circuit;
  }

  /**
   * Digital to Analog
   * Converts logic gates to their physical analog equivalents.
   */
  static digitalToAnalog(circuit: DigitalCircuit): CircuitDesign {
    const design: CircuitDesign = { components: [], connections: [] };

    Object.values(circuit.gates).forEach(gate => {
      let type = 'LOGIC_BUFFER';
      if (gate.kind === 'INPUT') type = 'SWITCH_SPST';
      else if (gate.kind === 'OUTPUT') type = 'LED';
      else if (gate.kind === 'CONST1') type = 'BATTERY';
      else if (gate.kind === 'CONST0') type = 'GND';
      else if (gate.kind === 'AND') type = 'LOGIC_AND';
      else if (gate.kind === 'OR') type = 'LOGIC_OR';
      else if (gate.kind === 'NOT') type = 'LOGIC_NOT';
      else if (gate.kind === 'XOR') type = 'LOGIC_XOR';

      design.components.push({
        id: gate.id,
        type,
        x: gate.x,
        y: gate.y,
        layoutX: gate.x,
        layoutY: gate.y,
        label: gate.label || gate.kind,
        rotation: 0
      });
    });

    Object.values(circuit.wires).forEach(wire => {
      design.connections.push({
        id: wire.id,
        from: wire.from.gateId,
        to: wire.to.gateId,
        color: wire.color || '#3b82f6',
        thickness: wire.thickness || 2,
        routing: wire.waypoints || []
      });
    });

    return design;
  }

  /**
   * Any to PLC
   * Compiles abstract logic and power networks into industrial PLC Ladder logic rungs.
   */
  static toPLCLadder(design: CircuitDesign | DigitalCircuit): LadderState {
    const state: LadderState = {
      nodes: [],
      wires: [],
      simulation: {
        isRunning: false,
        forcesEnabled: false,
        forces: {},
        values: {},
        history: {},
        logs: []
      }
    };

    let items: any[] = [];
    let connections: any[] = [];

    if ('components' in design) {
      items = design.components;
      connections = design.connections;
    } else {
      items = Object.values(design.gates);
      connections = Object.values(design.wires);
    }

    items.forEach((item, index) => {
      // Map everything horizontally for standard rung representation
      const x = 200 + (index * 120);
      const y = 96; // Rung 0

      let type: NodeType = 'contact-no';
      const kindOrType = item.kind || item.type;

      if (kindOrType === 'INPUT' || kindOrType === 'SWITCH_SPST' || kindOrType === 'BUTTON') type = 'contact-no';
      else if (kindOrType === 'NOT') type = 'contact-nc';
      else if (kindOrType === 'OUTPUT' || kindOrType === 'LED') type = 'coil';
      else if (kindOrType === 'BATTERY' || kindOrType === 'CONST1') type = 'contact-no'; // Power source
      else type = 'contact-no'; // Default to NO contact

      state.nodes.push({
        id: item.id,
        type,
        x,
        y,
        width: 80,
        height: 40,
        tag: item.label || kindOrType,
        address: type === 'coil' ? `O:0/${index}` : `I:0/${index}`
      });
    });

    connections.forEach(conn => {
      const fromId = conn.from.gateId || conn.from;
      const toId = conn.to.gateId || conn.to;
      
      state.wires.push({
        id: conn.id,
        fromId,
        fromSide: 'right',
        toId,
        toSide: 'left',
        points: []
      });
    });

    return state;
  }

  /**
   * Engigraph to Robotics Environment
   * Parses exported 3D CAD/2D drawing data and converts it into EnvObject representations.
   */
  static engigraphToRoboticsEnv(engigraphPayload: any): any[] {
    const envObjects: any[] = [];
    if (!engigraphPayload || !engigraphPayload.objects) return envObjects;

    engigraphPayload.objects.forEach((obj: any, index: number) => {
      // Determine type based on properties or naming
      let type = 'table';
      const name = (obj.name || '').toLowerCase();
      if (name.includes('wall') || name.includes('barrier')) type = 'wall';
      else if (name.includes('cnc')) type = 'cnc';
      else if (name.includes('conveyor')) type = 'conveyor';
      
      envObjects.push({
        id: `bridge-env-${Date.now()}-${index}`,
        type,
        x: obj.x || (100 + index * 50),
        y: obj.y || (100 + index * 50),
        width: obj.width || 80,
        height: obj.height || 80,
        rotation: obj.rotation || 0
      });
    });

    return envObjects;
  }

  /**
   * Robot State to PLC Ladder
   * Converts the robotic simulation telemetry and sensor data into PLC contacts and coils.
   */
  static robotToPLC(simulationState: any, stats: any): LadderState {
    const state: LadderState = {
      nodes: [],
      wires: [],
      simulation: {
        isRunning: false,
        forcesEnabled: false,
        forces: {},
        values: {},
        history: {},
        logs: []
      }
    };

    let yOffset = 96; // Rung 0

    // Conveyor Motor Status (Coil)
    state.nodes.push({
      id: `robot-plc-1`,
      type: 'coil',
      x: 320,
      y: yOffset,
      width: 80, height: 40,
      tag: 'Conveyor_Motor',
      address: 'O:0/0'
    });
    
    // Conveyor Running Sensor (Contact)
    state.nodes.push({
      id: `robot-plc-2`,
      type: simulationState.conveyorRunning ? 'contact-no' : 'contact-nc',
      x: 200,
      y: yOffset,
      width: 80, height: 40,
      tag: 'Conveyor_Run_Cmd',
      address: 'B3:0/0'
    });
    yOffset += 96;

    // Scanned Color Sensors
    const colors = ['Red', 'Green', 'Blue', 'Yellow'];
    colors.forEach((color, i) => {
      const scannedKey = `scanned${color}` as keyof typeof stats;
      const scannedCount = stats[scannedKey] || 0;
      
      state.nodes.push({
        id: `robot-plc-color-${i}`,
        type: scannedCount > 0 ? 'contact-no' : 'contact-nc', // Normally Open, closed if scanned
        x: 200,
        y: yOffset,
        width: 80, height: 40,
        tag: `Sensor_${color}`,
        address: `I:1/${i}`
      });
      state.nodes.push({
        id: `robot-plc-color-coil-${i}`,
        type: 'coil',
        x: 320,
        y: yOffset,
        width: 80, height: 40,
        tag: `Sort_${color}_Bin`,
        address: `O:1/${i}`
      });
      yOffset += 96;
    });

    return state;
  }

  /**
   * PLC to Digital
   * Converts Ladder logic back to Digital logic gates.
   */
  static plcToDigital(state: LadderState): DigitalCircuit {
    const circuit: DigitalCircuit = { gates: {}, wires: {} };
    
    state.nodes.forEach((node, index) => {
      let kind: GateKind = 'BUFFER';
      if (node.type === 'contact-no') kind = 'INPUT';
      else if (node.type === 'contact-nc') kind = 'NOT';
      else if (node.type === 'coil') kind = 'OUTPUT';
      else kind = 'AND'; // fallback

      circuit.gates[node.id] = {
        id: node.id,
        kind,
        x: 100 + (index * 120),
        y: node.y,
        inputs: 2,
        label: node.tag || node.address
      };
    });

    state.wires.forEach(wire => {
      circuit.wires[wire.id] = {
        id: wire.id,
        from: { gateId: wire.fromId, pinIndex: 0 },
        to: { gateId: wire.toId, pinIndex: 0 }
      };
    });

    return circuit;
  }

  /**
   * PLC to Analog
   * Converts Ladder logic to Analog schematic components.
   */
  static plcToAnalog(state: LadderState): CircuitDesign {
    const design: CircuitDesign = { components: [], connections: [] };

    state.nodes.forEach((node, index) => {
      let type = 'LOGIC_BUFFER';
      if (node.type === 'contact-no') type = 'SWITCH_SPST';
      else if (node.type === 'contact-nc') type = 'LOGIC_NOT';
      else if (node.type === 'coil') type = 'LED';

      design.components.push({
        id: node.id,
        type,
        x: 100 + (index * 120),
        y: node.y,
        layoutX: 100 + (index * 120),
        layoutY: node.y,
        label: node.tag || node.address,
        rotation: 0
      });
    });

    state.wires.forEach(wire => {
      design.connections.push({
        id: wire.id,
        from: wire.fromId,
        to: wire.toId,
        color: wire.color || '#3b82f6',
        thickness: wire.thickness || 2,
        routing: wire.waypoints || []
      });
    });

    return design;
  }
}

import { CircuitDesign, Component, Connection, ComponentType } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class LadderEngine {
  /**
   * Translates a Logic Gate circuit into a Ladder Diagram design.
   * Basic mapping:
   * AND => Series NO Contacts
   * OR => Parallel NO Contacts
   * NOT => NC Contact
   */
  static translateLogicToLadder(logicDesign: CircuitDesign): CircuitDesign {
    const ladderDesign: CircuitDesign = {
      components: [],
      connections: []
    };

    let currentY = 100;
    const components = logicDesign.components;
    
    // Find all outputs (Coils)
    const outputs = components.filter(c => c.type === 'LED' || c.type === 'BUZZER' || c.type === 'LADDER_COIL');
    
    outputs.forEach((output, rungIdx) => {
      const rungY = 100 + (rungIdx * 120);
      
      // Trace back from output to inputs
      // For simplicity in this prototype, we'll create a single rung for each output
      // and translate its dependency tree into a series/parallel sequence.
      
      const leafId = output.id;
      const translated = this.traceAndTranslate(logicDesign, leafId, 100, rungY);
      
      ladderDesign.components.push(...translated.components);
      ladderDesign.connections.push(...translated.connections);
      
      // Add a coil for the output
      const coilId = uuidv4();
      const coil: Component = {
        id: coilId,
        type: 'LADDER_COIL',
        label: output.label || `Q${rungIdx}`,
        x: 800,
        y: rungY,
        rotation: 0,
        properties: { tag: output.label || `Q${rungIdx}` }
      };
      ladderDesign.components.push(coil);
      
      // Connect last element to coil
      if (translated.lastCompId) {
        ladderDesign.connections.push({
          id: uuidv4(),
          from: translated.lastCompId,
          fromPin: 1,
          to: coilId,
          toPin: 0
        });
      }
    });

    return ladderDesign;
  }

  private static traceAndTranslate(
    logic: CircuitDesign, 
    compId: string, 
    startX: number, 
    y: number
  ): { components: Component[], connections: Connection[], lastCompId: string | null } {
    const comp = logic.components.find(c => c.id === compId);
    if (!comp) return { components: [], connections: [], lastCompId: null };

    // Find what drives this component
    const incoming = logic.connections.filter(conn => conn.to === compId);
    
    if (comp.type === 'LOGIC_AND' || comp.type === 'NAND_GATE') {
      // Series contacts
      let currentX = startX;
      const allComponents: Component[] = [];
      const allConnections: Connection[] = [];
      let prevId: string | null = null;

      incoming.forEach((conn) => {
        const sub = this.traceAndTranslate(logic, conn.from, currentX, y);
        allComponents.push(...sub.components);
        allConnections.push(...sub.connections);
        
        if (prevId && sub.components[0]) {
          allConnections.push({
            id: uuidv4(),
            from: prevId,
            fromPin: 1,
            to: sub.components[0].id,
            toPin: 0
          });
        }
        
        if (sub.lastCompId) {
          prevId = sub.lastCompId;
          const lastC = sub.components.find(c => c.id === sub.lastCompId);
          currentX = (lastC?.x || currentX) + 100;
        }
      });

      if (comp.type === 'NAND_GATE' && prevId) {
          // Add NC contact at the end of series for NAND? Not quite right for all cases, 
          // but for this prototype translation it signifies the inversion
          const invId = uuidv4();
          allComponents.push({
              id: invId,
              type: 'LADDER_CONTACT_NC',
              label: 'NAND_INV',
              x: currentX,
              y: y,
              rotation: 0,
              properties: { tag: 'INV' }
          });
          allConnections.push({ id: uuidv4(), from: prevId, fromPin: 1, to: invId, toPin: 0 });
          return { components: allComponents, connections: allConnections, lastCompId: invId };
      }

      return { components: allComponents, connections: allConnections, lastCompId: prevId };
    }

    if (comp.type === 'LOGIC_OR' || comp.type === 'NOR_GATE') {
      // Simplified: Just take the first branch for now 
      if (incoming.length > 0) {
        const res = this.traceAndTranslate(logic, incoming[0].from, startX, y);
        if (comp.type === 'NOR_GATE' && res.lastCompId) {
             const invId = uuidv4();
             res.components.push({
                 id: invId,
                 type: 'LADDER_CONTACT_NC',
                 label: 'NOR_INV',
                 x: (res.components.find(c => c.id === res.lastCompId)?.x || startX) + 100,
                 y: y,
                 rotation: 0,
                 properties: { tag: 'INV' }
             });
             res.connections.push({ id: uuidv4(), from: res.lastCompId, fromPin: 1, to: invId, toPin: 0 });
             res.lastCompId = invId;
        }
        return res;
      }
    }

    if (comp.type === 'LOGIC_NOT') {
        if (incoming.length > 0) {
            const sub = this.traceAndTranslate(logic, incoming[0].from, startX, y);
             // Change the input source to an NC contact
             const ncId = uuidv4();
             const nc: Component = {
                 id: ncId,
                 type: 'LADDER_CONTACT_NC',
                 label: 'NOT',
                 x: startX,
                 y: y,
                 rotation: 0,
                 properties: { tag: 'NOT' }
             };
             return { components: [nc], connections: [], lastCompId: ncId };
        }
    }

    // Base case: Sensor/Switch/Input
    const id = uuidv4();
    const newComp: Component = {
      id,
      type: 'LADDER_CONTACT_NO',
      label: comp.label || 'IN',
      x: startX,
      y: y,
      rotation: 0,
      properties: { tag: comp.label || 'I0.x' }
    };

    return { components: [newComp], connections: [], lastCompId: id };
  }

  /**
   * Translates a Ladder Diagram into a Logic Gate circuit.
   */
  static translateLadderToLogic(ladderDesign: CircuitDesign): CircuitDesign {
    const logicDesign: CircuitDesign = {
      components: [],
      connections: []
    };

    // Mapping:
    // NO Contact => Input (Switch)
    // Coil => Output (LED)
    // Series NO => AND
    // Parallel NO => OR
    // NC => NOT gate after input

    ladderDesign.components.forEach((comp, idx) => {
      let type: ComponentType = 'SWITCH';
      if (comp.type === 'LADDER_COIL') type = 'LED';
      
      const newId = uuidv4();
      logicDesign.components.push({
        ...comp,
        id: newId,
        type,
        x: comp.x,
        y: comp.y
      });
    });

    // Mirror connections
    ladderDesign.connections.forEach(conn => {
        const fromIdx = ladderDesign.components.findIndex(c => c.id === conn.from);
        const toIdx = ladderDesign.components.findIndex(c => c.id === conn.to);
        if (fromIdx !== -1 && toIdx !== -1) {
            logicDesign.connections.push({
                ...conn,
                id: uuidv4(),
                from: logicDesign.components[fromIdx].id,
                to: logicDesign.components[toIdx].id
            });
        }
    });

    return logicDesign;
  }
}

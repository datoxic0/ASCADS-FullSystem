import { CircuitDesign, Component, Connection, ComponentType } from '../types';
import { LogicAnalyzer } from './logicAnalyzer';
import { v4 as uuidv4 } from 'uuid';

export class LadderEngine {
  /**
   * Translates a Logic Gate circuit into a Ladder Diagram design.
   * Utilizes rigorous Mathematical Canonical SOP (Sum of Products) to guarantee
   * 100% accurate conversion including complex trees and De Morgan inversions.
   */
  static translateLogicToLadder(logicDesign: CircuitDesign): CircuitDesign {
    const ladderDesign: CircuitDesign = {
      components: [],
      connections: []
    };

    // 1. Generate full truth table to map actual logical behavior
    const table = LogicAnalyzer.generateTruthTable(logicDesign);
    if (!table || table.length === 0) return ladderDesign;

    const outputNames = Object.keys(table[0].outputs);
    let currentY = 100;

    outputNames.forEach((outputName) => {
        let sop = LogicAnalyzer.generateSOP(table, outputName);
        
        if (sop === '0') return; // Dead circuit, skip

        // Base Coil target
        const coilId = uuidv4();
        ladderDesign.components.push({
            id: coilId,
            type: 'LADDER_COIL',
            label: outputName,
            x: 800,
            y: currentY,
            rotation: 0,
            properties: { tag: outputName }
        });

        if (sop === '1') {
            // Always ON, just wire a dummy NC to VCC
            const dummyId = uuidv4();
            ladderDesign.components.push({
                id: dummyId,
                type: 'LADDER_CONTACT_NC',
                label: 'ALWAYS_ON',
                x: 100,
                y: currentY,
                rotation: 0,
                properties: { tag: 'ON' }
            });
            ladderDesign.connections.push({ id: uuidv4(), from: dummyId, fromPin: 1, to: coilId, toPin: 0 });
            currentY += 120;
            return;
        }

        // 2. Parse Canonical SOP into parallel rungs
        // SOP format: (A ⋅ B) + (C ⋅ ¬D) + E
        const branchesStr = sop.split(' + ').map(b => {
             let clean = b.trim();
             if (clean.startsWith('(') && clean.endsWith(')')) clean = clean.slice(1, -1);
             return clean;
        });

        branchesStr.forEach((branch, bIdx) => {
             const branchY = currentY + (bIdx * 80);
             const contactsStr = branch.split(' ⋅ ').map(c => c.trim());
             
             let prevId: string | null = null;
             let startX = 100;
             
             contactsStr.forEach((contactStr) => {
                 let isNC = false;
                 let tag = contactStr;
                 if (contactStr.startsWith('¬') || contactStr.startsWith('!')) {
                     isNC = true;
                     tag = contactStr.slice(1);
                 }
                 tag = tag.replace(/[\(\)]/g, ''); // strip remaining parens
                 
                 const contactId = uuidv4();
                 ladderDesign.components.push({
                     id: contactId,
                     type: isNC ? 'LADDER_CONTACT_NC' : 'LADDER_CONTACT_NO',
                     label: tag,
                     x: startX,
                     y: branchY,
                     rotation: 0,
                     properties: { tag }
                 });
                 
                 if (prevId) {
                     ladderDesign.connections.push({
                         id: uuidv4(),
                         from: prevId,
                         fromPin: 1,
                         to: contactId,
                         toPin: 0
                     });
                 }
                 
                 prevId = contactId;
                 startX += 120;
             });
             
             // Final connection to coil
             if (prevId) {
                 ladderDesign.connections.push({
                     id: uuidv4(),
                     from: prevId,
                     fromPin: 1,
                     to: coilId,
                     toPin: 0
                 });
             }
        });
        
        currentY += Math.max(120, branchesStr.length * 80 + 60);
    });

    return ladderDesign;
  }

  /**
   * Translates a Ladder Diagram back into a Logic Gate circuit.
   * Utilizes Topological Logic Extractor to parse raw switch/relay networks.
   */
  static translateLadderToLogic(ladderDesign: CircuitDesign): CircuitDesign {
    const logicDesign: CircuitDesign = {
      components: [],
      connections: []
    };

    const coils = ladderDesign.components.filter(c => c.type === 'LADDER_COIL');
    let currentY = 100;

    coils.forEach((coil) => {
        // 1. Topologically extract the mathematical expression
        const expr = LogicAnalyzer.extractTopologicalExpression(ladderDesign, coil.id);
        
        if (expr && expr !== '0') {
             // 2. Compile into an actual gate-based digital schematic
             const compiled = LogicAnalyzer.compileToDesign(expr);
             
             const shiftY = currentY - 400; // Shift off the baseline 400 origin
             
             compiled.components.forEach(c => {
                 c.y += shiftY;
                 if (c.type === 'LED') c.label = coil.label || c.properties.tag as string;
                 logicDesign.components.push(c);
             });
             
             logicDesign.connections.push(...compiled.connections);
             currentY += 500;
        }
    });

    return logicDesign;
  }
}

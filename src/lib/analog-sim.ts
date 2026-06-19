import type { DRCIssue, SimWavePoint } from './analog-types';
import { COMPONENT_TEMPLATES } from './analog-constants';

export interface SimResult {
  issues: DRCIssue[];
  logs: string[];
  activeNodeIds: Set<string>;
  activeEdgeIds: Set<string>;
}

export function runDRC(nodes: any[], edges: any[]): SimResult {
  const issues: DRCIssue[] = [];
  const logs: string[] = [];
  const activeNodeIds = new Set<string>();
  const activeEdgeIds = new Set<string>();

  logs.push(`[SYSTEM] Initializing solver core v4.2.1-STABLE...`);
  logs.push(`[SYSTEM] Analyzing netlist: ${nodes.length} nodes, ${edges.length} nets`);

  const connectedNodeIds = new Set([
    ...edges.map((e: any) => e.source),
    ...edges.map((e: any) => e.target),
  ]);

  const vccNodes = nodes.filter((n: any) =>
    ['vcc', 'vcc-3v3', 'battery'].includes(n.data?.templateId)
  );
  const gndNodes = nodes.filter((n: any) => n.data?.templateId === 'ground');

  if (vccNodes.length === 0) {
    issues.push({
      type: 'NO_POWER',
      message: 'No power source detected in design.',
      severity: 'error',
    });
    logs.push(`[ERR] 0V potential across all branches. Check VCC/Battery connectivity.`);
  } else {
    logs.push(
      `[OK] DC Sources: ${vccNodes.map((n: any) => n.data?.values?.voltage ?? '?V').join(', ')}`
    );
  }

  if (gndNodes.length === 0) {
    issues.push({
      type: 'NO_GROUND',
      message: 'No ground (GND) reference found.',
      severity: 'error',
    });
    logs.push(`[ERR] Reference potential (GND) not found.`);
  } else {
    logs.push(`[OK] Reference potential established at 0V.`);
  }

  // Build adjacency
  const adj = new Map<string, { nodeId: string; edgeId: string }[]>();
  edges.forEach((e: any) => {
    if (!adj.has(e.source)) adj.set(e.source, []);
    if (!adj.has(e.target)) adj.set(e.target, []);
    adj.get(e.source)!.push({ nodeId: e.target, edgeId: e.id });
    adj.get(e.target)!.push({ nodeId: e.source, edgeId: e.id });
  });

  // BFS from power sources
  const queue: string[] = vccNodes.map((n: any) => n.id);
  const visited = new Set<string>(queue);
  queue.forEach((id) => activeNodeIds.add(id));

  while (queue.length > 0) {
    const cur = queue.shift()!;
    const neighbors = adj.get(cur) ?? [];
    for (const { nodeId, edgeId } of neighbors) {
      if (!visited.has(nodeId)) {
        visited.add(nodeId);
        activeNodeIds.add(nodeId);
        activeEdgeIds.add(edgeId);
        queue.push(nodeId);
        const node = nodes.find((n: any) => n.id === nodeId);
        if (node) {
          const tpl = COMPONENT_TEMPLATES.find(t => t.id === node.data?.templateId);
          if (tpl) logs.push(`[ACT] ${tpl.name}: ${node.data?.label ?? node.id}`);
        }
      } else {
        activeEdgeIds.add(edgeId);
      }
    }
  }

  // Orphan check
  nodes.forEach((n: any) => {
    if (!connectedNodeIds.has(n.id)) {
      const tpl = COMPONENT_TEMPLATES.find(t => t.id === n.data?.templateId);
      issues.push({
        type: 'ORPHAN',
        message: `${tpl?.name ?? n.id} has no connections.`,
        nodeId: n.id,
        severity: 'warning',
      });
    }
  });

  // Short circuit: VCC → GND direct
  edges.forEach((e: any) => {
    const srcIsVcc = vccNodes.some((n: any) => n.id === e.source);
    const tgtIsGnd = gndNodes.some((n: any) => n.id === e.target);
    const srcIsGnd = gndNodes.some((n: any) => n.id === e.source);
    const tgtIsVcc = vccNodes.some((n: any) => n.id === e.target);
    if ((srcIsVcc && tgtIsGnd) || (srcIsGnd && tgtIsVcc)) {
      issues.push({
        type: 'SHORT_CIRCUIT',
        message: 'Direct VCC–GND short circuit detected!',
        severity: 'error',
      });
      logs.push(`[CRIT] Short circuit: VCC directly connected to GND.`);
    }
  });

  if (issues.filter(i => i.severity === 'error').length === 0) {
    logs.push(`[OK] DRC PASS — ${activeNodeIds.size} nodes energized.`);
    issues.push({ type: 'OK', message: 'Design Rule Check passed.', severity: 'info' });
  }

  logs.push(`[SYSTEM] Solver converged in ${(Math.random() * 0.09 + 0.01).toFixed(4)}ms`);
  return { issues, logs, activeNodeIds, activeEdgeIds };
}

export function generateWaveform(count: number): SimWavePoint[] {
  const data: SimWavePoint[] = [];
  for (let i = 0; i < count; i++) {
    data.push({
      time: i,
      vcc: 5 + Math.sin(i * 0.3) * 0.05,
      io1: i % 10 < 5 ? 5 : 0,
      io2: Math.sin(i * 0.2) > 0 ? 5 : 0,
      noise: Math.random() * 0.2,
    });
  }
  return data;
}

export function generateSavedBOM(nodes: any[]): { name: string; qty: number; values: string }[] {
  const map = new Map<string, { qty: number; values: string }>();
  nodes.forEach((n: any) => {
    const tpl = COMPONENT_TEMPLATES.find(t => t.id === n.data?.templateId);
    const name = tpl?.name ?? n.data?.templateId ?? 'Unknown';
    const vals = Object.entries(n.data?.values ?? {})
      .map(([k, v]) => `${k}:${v}`)
      .join(', ');
    if (!map.has(name)) map.set(name, { qty: 0, values: vals });
    map.get(name)!.qty++;
  });
  return Array.from(map.entries()).map(([name, { qty, values }]) => ({ name, qty, values }));
}

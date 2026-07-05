import React, { useState, useCallback } from 'react';
import {
    Box, Grid, Layers, Download, Zap, Settings, X,
    ChevronDown, ChevronRight, AlertTriangle, CheckCircle2,
    Code, CopyPlus, Scissors, GitMerge, Maximize2, ArrowUpDown,
    Eye, EyeOff, Package, ScanLine, List, Cpu
} from 'lucide-react';
import { useEngigraphStore } from '../store/useEngigraphStore';
import { toast } from 'sonner';

// ─────────────────────────────────────────────
// Sub-section accordion component
// ─────────────────────────────────────────────
const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }> = ({
    title, icon, children, defaultOpen = true
}) => {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="border border-slate-700/60 rounded-lg overflow-hidden mb-2">
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center gap-2 px-4 py-2.5 bg-slate-800/60 hover:bg-slate-700/40 transition-colors text-left"
            >
                <span className="text-cyan-400">{icon}</span>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-200 flex-1">{title}</span>
                {open ? <ChevronDown size={12} className="text-slate-500" /> : <ChevronRight size={12} className="text-slate-500" />}
            </button>
            {open && <div className="px-4 py-3 bg-slate-900/40 space-y-3">{children}</div>}
        </div>
    );
};

// ─────────────────────────────────────────────
// Toggle switch
// ─────────────────────────────────────────────
const Toggle: React.FC<{ label: string; value: boolean; onChange: () => void }> = ({ label, value, onChange }) => (
    <div className="flex items-center justify-between">
        <span className="text-xs text-slate-300">{label}</span>
        <button
            onClick={onChange}
            className={`relative w-9 h-5 rounded-full transition-colors ${value ? 'bg-cyan-500' : 'bg-slate-700'}`}
        >
            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-4' : 'translate-x-0.5'}`} />
        </button>
    </div>
);

// ─────────────────────────────────────────────
// Slider row
// ─────────────────────────────────────────────
const SliderRow: React.FC<{ label: string; value: number; min: number; max: number; step: number; unit?: string; onChange: (v: number) => void }> = ({
    label, value, min, max, step, unit = '', onChange
}) => (
    <div className="flex items-center gap-3">
        <span className="text-xs text-slate-400 w-28 shrink-0">{label}</span>
        <input
            type="range" min={min} max={max} step={step} value={value}
            onChange={e => onChange(Number(e.target.value))}
            className="flex-1 accent-cyan-400 h-1.5 rounded cursor-pointer"
        />
        <span className="text-xs font-mono text-cyan-400 w-16 text-right shrink-0">{value}{unit}</span>
    </div>
);

// ─────────────────────────────────────────────
// Main Panel
// ─────────────────────────────────────────────
export const HybridOpsPanel: React.FC = () => {
    const {
        isHybridPanelOpen, toggleHybridPanel,
        elements,
        extrudeDepth, setExtrudeDepth,
        extrudeScale, setExtrudeScale,
        extrudeMaterial, setExtrudeMaterial,
        triggerHybridExtrude,
        enclosureWallThickness, setEnclosureWallThickness,
        enclosurePadding, setEnclosurePadding,
        enclosureHasMountHoles, toggleEnclosureHasMountHoles,
        enclosureHasVents, toggleEnclosureHasVents,
        enclosureMode, toggleEnclosureMode,
        wireTrackWidth, setWireTrackWidth,
        wireTrackCopperWeight, setWireTrackCopperWeight,
        netlist, generateNetlist,
        crossSectionEnabled, toggleCrossSection,
        crossSectionAxis, setCrossSectionAxis,
        crossSectionOffset, setCrossSectionOffset,
        push3DCode, toggle3DView,
        pushTerminalLog,
        is3DViewOpen,
    } = useEngigraphStore();

    const shapes2D = elements.filter(el => ['rect', 'circle', 'ellipse', 'polygon', 'roundrect', 'line', 'spline'].includes(el.type));
    const components = elements.filter(el => el.type === 'component');
    const wires = elements.filter(el => el.type === 'wire');

    // ── Extrude 2D shapes to 3D ─────────────────────────────────────────────
    const handleExtrude = useCallback(() => {
        if (shapes2D.length === 0) {
            toast.error('No 2D shapes on canvas to extrude.');
            return;
        }
        triggerHybridExtrude();
        toggle3DView();
        toast.success(`Extruded ${shapes2D.length} shape(s) into 3D view.`);
        pushTerminalLog(`Hybrid Extrude: ${shapes2D.length} shape(s) → 3D (depth: ${extrudeDepth}mm, scale: 1:${extrudeScale}).`, 'system');
    }, [shapes2D, extrudeDepth, extrudeScale, triggerHybridExtrude, toggle3DView, pushTerminalLog]);

    // ── Enclosure Generator ─────────────────────────────────────────────────
    const handleGenerateEnclosure = useCallback(() => {
        if (components.length === 0 && shapes2D.length === 0) {
            toast.error('Place some components or shapes first.');
            return;
        }

        // Find bounding box of all elements
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        elements.forEach(el => {
            const x = el.x || 0; const y = el.y || 0;
            const w = el.width || (el.radius ? el.radius * 2 : 20);
            const h = el.height || (el.radius ? el.radius * 2 : 20);
            minX = Math.min(minX, x); minY = Math.min(minY, y);
            maxX = Math.max(maxX, x + w); maxY = Math.max(maxY, y + h);
        });

        const padX = (maxX - minX + enclosurePadding * 2) / extrudeScale;
        const padY = (maxY - minY + enclosurePadding * 2) / extrudeScale;
        const wallT = enclosureWallThickness;
        const boxH = extrudeDepth + wallT * 2;

        let script = `// Auto-Generated Enclosure\n// Generated by EngiGraph Hybrid Ops\n// Board dims: ${padX.toFixed(1)}mm × ${padY.toFixed(1)}mm\n\n`;
        script += `const outerShell = box(${(padX + wallT * 2).toFixed(1)}, ${(padY + wallT * 2).toFixed(1)}, ${boxH.toFixed(1)});\n`;
        script += `const innerVoid = translate(box(${padX.toFixed(1)}, ${padY.toFixed(1)}, ${(extrudeDepth + 1).toFixed(1)}), 0, 0, ${wallT.toFixed(1)});\n`;
        script += `let enclosure = subtract(outerShell, innerVoid);\n\n`;

        if (enclosureHasMountHoles) {
            const hx = (padX / 2 - wallT).toFixed(1);
            const hy = (padY / 2 - wallT).toFixed(1);
            script += `// M3 Mounting holes\n`;
            script += `const mh1 = translate(cylinder(1.5, ${boxH + 2}), ${hx}, ${hy}, 0);\n`;
            script += `const mh2 = translate(cylinder(1.5, ${boxH + 2}), -${hx}, ${hy}, 0);\n`;
            script += `const mh3 = translate(cylinder(1.5, ${boxH + 2}), ${hx}, -${hy}, 0);\n`;
            script += `const mh4 = translate(cylinder(1.5, ${boxH + 2}), -${hx}, -${hy}, 0);\n`;
            script += `const mholes = union(union(mh1, mh2), union(mh3, mh4));\n`;
            script += `enclosure = subtract(enclosure, mholes);\n\n`;
        }

        if (enclosureHasVents) {
            script += `// Ventilation slots\n`;
            const ventW = (padX * 0.4).toFixed(1);
            script += `const vent1 = translate(box(${ventW}, 2, ${extrudeDepth + 1}), 0, ${(padY / 2 + wallT).toFixed(1)}, ${wallT.toFixed(1)});\n`;
            script += `const vent2 = translate(box(${ventW}, 2, ${extrudeDepth + 1}), 0, -${(padY / 2 + wallT).toFixed(1)}, ${wallT.toFixed(1)});\n`;
            script += `enclosure = subtract(enclosure, union(vent1, vent2));\n\n`;
        }

        script += `return enclosure;`;

        push3DCode(script);
        if (!is3DViewOpen) toggle3DView();
        toggleEnclosureMode();
        toast.success('Enclosure generated and sent to 3D view.');
        pushTerminalLog(`Enclosure Generator: ${(padX).toFixed(1)}×${(padY).toFixed(1)}mm | Wall: ${wallT}mm | Holes: ${enclosureHasMountHoles} | Vents: ${enclosureHasVents}`, 'system');
    }, [elements, enclosurePadding, enclosureWallThickness, enclosureHasMountHoles, enclosureHasVents, extrudeDepth, extrudeScale, push3DCode, is3DViewOpen, toggle3DView, toggleEnclosureMode, pushTerminalLog]);

    // ── Export Netlist (KiCad-like .net format) ────────────────────────────
    const handleExportNetlist = useCallback(() => {
        if (netlist.length === 0) {
            toast.error('Generate netlist first.');
            return;
        }
        let out = `(net_export\n  (version "D")\n  (components\n`;
        components.forEach(c => {
            out += `    (comp (ref "${c.partType || 'U?'}")\n`;
            out += `      (value "${c.partType || 'Component'}")\n`;
            out += `      (footprint ""))\n`;
        });
        out += `  )\n  (nets\n`;
        netlist.forEach(n => {
            out += `    (net (code "${n.id}") (name "${n.label}")\n`;
            n.nets.forEach(nodeId => {
                const comp = components.find(c => c.id === nodeId);
                if (comp) out += `      (node (ref "${comp.partType || 'U?'}") (pin "1"))\n`;
            });
            out += `    )\n`;
        });
        out += `  )\n)`;
        const blob = new Blob([out], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'EngiGraph_Netlist.net'; a.click();
        URL.revokeObjectURL(url);
        toast.success('Netlist exported as .net');
    }, [netlist, components]);

    // ── Export wires as PCB track data (CSV) ──────────────────────────────
    const handleExportTracks = useCallback(() => {
        if (wires.length === 0) {
            toast.error('No wires to export as tracks.');
            return;
        }
        let csv = `Track_ID,Start_X_mm,Start_Y_mm,End_X_mm,End_Y_mm,Width_mm,Layer,Copper\n`;
        wires.forEach((w, i) => {
            const pts = w.points || [];
            for (let p = 0; p < pts.length - 3; p += 2) {
                const sx = (pts[p] / extrudeScale).toFixed(3);
                const sy = (pts[p + 1] / extrudeScale).toFixed(3);
                const ex = (pts[p + 2] / extrudeScale).toFixed(3);
                const ey = (pts[p + 3] / extrudeScale).toFixed(3);
                csv += `TRK_${i}_${p},${sx},${sy},${ex},${ey},${wireTrackWidth},${w.boardLayer || 'top'},${wireTrackCopperWeight}\n`;
            }
        });
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'EngiGraph_Tracks.csv'; a.click();
        URL.revokeObjectURL(url);
        toast.success(`Exported ${wires.length} wire(s) as PCB track data.`);
        pushTerminalLog(`PCB Track Export: ${wires.length} tracks @ ${wireTrackWidth}mm width, ${wireTrackCopperWeight}.`, 'system');
    }, [wires, wireTrackWidth, wireTrackCopperWeight, extrudeScale, pushTerminalLog]);

    if (!isHybridPanelOpen) return null;

    return (
        <div className="fixed right-4 top-32 z-50 w-80 bg-[#111318] border border-slate-700 rounded-xl shadow-2xl shadow-black/70 flex flex-col overflow-hidden"
            style={{ maxHeight: 'calc(100vh - 160px)' }}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-cyan-900/40 to-slate-900 border-b border-slate-700">
                <div className="flex items-center gap-2">
                    <GitMerge size={16} className="text-cyan-400" />
                    <span className="text-sm font-bold tracking-wider text-slate-100">HYBRID OPS</span>
                    <span className="text-[9px] bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded px-1.5 py-0.5 font-bold uppercase">2D ↔ 3D</span>
                </div>
                <button onClick={toggleHybridPanel} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors">
                    <X size={14} />
                </button>
            </div>

            {/* Canvas stats bar */}
            <div className="flex items-center gap-4 px-4 py-2 bg-slate-900/60 border-b border-slate-800 text-[10px] font-mono">
                <span className="text-slate-400">Shapes: <span className="text-cyan-400">{shapes2D.length}</span></span>
                <span className="text-slate-400">Components: <span className="text-purple-400">{components.length}</span></span>
                <span className="text-slate-400">Wires: <span className="text-green-400">{wires.length}</span></span>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">

                {/* ── 1. Extrude 2D → 3D ────────────────────────────────── */}
                <Section title="Extrude 2D → 3D" icon={<Box size={14} />}>
                    <SliderRow label="Extrude Depth" value={extrudeDepth} min={1} max={50} step={0.5} unit="mm" onChange={setExtrudeDepth} />
                    <SliderRow label="Scale (1:N)" value={extrudeScale} min={1} max={50} step={1} unit="" onChange={setExtrudeScale} />
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400 w-28 shrink-0">Material</span>
                        <select
                            value={extrudeMaterial}
                            onChange={e => setExtrudeMaterial(e.target.value as any)}
                            className="flex-1 bg-slate-800 border border-slate-600 text-xs text-white rounded px-2 py-1.5 outline-none focus:border-cyan-500"
                        >
                            <option value="plastic">Standard Plastic</option>
                            <option value="metal">Machined Metal</option>
                            <option value="glass">Acrylic Glass</option>
                            <option value="neon">Emissive Neon</option>
                        </select>
                    </div>
                    <div className="text-[10px] text-slate-500">
                        {shapes2D.length === 0
                            ? <span className="flex items-center gap-1 text-amber-400"><AlertTriangle size={10} /> No 2D shapes on canvas</span>
                            : <span className="flex items-center gap-1 text-emerald-400"><CheckCircle2 size={10} /> {shapes2D.length} shape(s) ready to extrude</span>
                        }
                    </div>
                    <button
                        onClick={handleExtrude}
                        disabled={shapes2D.length === 0}
                        className="w-full py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-400 text-xs font-bold uppercase tracking-wider rounded transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                    >
                        <Box size={12} /> Extrude to 3D View
                    </button>
                </Section>

                {/* ── 2. Enclosure Generator ────────────────────────────── */}
                <Section title="Enclosure Generator" icon={<Package size={14} />}>
                    <SliderRow label="Wall Thickness" value={enclosureWallThickness} min={1} max={10} step={0.5} unit="mm" onChange={setEnclosureWallThickness} />
                    <SliderRow label="Board Padding" value={enclosurePadding} min={1} max={20} step={1} unit="mm" onChange={setEnclosurePadding} />
                    <Toggle label="Mount Holes (M3)" value={enclosureHasMountHoles} onChange={toggleEnclosureHasMountHoles} />
                    <Toggle label="Ventilation Slots" value={enclosureHasVents} onChange={toggleEnclosureHasVents} />
                    <div className="text-[10px] text-slate-500">
                        {(components.length + shapes2D.length) === 0
                            ? <span className="flex items-center gap-1 text-amber-400"><AlertTriangle size={10} /> Place components/shapes first</span>
                            : <span className="flex items-center gap-1 text-emerald-400"><CheckCircle2 size={10} /> {components.length} component(s) will be enclosed</span>
                        }
                    </div>
                    <button
                        onClick={handleGenerateEnclosure}
                        disabled={elements.length === 0}
                        className="w-full py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-400 text-xs font-bold uppercase tracking-wider rounded transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                    >
                        <Package size={12} /> Generate Enclosure STL
                    </button>
                </Section>

                {/* ── 3. Cross-Section View ─────────────────────────────── */}
                <Section title="Cross-Section View" icon={<ScanLine size={14} />} defaultOpen={false}>
                    <Toggle label="Enable Cross-Section" value={crossSectionEnabled} onChange={toggleCrossSection} />
                    {crossSectionEnabled && (
                        <>
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-slate-400 w-28 shrink-0">Cut Axis</span>
                                <div className="flex gap-1">
                                    {(['x', 'y', 'z'] as const).map(axis => (
                                        <button
                                            key={axis}
                                            onClick={() => setCrossSectionAxis(axis)}
                                            className={`px-3 py-1 text-xs font-bold rounded uppercase transition-colors ${crossSectionAxis === axis ? 'bg-cyan-500 text-black' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                                        >
                                            {axis}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <SliderRow label="Cut Position" value={crossSectionOffset} min={-100} max={100} step={1} unit="mm" onChange={setCrossSectionOffset} />
                        </>
                    )}
                    <p className="text-[10px] text-slate-500">Slice any 3D model to inspect internal geometry. Works live in the 3D viewport.</p>
                </Section>

                {/* ── 4. Schematic → Netlist ──────────────────────────────── */}
                <Section title="Schematic → Netlist" icon={<List size={14} />} defaultOpen={false}>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                        Traces wires between components and produces a connectivity netlist that can be exported for PCB layout (KiCad .net format).
                    </p>
                    <div className="text-[10px] text-slate-400">
                        Components: <span className="text-purple-400 font-mono">{components.length}</span> | Wires: <span className="text-green-400 font-mono">{wires.length}</span>
                    </div>
                    <button
                        onClick={() => { generateNetlist(); toast.success('Netlist generated — open Terminal to view.'); }}
                        disabled={components.length === 0}
                        className="w-full py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-400 text-xs font-bold uppercase tracking-wider rounded transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                    >
                        <Cpu size={12} /> Generate Netlist
                    </button>
                    {netlist.length > 0 && (
                        <>
                            <div className="bg-slate-900 border border-slate-700 rounded p-2 max-h-28 overflow-y-auto">
                                {netlist.map(n => (
                                    <div key={n.id} className="flex items-center gap-2 py-0.5">
                                        <span className="text-[9px] font-mono text-cyan-400 w-16 shrink-0">{n.id}</span>
                                        <span className="text-[9px] font-mono text-slate-300 truncate">{n.label}</span>
                                        <span className="text-[9px] text-slate-500 shrink-0">({n.nets.length} nodes)</span>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={handleExportNetlist}
                                className="w-full py-1.5 bg-slate-700/60 hover:bg-slate-600/60 text-slate-300 text-xs font-bold uppercase tracking-wider rounded transition-colors flex items-center justify-center gap-2"
                            >
                                <Download size={12} /> Export .net (KiCad)
                            </button>
                        </>
                    )}
                </Section>

                {/* ── 5. Wire → PCB Track Export ─────────────────────────── */}
                <Section title="Wire → PCB Track Export" icon={<Layers size={14} />} defaultOpen={false}>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                        Converts your 2D schematic wires into PCB copper track data at the configured width and copper weight. Exports as CSV for import into PCB tools.
                    </p>
                    <SliderRow label="Track Width" value={wireTrackWidth} min={0.1} max={3.0} step={0.05} unit="mm" onChange={setWireTrackWidth} />
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400 w-28 shrink-0">Copper Weight</span>
                        <div className="flex gap-1">
                            {(['1oz', '2oz'] as const).map(w => (
                                <button
                                    key={w}
                                    onClick={() => setWireTrackCopperWeight(w)}
                                    className={`px-3 py-1 text-xs font-bold rounded transition-colors ${wireTrackCopperWeight === w ? 'bg-amber-500 text-black' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                                >
                                    {w}
                                </button>
                            ))}
                        </div>
                    </div>
                    {wires.length === 0
                        ? <span className="flex items-center gap-1 text-[10px] text-amber-400"><AlertTriangle size={10} /> No wires on canvas</span>
                        : <span className="flex items-center gap-1 text-[10px] text-emerald-400"><CheckCircle2 size={10} /> {wires.length} wire segment(s) ready</span>
                    }
                    <button
                        onClick={handleExportTracks}
                        disabled={wires.length === 0}
                        className="w-full py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-400 text-xs font-bold uppercase tracking-wider rounded transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                    >
                        <Download size={12} /> Export Track CSV
                    </button>
                </Section>

            </div>
        </div>
    );
};

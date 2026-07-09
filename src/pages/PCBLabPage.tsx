import React from 'react';
import { PCBCanvas } from '../components/pcb/canvas/PCBCanvas';
import { PCBRibbon } from '../components/pcb/ui/PCBRibbon';
import { PCBLayerManager } from '../components/pcb/ui/PCBLayerManager';

export default function PCBLabPage() {
    return (
        <div className="relative w-full h-[calc(100vh-4rem)] bg-[#0e0e11] overflow-hidden text-slate-300">
            {/* Top Toolbar */}
            <PCBRibbon />
            
            {/* Layer Control Panel */}
            <PCBLayerManager />
            
            {/* Interactive Canvas */}
            <div className="absolute inset-0 pt-14">
                <PCBCanvas />
            </div>
            
            {/* Status Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-6 bg-slate-900 border-t border-slate-800 flex items-center px-4 text-[10px] font-mono text-slate-500 justify-between z-50">
                <div className="flex gap-4">
                    <span>PCB Lab Active</span>
                    <span>1mm Grid</span>
                </div>
                <div>
                    Advanced Schematic Design Suite | PCB Module
                </div>
            </div>
        </div>
    );
}

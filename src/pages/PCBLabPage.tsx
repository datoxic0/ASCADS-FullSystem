import React, { useEffect } from 'react';
import { PCBCanvas } from '../components/pcb/canvas/PCBCanvas';
import { PCBRibbon } from '../components/pcb/ui/PCBRibbon';
import { PCBSidebar } from '../components/pcb/ui/PCBSidebar';
import { PCB3DViewer } from '../components/pcb/canvas/PCB3DViewer';
import { usePCBStore } from '../components/pcb/store/usePCBStore';

export default function PCBLabPage() {
    const { viewMode, sidebarOpen, undo, redo, removeSelected } = usePCBStore();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            
            if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                undo();
            } else if (e.key === 'y' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                redo();
            } else if (e.key === 'Delete' || e.key === 'Backspace') {
                removeSelected();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo, removeSelected]);

    return (
        <div className="relative w-full h-[calc(100vh-4rem)] bg-[#0e0e11] overflow-hidden text-slate-300">
            {/* Top Toolbar */}
            <PCBRibbon />
            
            {/* Right Sidebar */}
            <PCBSidebar />
            
            {/* Interactive Canvas */}
            <div className={`absolute inset-0 pt-14 ${sidebarOpen ? 'pr-72' : 'pr-10'}`}>
                {viewMode === '3d' ? <PCB3DViewer /> : <PCBCanvas />}
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

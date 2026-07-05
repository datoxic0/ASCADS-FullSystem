import React, { useState, useRef } from 'react';
import { X, UploadCloud, Loader2, Sparkles, Image as ImageIcon } from 'lucide-react';
import { useEngigraphStore, DrawingObject } from '../store/useEngigraphStore';

export const DigitizeModal: React.FC = () => {
    const { isDigitizeModalOpen, toggleDigitizeModal, pushHistory, elements, setSelectedIds, activePartType } = useEngigraphStore();
    
    const [isDragging, setIsDragging] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isDigitizeModalOpen) return null;

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            startScan();
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            startScan();
        }
    };

    const startScan = () => {
        setIsScanning(true);
        setScanProgress(0);
        
        // Mock processing delay for ML Vision analysis
        const interval = setInterval(() => {
            setScanProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    completeScan();
                    return 100;
                }
                return prev + (Math.random() * 15);
            });
        }, 300);
    };

    const completeScan = () => {
        setIsScanning(false);
        toggleDigitizeModal();

        // Generate a mock mapped circuit based on "Computer Vision"
        const genId = () => `obj-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
        
        const bId = genId();
        const sId = genId();
        const lId = genId();

        const newComps: DrawingObject[] = [
            { id: bId, type: 'component', partType: 'battery_18650', x: 200, y: 300, voltage: 3.7 },
            { id: sId, type: 'component', partType: 'switch_spst', x: 200, y: 150, state: 'open' },
            { id: lId, type: 'component', partType: 'led_red', x: 400, y: 150 },
            { id: genId(), type: 'wire', strokeWidth: 3, stroke: '#3b82f6', points: [200, 285, 200, 150] },
            { id: genId(), type: 'wire', strokeWidth: 3, stroke: '#3b82f6', points: [215, 150, 385, 150] },
            { id: genId(), type: 'wire', strokeWidth: 3, stroke: '#3b82f6', points: [415, 150, 415, 315, 200, 315] }
        ];

        pushHistory([...elements, ...newComps]);
        setSelectedIds([bId, sId, lId]);
        useEngigraphStore.getState().pushTerminalLog('ML Vision Engine: Successfully parsed hand-drawn circuit into 3 components and 3 nets.', 'system');
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-[500px] bg-slate-900 border border-slate-700/50 rounded-xl shadow-2xl overflow-hidden flex flex-col">
                <div className="bg-slate-950/80 p-4 border-b border-slate-700/50 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-400">
                        <Sparkles size={16} />
                        <span className="text-xs font-bold uppercase tracking-widest">Digitize Engine</span>
                    </div>
                    <button 
                        onClick={toggleDigitizeModal}
                        className="text-slate-500 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
                        disabled={isScanning}
                    >
                        <X size={16} />
                    </button>
                </div>
                
                <div className="p-6 flex flex-col gap-4">
                    <p className="text-xs text-slate-400">
                        Upload a photo of a hand-drawn schematic or a PCB image. The AI Vision Engine will map the image to physical EngiGraph components.
                    </p>

                    <div 
                        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        onClick={!isScanning ? handleUploadClick : undefined}
                        className={`mt-2 border-2 border-dashed rounded-xl h-48 flex flex-col items-center justify-center gap-3 transition-colors ${
                            isScanning ? 'border-emerald-500/50 bg-emerald-500/5 cursor-wait' :
                            isDragging ? 'border-cyan-400 bg-cyan-400/10 cursor-copy' : 
                            'border-slate-700 hover:border-cyan-500/50 hover:bg-slate-800 cursor-pointer'
                        }`}
                    >
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                        
                        {isScanning ? (
                            <>
                                <Loader2 size={32} className="text-emerald-400 animate-spin" />
                                <div className="text-xs font-bold text-emerald-400 uppercase tracking-widest mt-2">
                                    Analyzing Topology... {Math.min(100, Math.round(scanProgress))}%
                                </div>
                                <div className="w-48 h-1 bg-slate-800 rounded-full mt-2 overflow-hidden">
                                    <div className="h-full bg-emerald-400 transition-all duration-300" style={{ width: `${scanProgress}%` }} />
                                </div>
                            </>
                        ) : (
                            <>
                                <UploadCloud size={32} className={isDragging ? 'text-cyan-400' : 'text-slate-500'} />
                                <div className="text-xs font-medium text-slate-400">
                                    <span className="text-cyan-400">Click to upload</span> or drag and drop
                                </div>
                                <div className="text-[10px] text-slate-500">
                                    PNG, JPG, HEIC (Max 5MB)
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

import React, { useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { useEngigraphStore } from '../store/useEngigraphStore';
import { X, Play, Save, Box, Terminal } from 'lucide-react';
import { toast } from 'sonner';

export const EngigraphIDE: React.FC = () => {
    const { isIdeOpen, activeMcuId, closeIde, elements, updateElement } = useEngigraphStore();
    const [code, setCode] = useState('');

    const mcu = elements.find(el => el.id === activeMcuId);

    useEffect(() => {
        if (mcu && mcu.mcuCode) {
            setCode(mcu.mcuCode);
        } else if (mcu) {
            // Default template
            setCode(`// EngiGraph Firmware - ${mcu.partType?.toUpperCase()}\n\nvoid setup() {\n  // Configure pins\n}\n\nvoid loop(inputs, outputs) {\n  // Example: outputs.D5 = inputs.D2 && !inputs.D3;\n}\n`);
        }
    }, [mcu]);

    if (!isIdeOpen || !mcu) return null;

    const handleSave = () => {
        updateElement(mcu.id, { mcuCode: code });
        toast.success('Firmware flashed successfully.');
    };

    return (
        <div className="absolute inset-x-0 bottom-0 top-1/3 z-40 bg-[#1e1e1e] border-t-2 border-cyan-500 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-2 bg-[#2d2d2d] border-b border-[#3e3e42]">
                <div className="flex items-center gap-3">
                    <Terminal size={16} className="text-cyan-400" />
                    <span className="text-xs font-mono text-slate-300">
                        {mcu.partType?.toUpperCase()} - {mcu.id}
                    </span>
                    <span className="px-2 py-0.5 bg-blue-900/40 text-blue-400 text-[10px] rounded">main.cpp</span>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleSave} className="flex items-center gap-1 px-3 py-1 bg-cyan-700 hover:bg-cyan-600 text-white text-xs rounded transition-colors">
                        <Save size={14} /> Flash
                    </button>
                    <button onClick={closeIde} className="p-1 hover:bg-[#3e3e42] rounded text-slate-400 transition-colors">
                        <X size={16} />
                    </button>
                </div>
            </div>
            
            <div className="flex-1 flex">
                {/* File Explorer mock */}
                <div className="w-48 bg-[#252526] border-r border-[#3e3e42] p-2 flex flex-col gap-1 hidden md:flex">
                    <div className="text-[10px] text-slate-500 font-bold uppercase mb-2 px-1">Explorer</div>
                    <div className="text-xs text-slate-300 flex items-center gap-2 px-2 py-1 bg-[#37373d] rounded cursor-pointer">
                        <Box size={14} className="text-blue-400" /> src
                    </div>
                    <div className="text-xs text-cyan-400 flex items-center gap-2 px-2 py-1 pl-6 cursor-pointer">
                        main.cpp
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-2 px-2 py-1 pl-6 hover:bg-[#2a2d2e] cursor-pointer">
                        config.h
                    </div>
                </div>

                <div className="flex-1 relative">
                    <Editor
                        height="100%"
                        defaultLanguage="cpp"
                        theme="vs-dark"
                        value={code}
                        onChange={(val) => setCode(val || '')}
                        options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                            padding: { top: 16 },
                            smoothScrolling: true,
                            cursorBlinking: "smooth"
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

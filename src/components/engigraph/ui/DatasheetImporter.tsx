import React, { useState } from 'react';
import { useEngigraphStore } from '../store/useEngigraphStore';
import { FileText, UploadCloud, X, Cpu, Loader2 } from 'lucide-react';
import { askAI } from '../../../lib/ai';
import { toast } from 'sonner';

const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

export const DatasheetImporter: React.FC = () => {
    const { isDatasheetModalOpen, toggleDatasheetModal, addCustomComponentDef, pushHistory, elements } = useEngigraphStore();
    const [isLoading, setIsLoading] = useState(false);
    const [textInput, setTextInput] = useState('');

    if (!isDatasheetModalOpen) return null;

    const handleSimulateExtraction = async () => {
        if (!textInput.trim()) {
            toast.error("Please paste datasheet text to extract.");
            return;
        }

        setIsLoading(true);
        try {
            const prompt = `Analyze this raw datasheet text for an electronic component and extract its specs to create a JSON definition.
Datasheet Text:
"${textInput}"

You must return ONLY a JSON object (no markdown, no backticks, no explanations). Use this exact schema:
{
    "name": "Component Name",
    "partType": "custom_unique_id",
    "color": "#HEXCODE",
    "width": 60,
    "height": 40,
    "pins": [
        { "name": "VCC", "x": -30, "y": -10, "type": "power" },
        { "name": "GND", "x": -30, "y": 10, "type": "ground" },
        { "name": "OUT", "x": 30, "y": 0, "type": "output" }
    ],
    "logicSource": "// Javascript firmware simulating the component's internal logic based on datasheet.\\nif(inputs.VCC && !inputs.GND) { outputs.OUT = true; }"
}`;
            
            const rawResponse = await askAI(prompt);
            let jsonString = rawResponse.trim();
            if (jsonString.startsWith('\`\`\`json')) jsonString = jsonString.slice(7, -3);
            if (jsonString.startsWith('\`\`\`')) jsonString = jsonString.slice(3, -3);
            
            const def = JSON.parse(jsonString.trim());
            
            // Register it in the store
            addCustomComponentDef(def.partType, def);
            
            // Automatically place it on the canvas
            const newId = generateId('part');
            pushHistory([...elements, {
                id: newId,
                type: 'component',
                partType: def.partType,
                x: 0,
                y: 0,
                mcuCode: def.logicSource
                // store definition reference internally if needed, but the store has it globally
            }]);
            
            toast.success(`Component ${def.name} successfully extracted and placed on the board!`);
            toggleDatasheetModal();
            setTextInput('');
        } catch (e) {
            console.error(e);
            toast.error("Failed to parse datasheet. Ensure the AI returns valid JSON.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-[#1e1e1e] border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-[#252526]">
                    <div className="flex items-center gap-2">
                        <Cpu className="text-purple-400" size={20} />
                        <h2 className="text-slate-200 font-semibold text-sm tracking-wide">AI Component Datasheet Extraction (RAG)</h2>
                    </div>
                    <button onClick={toggleDatasheetModal} className="text-slate-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-6 flex flex-col gap-4">
                    <div className="border-2 border-dashed border-slate-700 rounded-lg p-8 flex flex-col items-center justify-center bg-slate-900/50">
                        <UploadCloud size={48} className="text-slate-500 mb-4" />
                        <p className="text-slate-300 text-sm font-medium">Drag & Drop PDF Datasheet</p>
                        <p className="text-slate-500 text-xs mt-1">or paste raw text below to simulate PDF extraction</p>
                    </div>

                    <textarea
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        placeholder="Paste raw datasheet text here (e.g. 'NE555 Timer IC. Pins: 1 GND, 8 VCC, 3 OUT. Logic: OUT is high if VCC > 4.5V...')"
                        className="w-full h-32 bg-[#0e0e11] border border-slate-700 rounded p-3 text-slate-300 text-xs font-mono focus:outline-none focus:border-purple-500 resize-none"
                    />
                </div>
                
                <div className="p-4 border-t border-slate-700 bg-[#252526] flex justify-end">
                    <button
                        onClick={handleSimulateExtraction}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-700 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded shadow transition-colors"
                    >
                        {isLoading ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                        Extract & Generate Component
                    </button>
                </div>
            </div>
        </div>
    );
};

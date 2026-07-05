import React, { useState } from 'react';
import { useEngigraphStore } from '../store/useEngigraphStore';
import { X, Send, Bot, ShieldCheck, Zap } from 'lucide-react';

export const AIAssistantPanel: React.FC = () => {
    const { isAiAssistantOpen, toggleAiAssistant, elements } = useEngigraphStore();
    const [messages, setMessages] = useState<{role: 'system'|'user'|'assistant', text: string}[]>([
        { role: 'system', text: 'EngiGraph Agentic Assistant Initialized.' },
        { role: 'assistant', text: 'Hello! I can help you route components, run design rule checks (DRC), and optimize your circuit.' }
    ]);
    const [input, setInput] = useState('');

    if (!isAiAssistantOpen) return null;

    const handleSend = () => {
        if (!input.trim()) return;
        setMessages([...messages, { role: 'user', text: input }]);
        const currentInput = input;
        setInput('');
        
        // Simple mock response
        setTimeout(() => {
            let response = "I've analyzed your request.";
            if (currentInput.toLowerCase().includes('audit')) {
                const parts = elements.filter(e => e.type === 'component').length;
                response = `Audit complete. Found ${parts} active components. No shorts detected.`;
            } else if (currentInput.toLowerCase().includes('optimize')) {
                response = 'Optimization pass complete. Component placement looks ideal for current thermal dissipation constraints.';
            }
            setMessages(prev => [...prev, { role: 'assistant', text: response }]);
        }, 1000);
    };

    return (
        <div className="absolute top-16 right-4 w-80 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl flex flex-col pointer-events-auto" style={{ height: '400px', zIndex: 1000 }}>
            <div className="flex items-center justify-between p-2 border-b border-slate-800 bg-slate-900/50">
                <div className="flex items-center gap-2 text-cyan-400">
                    <Bot size={16} />
                    <span className="text-xs font-medium uppercase tracking-wider">Agentic Assistant</span>
                </div>
                <button onClick={toggleAiAssistant} className="text-slate-400 hover:text-white transition-colors">
                    <X size={16} />
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded p-2 text-xs ${
                            msg.role === 'user' ? 'bg-cyan-900/40 text-cyan-100 border border-cyan-800' :
                            msg.role === 'system' ? 'text-slate-500 italic' :
                            'bg-slate-800 text-slate-200 border border-slate-700'
                        }`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-2 border-t border-slate-800 bg-slate-900/50">
                <div className="flex gap-1 mb-2">
                    <button onClick={() => setInput('Run deep audit on current design.')} className="flex-1 flex items-center justify-center gap-1 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 py-1 rounded border border-slate-700 transition-colors">
                        <ShieldCheck size={12} /> Audit
                    </button>
                    <button onClick={() => setInput('Optimize component placement.')} className="flex-1 flex items-center justify-center gap-1 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 py-1 rounded border border-slate-700 transition-colors">
                        <Zap size={12} /> Optimize
                    </button>
                </div>
                <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded px-2 py-1">
                    <input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask assistant..."
                        className="flex-1 bg-transparent border-none outline-none text-xs text-slate-200 placeholder:text-slate-500"
                    />
                    <button onClick={handleSend} className="text-cyan-500 hover:text-cyan-400">
                        <Send size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
};

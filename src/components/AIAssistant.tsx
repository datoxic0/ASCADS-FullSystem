import { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Loader, ChevronDown, Settings, Save } from 'lucide-react';
import { askAI, getActiveEngine, setActiveEngine, getAPIKey, setAPIKey, AIEngine } from '@/lib/ai';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = [
  'Check my schematic for potential short circuits',
  'Help me optimize my Industrial PLC ladder logic',
  'Provide a script template for the Robot Workspace',
  'What pull-up resistor should I use for I2C?',
  'Explain the mathematical logic of the simulation',
  'Suggest design standards for my EngiGraph drawing',
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  systemContext?: object;
}

export default function AIAssistant({ isOpen, onClose, systemContext }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const [engine, setEngineLocal] = useState<AIEngine>(getActiveEngine());
  const [geminiKey, setGeminiKeyLocal] = useState(getAPIKey('gemini') || '');
  const [openRouterKey, setOpenRouterKeyLocal] = useState(getAPIKey('openrouter') || '');

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, showSettings]);

  const saveSettings = () => {
      setActiveEngine(engine);
      setAPIKey('gemini', geminiKey);
      setAPIKey('openrouter', openRouterKey);
      setShowSettings(false);
  };

  const send = async (text?: string) => {
    const prompt = text ?? input.trim();
    if (!prompt || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: prompt }]);
    setLoading(true);
    try {
      const reply = await askAI(prompt, systemContext);
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } finally {
      setLoading(false);
    }
  };

  // Removed early return to allow CSS transition to play

  return (
    <div className={`fixed top-0 right-0 h-screen z-50 transition-transform duration-500 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'} w-[600px] max-w-[90vw] bg-slate-950 border-l border-slate-800 shadow-2xl flex flex-col`}>
        {/* Header */}
        <div className="flex items-center gap-4 px-6 py-4 border-b border-slate-800 shrink-0">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-[0_0_16px_rgba(99,102,241,0.4)]">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-lg font-black text-slate-100">Genesis AI Hub</p>
            <p className="text-xs text-slate-500 uppercase tracking-widest">
              Powered by {engine === 'power' ? 'Gemini (Power)' : 'OpenRouter (Economy)'}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-3">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-1.5 rounded-lg transition-colors ${showSettings ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'}`}
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
          </div>
        </div>

        {/* Body Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 relative">
          
          {showSettings ? (
            <div className="absolute inset-0 bg-slate-950 z-10 p-5 flex flex-col gap-6 overflow-y-auto">
               <div>
                   <h3 className="text-lg font-bold text-white mb-1">Dual Engine Settings</h3>
                   <p className="text-sm text-slate-400 leading-relaxed">Configure the AI backend for ASCADS. Use Gemini for the absolute best reasoning (Power Mode), or switch to OpenRouter to access free/economical community models (Economy Mode).</p>
               </div>
               
               <div className="space-y-4">
                   <div className="space-y-2">
                       <label className="text-sm font-bold uppercase tracking-widest text-slate-500">Active Engine</label>
                       <div className="flex gap-2">
                           <button onClick={() => setEngineLocal('power')} className={`flex-1 py-3 px-3 rounded-lg border text-sm font-bold transition-all ${engine === 'power' ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' : 'bg-slate-900 border-slate-800 text-slate-500 hover:bg-slate-800'}`}>Power Mode (Gemini)</button>
                           <button onClick={() => setEngineLocal('economy')} className={`flex-1 py-3 px-3 rounded-lg border text-sm font-bold transition-all ${engine === 'economy' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-500 hover:bg-slate-800'}`}>Economy Mode (OpenRouter)</button>
                       </div>
                   </div>

                   <div className="space-y-2">
                       <label className="text-sm font-bold uppercase tracking-widest text-slate-500">Gemini API Key</label>
                       <input type="password" value={geminiKey} onChange={e => setGeminiKeyLocal(e.target.value)} placeholder="AIzaSy..." className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 px-3 text-sm text-slate-200 focus:border-indigo-500 outline-none transition-colors font-mono" />
                   </div>

                   <div className="space-y-2">
                       <label className="text-sm font-bold uppercase tracking-widest text-slate-500">OpenRouter API Key</label>
                       <input type="password" value={openRouterKey} onChange={e => setOpenRouterKeyLocal(e.target.value)} placeholder="sk-or-v1-..." className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 px-3 text-sm text-slate-200 focus:border-indigo-500 outline-none transition-colors font-mono" />
                   </div>
               </div>

               <button onClick={saveSettings} className="mt-auto py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-base font-bold rounded-xl transition-all flex items-center justify-center gap-2">
                   <Save className="w-5 h-5" /> Save Configuration
               </button>
            </div>
          ) : messages.length === 0 ? (
            <div className="space-y-4">
              <p className="text-xs text-slate-600 uppercase tracking-widest font-black text-center">
                Suggested prompts
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-left p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 transition-all text-base text-slate-400 hover:text-slate-200 font-medium"
                  >
                    "{s}"
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] px-5 py-4 rounded-xl text-base leading-relaxed whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-indigo-900/50 border border-indigo-800/50 text-indigo-100'
                      : 'bg-slate-900 border border-slate-800 text-slate-300 font-mono'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="flex justify-start">
              <div className="px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-3">
                <Loader className="w-5 h-5 text-indigo-400 animate-spin" />
                <span className="text-sm text-slate-500 animate-pulse">Analyzing system context...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        {!showSettings && (
            <div className="p-4 border-t border-slate-800 shrink-0">
            <div className="flex gap-3">
                <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                placeholder="Ask the AI Hub anything about your project..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-sm text-slate-200 focus:border-indigo-500 outline-none transition-colors placeholder-slate-600"
                />
                <button
                onClick={() => send()}
                disabled={!input.trim() || loading}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-all"
                >
                <Send className="w-5 h-5 text-white" />
                </button>
            </div>
            </div>
        )}
      </div>
  );
}

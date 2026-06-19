import React from 'react';
import { X, Book, FileText, Briefcase, Info, Compass } from 'lucide-react';
import { DocumentationContent } from '../../../public/engigraph/ui-documentation-content';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function DocumentationViewer({ isOpen, onClose }: Props) {
  const [activeTab, setActiveTab] = React.useState<keyof typeof DocumentationContent>('manual');

  if (!isOpen) return null;

  const tabs = [
    { id: 'abstract', icon: <Info size={16} />, label: 'Abstract' },
    { id: 'manual', icon: <Book size={16} />, label: 'User Manual' },
    { id: 'tutorial', icon: <Compass size={16} />, label: 'Tutorials' },
    { id: 'standards', icon: <Briefcase size={16} />, label: 'Engineering Standards' },
    { id: 'math', icon: <FileText size={16} />, label: 'Computational Math' },
    { id: 'mechatronics', icon: <FileText size={16} />, label: 'Mechatronics' },
  ] as const;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-8">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl h-full max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-lg">
              <Book className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">EngiGraph Pro Documentation</h2>
              <p className="text-xs text-slate-400">Library & Tutorials</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="w-64 bg-slate-950/50 border-r border-slate-800 p-4 flex flex-col gap-2 overflow-y-auto shrink-0">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as keyof typeof DocumentationContent)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab.id 
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-inner'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-slate-900 text-slate-300 documentation-content">
            <style>{`
              .documentation-content h1 { font-size: 1.5rem; font-weight: 800; color: #fff; margin-bottom: 1rem; border-bottom: 1px solid #334155; padding-bottom: 0.5rem; }
              .documentation-content h2 { font-size: 1.1rem; font-weight: 700; color: #818cf8; margin-top: 1.5rem; margin-bottom: 0.75rem; }
              .documentation-content h3 { font-size: 1rem; font-weight: 600; color: #e2e8f0; margin-top: 1rem; margin-bottom: 0.5rem; }
              .documentation-content p { margin-bottom: 1rem; line-height: 1.6; }
              .documentation-content ul { list-style-type: disc; margin-left: 1.5rem; margin-bottom: 1rem; }
              .documentation-content li { margin-bottom: 0.5rem; }
              .documentation-content code { background: #0f172a; padding: 0.2rem 0.4rem; border-radius: 4px; font-family: monospace; font-size: 0.85em; color: #38bdf8; }
              .documentation-content kbd { background: #1e293b; border: 1px solid #334155; border-radius: 4px; padding: 0.1rem 0.4rem; font-size: 0.8em; border-bottom-width: 2px; }
              .documentation-content .tutorial-card { background: #0f172a; border: 1px solid #1e293b; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; box-shadow: inset 0 2px 4px rgba(0,0,0,0.1); }
              .documentation-content .step-number { display: inline-flex; width: 20px; height: 20px; background: #4f46e5; color: white; border-radius: 50%; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; margin-right: 8px; }
            `}</style>
            
            <div 
              dangerouslySetInnerHTML={{ __html: DocumentationContent[activeTab] || '<p>Content not found.</p>' }} 
            />
          </div>
        </div>

      </div>
    </div>
  );
}

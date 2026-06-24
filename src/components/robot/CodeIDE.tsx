import { useState, useRef, useEffect } from 'react';
import { Save, Play, FileCode, Copy, Check, Code, Download, Wrench, Upload } from 'lucide-react';
import type { RobotProgram } from '@/lib/robot-types';

interface Props {
  program: RobotProgram;
  onSave: (id: string, code: string) => void;
  onAddLog: (msg: string) => void;
}

export function CodeIDE({ program, onSave, onAddLog }: Props) {
  const [code, setCode] = useState(program.code);
  const [saved, setSaved] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [lineNumbers, setLineNumbers] = useState(1);

  useEffect(() => {
    setCode(program.code);
    setSaved(true);
  }, [program.id]);

  useEffect(() => {
    const lines = code.split('\n').length;
    setLineNumbers(Math.max(1, lines));
  }, [code]);

  const handleSave = () => {
    onSave(program.id, code);
    setSaved(true);
  };

  const handleRun = () => {
    onAddLog(`Running program: ${program.name}`);
    onAddLog('Compiling...');
    onAddLog('Uploading to target...');
    onAddLog('Program execution started');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#0a0b0e]">
      {/* Toolbar */}
      <div className="h-9 bg-[#0a0c12] border-b border-emerald-300 dark:border-white/5 flex items-center px-3 gap-2">
        <div className="flex items-center gap-1.5 mr-4">
          <FileCode size={12} className="text-blue-400" />
          <span className="text-[10px] font-bold text-white">{program.name}</span>
          <span className="text-[8px] text-zinc-500">({program.board} · {program.language})</span>
          {!saved && <span className="text-[8px] text-amber-500 font-bold">*</span>}
        </div>
        <div className="w-px h-5 bg-white/10" />
        <button onClick={handleSave} className="flex items-center gap-1 px-2 py-1 rounded text-[9px] font-bold hover:bg-white/5 transition-colors text-zinc-400 hover:text-white">
          <Save size={10} /> Save
        </button>
        <button onClick={handleRun} className="flex items-center gap-1 px-2 py-1 rounded text-[9px] font-bold hover:bg-white/5 transition-colors text-emerald-400 hover:text-emerald-300">
          <Play size={10} /> Run
        </button>
        <button onClick={() => {
          navigator.clipboard.writeText(code);
          onAddLog('Code copied to clipboard');
        }} className="flex items-center gap-1 px-2 py-1 rounded text-[9px] font-bold hover:bg-white/5 transition-colors text-zinc-400 hover:text-white">
          <Copy size={10} /> Copy
        </button>
        <button onClick={() => {
          const blob = new Blob([code], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${program.name.replace(/\s+/g, '_')}.${program.language === 'cpp' ? 'ino' : program.language === 'python' ? 'py' : 'txt'}`;
          a.click();
          URL.revokeObjectURL(url);
        }} className="flex items-center gap-1 px-2 py-1 rounded text-[9px] font-bold hover:bg-white/5 transition-colors text-zinc-400 hover:text-white">
          <Download size={10} /> Export
        </button>
      </div>

      {/* Editor */}
      <div className="flex-1 flex overflow-hidden">
        {/* Line numbers */}
        <div className="w-12 bg-[#07080b] border-r border-emerald-300 dark:border-white/5 flex flex-col items-end py-3 pr-2 text-[10px] font-mono text-zinc-600 select-none overflow-hidden">
          {Array.from({ length: lineNumbers }, (_, i) => (
            <div key={i} className="leading-5">{i + 1}</div>
          ))}
        </div>
        <textarea
          ref={textareaRef}
          value={code}
          onChange={e => { setCode(e.target.value); setSaved(false); }}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-[#0a0b0e] text-[11px] font-mono text-zinc-300 p-3 outline-none resize-none leading-5 whitespace-pre tab-[4]"
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="off"
        />
      </div>
    </div>
  );
}



import { useRef, useEffect, useState } from 'react';
import { Terminal, Trash2, Send, Wifi, WifiOff, Download, Settings } from 'lucide-react';

interface Props {
  logs: string[];
  onClear: () => void;
  isConnected: boolean;
  onToggleConnect?: () => void;
}

export function TerminalConsole({ logs, onClear, isConnected, onToggleConnect }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [command, setCommand] = useState('');
  const [baudRate, setBaudRate] = useState(115200);
  const [comPort, setComPort] = useState('COM3');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const handleCommand = () => {
    if (!command.trim()) return;
    setCommand('');
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#0a0b0e]">
      {/* Toolbar */}
      <div className="h-9 bg-[#0a0c12] border-b border-emerald-300 dark:border-white/5 flex items-center px-3 gap-2">
        <Terminal size={12} className="text-zinc-400" />
        <span className="text-[10px] font-bold text-zinc-400">Serial Terminal</span>
        <div className="w-px h-5 bg-white/10" />
        <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold border ${
          isConnected ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {isConnected ? <Wifi size={8} /> : <WifiOff size={8} />}
          {isConnected ? comPort : 'DISCONNECTED'}
        </div>
        <div className="text-[8px] text-zinc-500">{baudRate} baud</div>
        <div className="ml-auto flex items-center gap-1">
          <button onClick={() => setShowSettings(!showSettings)} className="p-1 hover:bg-white/5 rounded text-zinc-500 hover:text-zinc-300 transition-colors">
            <Settings size={10} />
          </button>
          <button onClick={onClear} className="p-1 hover:bg-white/5 rounded text-zinc-500 hover:text-red-400 transition-colors">
            <Trash2 size={10} />
          </button>
          <button onClick={() => {
            const blob = new Blob([logs.join('\n')], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `terminal_log_${Date.now()}.txt`;
            a.click();
            URL.revokeObjectURL(url);
          }} className="p-1 hover:bg-white/5 rounded text-zinc-500 hover:text-zinc-300 transition-colors">
            <Download size={10} />
          </button>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="bg-[#0c0e14] border-b border-emerald-300 dark:border-white/5 p-3 flex gap-4 text-[9px] font-mono">
          <div className="space-y-1">
            <label className="text-[8px] text-zinc-500">COM Port</label>
            <select value={comPort} onChange={e => setComPort(e.target.value)} className="bg-[#111318] border border-emerald-300 dark:border-white/5 rounded px-2 py-1 text-zinc-300 outline-none">
              <option>COM3</option>
              <option>COM4</option>
              <option>COM5</option>
              <option>/dev/ttyUSB0</option>
              <option>/dev/ttyACM0</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[8px] text-zinc-500">Baud Rate</label>
            <select value={baudRate} onChange={e => setBaudRate(Number(e.target.value))} className="bg-[#111318] border border-emerald-300 dark:border-white/5 rounded px-2 py-1 text-zinc-300 outline-none">
              <option value={9600}>9600</option>
              <option value={19200}>19200</option>
              <option value={38400}>38400</option>
              <option value={57600}>57600</option>
              <option value={115200}>115200</option>
              <option value={230400}>230400</option>
            </select>
          </div>
          <button onClick={onToggleConnect}
            className={`self-end px-3 py-1 rounded text-[8px] font-bold border transition-colors ${
              isConnected ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
            }`}>
            {isConnected ? 'Disconnect' : 'Connect'}
          </button>
        </div>
      )}

      {/* Log output */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 font-mono text-[10px] leading-5 space-y-0.5">
        {logs.map((log, i) => {
          const isError = log.includes('error') || log.includes('Error') || log.includes('ERROR');
          const isWarning = log.includes('warning') || log.includes('Warning') || log.includes('WARN');
          const isSuccess = log.includes('success') || log.includes('Success') || log.includes('STARTED');
          return (
            <div key={i} className={`${
              isError ? 'text-red-400' : isWarning ? 'text-amber-400' : isSuccess ? 'text-emerald-400' : 'text-zinc-400'
            }`}>
              <span className="text-zinc-600 mr-2">{`>`}</span>
              {log}
            </div>
          );
        })}
        {logs.length === 0 && (
          <div className="text-zinc-600 italic">No terminal output. Connect to a board to begin.</div>
        )}
      </div>

      {/* Command input */}
      <div className="h-10 border-t border-emerald-300 dark:border-white/5 flex items-center px-3 gap-2 bg-[#0a0c12]">
        <span className="text-emerald-400 text-[10px] font-bold">{`>`}</span>
        <input
          value={command}
          onChange={e => setCommand(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCommand()}
          className="flex-1 bg-transparent text-[10px] font-mono text-zinc-300 outline-none placeholder-zinc-600"
          placeholder="Enter command..."
        />
        <button onClick={handleCommand} className="p-1 hover:bg-white/5 rounded text-zinc-500 hover:text-zinc-300 transition-colors">
          <Send size={10} />
        </button>
      </div>
    </div>
  );
}



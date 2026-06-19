import React, { useState } from 'react';
import { Box, Layers, Grid, Plus, MousePointer2, Move, Save, Trash2 } from 'lucide-react';
import { RobotDesignConfig } from './types';

interface Props {
  robotDesign: RobotDesignConfig;
  setRobotDesign: React.Dispatch<React.SetStateAction<RobotDesignConfig>>;
  objects: EnvObject[];
  setObjects: React.Dispatch<React.SetStateAction<EnvObject[]>>;
}

interface EnvObject {
  id: string;
  type: 'wall' | 'table' | 'cnc' | 'conveyor';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export default function EnvironmentBuilder({ robotDesign, setRobotDesign, objects, setObjects }: Props) {
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);

  const handleAddObject = (type: EnvObject['type']) => {
    const newObj: EnvObject = {
      id: `env-${Date.now()}`,
      type,
      x: 200,
      y: 200,
      width: type === 'wall' ? 10 : 80,
      height: type === 'wall' ? 150 : 80,
      rotation: 0
    };
    setObjects([...objects, newObj]);
    setSelectedObjectId(newObj.id);
  };

  return (
    <div className="flex w-full h-full bg-[#0a0a0c] text-slate-300">
      {/* Sidebar Tools */}
      <div className="w-64 border-r border-white/5 bg-[#141418] flex flex-col">
        <div className="p-4 border-b border-white/5 bg-[#1a1a1e]">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center">
            <Layers className="w-4 h-4 mr-2 text-blue-400" />
            Environment Builder
          </h2>
          <p className="text-[10px] text-slate-500 mt-1">Design factory workspaces or domestic floors.</p>
        </div>

        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Environment Type</label>
            <select
              value={robotDesign.category}
              onChange={(e) => setRobotDesign({ ...robotDesign, category: e.target.value as any })}
              className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-xs font-mono focus:outline-none focus:border-blue-500/50"
            >
              <option value="industrial">Industrial Factory (Heavy Duty)</option>
              <option value="domestic">Domestic Home (Mobile)</option>
            </select>
          </div>

          <div className="pt-4 border-t border-white/5 space-y-2">
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Add Structures</label>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => handleAddObject('wall')} className="flex flex-col items-center justify-center p-3 bg-black/20 hover:bg-black/40 border border-white/5 hover:border-blue-500/30 rounded cursor-pointer transition-colors">
                <Box className="w-6 h-6 text-slate-400 mb-1" />
                <span className="text-[9px] font-bold">Wall/Barrier</span>
              </button>
              <button onClick={() => handleAddObject('table')} className="flex flex-col items-center justify-center p-3 bg-black/20 hover:bg-black/40 border border-white/5 hover:border-blue-500/30 rounded cursor-pointer transition-colors">
                <Box className="w-6 h-6 text-slate-400 mb-1" />
                <span className="text-[9px] font-bold">Table</span>
              </button>
              <button onClick={() => handleAddObject('cnc')} className="flex flex-col items-center justify-center p-3 bg-black/20 hover:bg-black/40 border border-white/5 hover:border-blue-500/30 rounded cursor-pointer transition-colors">
                <Box className="w-6 h-6 text-slate-400 mb-1" />
                <span className="text-[9px] font-bold">CNC Machine</span>
              </button>
              <button onClick={() => handleAddObject('conveyor')} className="flex flex-col items-center justify-center p-3 bg-black/20 hover:bg-black/40 border border-white/5 hover:border-blue-500/30 rounded cursor-pointer transition-colors">
                <Box className="w-6 h-6 text-slate-400 mb-1" />
                <span className="text-[9px] font-bold">Conveyor</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Canvas Workspace */}
      <div className="flex-1 relative overflow-hidden bg-[#0d0d0f]">
        {/* Grid Background */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        />

        {/* Origin Marker */}
        <div className="absolute top-1/2 left-1/2 w-4 h-4 -translate-x-1/2 -translate-y-1/2">
          <div className="absolute top-1/2 left-0 w-full h-[1px] bg-red-500/50"></div>
          <div className="absolute top-0 left-1/2 w-[1px] h-full bg-green-500/50"></div>
        </div>

        {/* Render Objects */}
        {objects.map((obj) => (
          <div
            key={obj.id}
            onClick={() => setSelectedObjectId(obj.id)}
            className={`absolute cursor-move transition-shadow ${selectedObjectId === obj.id ? 'ring-2 ring-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : ''}`}
            style={{
              left: `${obj.x}px`,
              top: `${obj.y}px`,
              width: `${obj.width}px`,
              height: `${obj.height}px`,
              transform: `translate(-50%, -50%) rotate(${obj.rotation}deg)`,
              backgroundColor: obj.type === 'wall' ? '#334' : obj.type === 'cnc' ? '#223' : obj.type === 'conveyor' ? '#1a1a1a' : '#443',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '4px'
            }}
          >
            <div className="w-full h-full flex items-center justify-center text-[10px] font-mono text-white/50 select-none">
              {obj.type.toUpperCase()}
            </div>
          </div>
        ))}
        
        {/* Placeholder instruction */}
        {objects.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <Grid className="w-16 h-16 text-white/5 mx-auto mb-4" />
              <p className="text-sm font-mono text-slate-500">Add structures to build your factory or domestic space.</p>
            </div>
          </div>
        )}
      </div>

      {/* Right Properties Panel */}
      {selectedObjectId && (
        <div className="w-64 border-l border-white/5 bg-[#141418] flex flex-col p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-white uppercase">Properties</h3>
            <button onClick={() => {
              setObjects(objects.filter(o => o.id !== selectedObjectId));
              setSelectedObjectId(null);
            }} className="p-1 hover:bg-red-500/20 text-red-400 rounded transition-colors cursor-pointer">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          
          {objects.filter(o => o.id === selectedObjectId).map(obj => (
             <div key={obj.id} className="space-y-4">
               <div>
                  <label className="text-[10px] text-slate-400">Position X</label>
                  <input 
                    type="range" min="0" max="800" value={obj.x}
                    onChange={(e) => setObjects(objects.map(o => o.id === obj.id ? { ...o, x: parseInt(e.target.value) } : o))}
                    className="w-full"
                  />
               </div>
               <div>
                  <label className="text-[10px] text-slate-400">Position Y</label>
                  <input 
                    type="range" min="0" max="600" value={obj.y}
                    onChange={(e) => setObjects(objects.map(o => o.id === obj.id ? { ...o, y: parseInt(e.target.value) } : o))}
                    className="w-full"
                  />
               </div>
               <div>
                  <label className="text-[10px] text-slate-400">Rotation</label>
                  <input 
                    type="range" min="0" max="360" value={obj.rotation}
                    onChange={(e) => setObjects(objects.map(o => o.id === obj.id ? { ...o, rotation: parseInt(e.target.value) } : o))}
                    className="w-full"
                  />
               </div>
               <div>
                  <label className="text-[10px] text-slate-400">Width / Length</label>
                  <input 
                    type="range" min="10" max="400" value={obj.width}
                    onChange={(e) => setObjects(objects.map(o => o.id === obj.id ? { ...o, width: parseInt(e.target.value) } : o))}
                    className="w-full"
                  />
               </div>
             </div>
          ))}
        </div>
      )}
    </div>
  );
}

import React from 'react';
import { RobotDesignConfig } from './types';
import { Settings, Cpu, Activity, Move, Zap } from 'lucide-react';
import Robot3DCanvas from './Robot3DCanvas';

interface Props {
  robotDesign: RobotDesignConfig;
  setRobotDesign: React.Dispatch<React.SetStateAction<RobotDesignConfig>>;
}

export default function RobotChassisBuilder({ robotDesign, setRobotDesign }: Props) {
  return (
    <div className="flex w-full h-full bg-[#0a0a0c] text-emerald-800 dark:text-slate-300">
      <div className="w-1/3 min-w-[300px] border-r border-emerald-300 dark:border-white/5 bg-[#141418] flex flex-col">
        <div className="p-4 border-b border-emerald-300 dark:border-white/5 bg-[#1a1a1e]">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center">
            <Cpu className="w-4 h-4 mr-2 text-teal-400" />
            Robot Chassis Builder
          </h2>
          <p className="text-[10px] text-slate-500 mt-1">Configure structural and kinematic parameters.</p>
        </div>

        <div className="p-4 flex-1 overflow-y-auto space-y-6">
          <div className="space-y-4">
            <h3 className="text-[10px] uppercase font-bold text-emerald-700 dark:text-slate-400 tracking-wider">Chassis & Kinematics</h3>
            
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500">Kinematic Structure</label>
              <select
                value={robotDesign.chassisType}
                onChange={(e) => setRobotDesign({ ...robotDesign, chassisType: e.target.value as any })}
                className="w-full bg-black/40 border border-emerald-400 dark:border-white/10 rounded px-2 py-1.5 text-xs font-mono"
              >
                <option value="fixed_base">Articulated (Fixed Base)</option>
                <option value="scara">SCARA (Fixed Base)</option>
                <option value="cartesian">Cartesian (Gantry)</option>
                <option value="differential_drive">Domestic (Differential Drive Mobile)</option>
                <option value="mecanum">AGV (Mecanum Wheels)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-500">Shoulder Link Length (mm) : {robotDesign.shoulderLength}</label>
              <input 
                type="range" min="50" max="300" value={robotDesign.shoulderLength}
                onChange={(e) => setRobotDesign({ ...robotDesign, shoulderLength: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500">Elbow Link Length (mm) : {robotDesign.elbowLength}</label>
              <input 
                type="range" min="50" max="300" value={robotDesign.elbowLength}
                onChange={(e) => setRobotDesign({ ...robotDesign, elbowLength: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-500">Wrist Link Length (mm) : {robotDesign.wristLength}</label>
              <input 
                type="range" min="20" max="150" value={robotDesign.wristLength}
                onChange={(e) => setRobotDesign({ ...robotDesign, wristLength: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-emerald-300 dark:border-white/5">
            <h3 className="text-[10px] uppercase font-bold text-emerald-700 dark:text-slate-400 tracking-wider">Payload & End Effector</h3>
            
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500">Tool Type</label>
              <select
                value={robotDesign.endEffectorType}
                onChange={(e) => setRobotDesign({ ...robotDesign, endEffectorType: e.target.value as any })}
                className="w-full bg-black/40 border border-emerald-400 dark:border-white/10 rounded px-2 py-1.5 text-xs font-mono"
              >
                <option value="gripper">Pneumatic Gripper</option>
                <option value="suction">Vacuum Suction Cup</option>
                <option value="welding">Arc Welding Torch</option>
                <option value="camera">Inspection Camera</option>
                <option value="vacuum">Domestic Vacuum Head</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-500">Max Payload Weight (kg) : {robotDesign.payloadWeight}</label>
              <input 
                type="range" min="0.5" max="50" step="0.5" value={robotDesign.payloadWeight}
                onChange={(e) => setRobotDesign({ ...robotDesign, payloadWeight: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-emerald-300 dark:border-white/5">
            <h3 className="text-[10px] uppercase font-bold text-emerald-700 dark:text-slate-400 tracking-wider">Sensors & Power</h3>
            
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500">Vision System</label>
              <select
                value={robotDesign.visionSensorType}
                onChange={(e) => setRobotDesign({ ...robotDesign, visionSensorType: e.target.value as any })}
                className="w-full bg-black/40 border border-emerald-400 dark:border-white/10 rounded px-2 py-1.5 text-xs font-mono"
              >
                <option value="rgbd">RGB-D Depth Camera</option>
                <option value="lidar_2d">2D SLAM LiDAR</option>
                <option value="lidar_3d">3D Velodyne LiDAR</option>
                <option value="color">Simple RGB Color Sensor</option>
              </select>
            </div>

            <div className="flex items-center mt-2">
              <input 
                type="checkbox" 
                checked={robotDesign.hasAIVisionModel}
                onChange={(e) => setRobotDesign({ ...robotDesign, hasAIVisionModel: e.target.checked })}
                className="mr-2"
              />
              <label className="text-[10px] text-slate-500">Enable Neural Vision AI Processing</label>
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500">Battery Capacity (Wh) : {robotDesign.batteryCapacity}</label>
              <input 
                type="range" min="100" max="2000" step="50" value={robotDesign.batteryCapacity}
                onChange={(e) => setRobotDesign({ ...robotDesign, batteryCapacity: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>

        </div>
      </div>

      <div className="flex-1 relative bg-[#0d0d0f]">
        <Robot3DCanvas robotDesign={robotDesign} />
        
        {/* Overlay the stats on top of the 3D Canvas */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 pointer-events-none z-10">
           <div className="flex flex-col items-center">
             <h3 className="text-xl font-bold text-white tracking-widest font-mono uppercase drop-shadow-md">{(robotDesign.chassisType || '').replace('_', ' ')}</h3>
             <div className="flex space-x-4 mt-2 text-[10px] font-mono text-emerald-900 dark:text-slate-200 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-emerald-400 dark:border-white/10 shadow-lg">
                <span className="flex items-center"><Move className="w-3 h-3 mr-1 text-teal-400" /> Reach: {robotDesign.shoulderLength + robotDesign.elbowLength + robotDesign.wristLength}mm</span>
                <span className="flex items-center"><Zap className="w-3 h-3 mr-1 text-amber-400" /> Power: {robotDesign.batteryCapacity}Wh</span>
                <span className="flex items-center"><Activity className="w-3 h-3 mr-1 text-rose-400" /> Payload: {robotDesign.payloadWeight}kg</span>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}

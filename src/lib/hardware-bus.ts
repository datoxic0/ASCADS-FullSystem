import { create } from 'zustand';

// Define the global hardware signals that can be written/read by any module
export interface HardwareState {
  // Analog Bus
  analogOut: Record<string, number>;
  analogIn: Record<string, number>;

  // PLC Bus
  plcOut: Record<string, boolean>;
  plcIn: Record<string, boolean>;

  // Robot Bus
  robotTargetAngles: Record<string, number>;
  robotCurrentAngles: Record<string, number>;
  robotSensors: Record<string, number>; // e.g. proximity sensors, limits

  // Actions
  setAnalogOut: (id: string, value: number) => void;
  setAnalogOutputs: (outputs: Record<string, number>) => void;
  setAnalogIn: (id: string, value: number) => void;
  setPlcOut: (id: string, value: boolean) => void;
  setPlcIn: (id: string, value: boolean) => void;
  setRobotTargetAngle: (jointId: string, angle: number) => void;
  setRobotCurrentAngle: (jointId: string, angle: number) => void;
  setRobotSensor: (sensorId: string, state: number) => void;
  setRobotSensors: (sensors: Record<string, number>) => void;
}

export const useHardwareBus = create<HardwareState>((set) => ({
  analogOut: {},
  analogIn: {},
  plcOut: {},
  plcIn: {},
  robotTargetAngles: {},
  robotCurrentAngles: {},
  robotSensors: {},

  setAnalogOut: (id, value) => set((state) => ({ analogOut: { ...state.analogOut, [id]: value } })),
  setAnalogOutputs: (outputs) => set((state) => ({ analogOut: { ...state.analogOut, ...outputs } })),
  setAnalogIn: (id, value) => set((state) => ({ analogIn: { ...state.analogIn, [id]: value } })),
  
  setPlcOut: (id, value) => set((state) => ({ plcOut: { ...state.plcOut, [id]: value } })),
  setPlcIn: (id, value) => set((state) => ({ plcIn: { ...state.plcIn, [id]: value } })),

  setRobotTargetAngle: (jointId, angle) => set((state) => ({ robotTargetAngles: { ...state.robotTargetAngles, [jointId]: angle } })),
  setRobotCurrentAngle: (jointId, angle) => set((state) => ({ robotCurrentAngles: { ...state.robotCurrentAngles, [jointId]: angle } })),
  setRobotSensor: (sensorId, stateVal) => set((state) => ({ robotSensors: { ...state.robotSensors, [sensorId]: stateVal } })),
  setRobotSensors: (sensors) => set((state) => ({ robotSensors: { ...state.robotSensors, ...sensors } }))
}));

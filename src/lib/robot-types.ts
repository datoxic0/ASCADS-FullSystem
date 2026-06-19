/* --------------------------------------------------------------------------
   Robot Workspace IDE Types
   -------------------------------------------------------------------------- */

export interface RobotJoint {
  id: string;
  name: string;
  type: 'revolute' | 'prismatic';
  length: number; // mm
  angle: number; // degrees
  minAngle: number;
  maxAngle: number;
  color: string;
}

export interface RobotDesignConfig {
  baseX: number;
  baseY: number;
  joints: RobotJoint[];
  endEffector: 'gripper' | 'welder' | 'pen' | 'camera' | 'vacuum';
  name: string;
}

export interface CIMWorkpiece {
  id: string;
  x: number;
  y: number;
  color: string;
  type: 'raw' | 'processed' | 'sorted' | 'rejected';
  timestamp: number;
}

export type RobotBoard = 'arduino' | 'stm32' | 'plc' | 'raspberry' | 'esp32';
export type RobotLanguage = 'cpp' | 'python' | 'ladder' | 'structured-text';

export interface RobotProgram {
  id: string;
  name: string;
  board: RobotBoard;
  language: RobotLanguage;
  code: string;
  isActive: boolean;
}

export interface RobotSimulationState {
  isRunning: boolean;
  speed: number;
  cycleTime: number;
  totalProcessed: number;
  totalRejected: number;
  workpieces: CIMWorkpiece[];
  conveyorSpeed: number;
  currentColor: string;
  visionActive: boolean;
  errors: string[];
}

export interface VisionConfig {
  cameraWidth: number;
  cameraHeight: number;
  threshold: number;
  blurRadius: number;
  detectColors: string[];
}

export const BOARD_NAMES: Record<RobotBoard, string> = {
  arduino: 'Arduino Uno',
  stm32: 'STM32 Nucleo',
  plc: 'Allen-Bradley L85',
  raspberry: 'Raspberry Pi 4',
  esp32: 'ESP32 DevKit',
};

export const LANGUAGE_NAMES: Record<RobotLanguage, string> = {
  cpp: 'C++',
  python: 'Python',
  ladder: 'Ladder Logic',
  'structured-text': 'Structured Text',
};

export const DEFAULT_ROBOT_PROGRAMS: RobotProgram[] = [
  {
    id: 'p1', name: 'Pick & Place', board: 'arduino', language: 'cpp',
    code: `// Pick and Place Robot
#include <Servo.h>

Servo base, shoulder, elbow, gripper;

void setup() {
  base.attach(9);
  shoulder.attach(10);
  elbow.attach(11);
  gripper.attach(12);
}

void loop() {
  // Home position
  base.write(90);
  shoulder.write(90);
  elbow.write(90);
  gripper.write(0);
  delay(1000);
  
  // Pick
  gripper.write(90);
  delay(500);
  
  // Move
  base.write(45);
  delay(1000);
  
  // Place
  gripper.write(0);
  delay(500);
}`,
    isActive: true,
  },
  {
    id: 'p2', name: 'Color Sorting', board: 'arduino', language: 'cpp',
    code: `// Color Sorting with Vision Sensor
#include <Servo.h>

Servo sorter, conveyor;
const int COLOR_SENSOR = A0;

void setup() {
  Serial.begin(9600);
  sorter.attach(9);
  conveyor.attach(10);
}

void loop() {
  int color = analogRead(COLOR_SENSOR);
  
  if (color > 800) {
    // Red detected
    sorter.write(45);
    Serial.println("RED: Bin A");
  } else if (color > 500) {
    // Green detected
    sorter.write(90);
    Serial.println("GREEN: Bin B");
  } else {
    // Blue detected
    sorter.write(135);
    Serial.println("BLUE: Bin C");
  }
  
  conveyor.write(90);
  delay(2000);
}`,
    isActive: false,
  },
  {
    id: 'p3', name: 'PLC Conveyor', board: 'plc', language: 'ladder',
    code: `(* PLC Conveyor Control *)

| I:0/0 | --[ ]-- | --[ ]-- | --( )-- | O:0/0 |
START_PB  STOP_PB   MOTOR_RUN   MOTOR

| I:0/2 | --[ ]-- | --( )-- | O:0/2 |
SENSOR    SOLENOID

| I:0/3 | --[ ]-- | --( )-- | O:0/3 |
COLOR_RED RED_BIN

| I:0/4 | --[ ]-- | --( )-- | O:0/4 |
COLOR_GRN GREEN_BIN`,
    isActive: false,
  },
];

export const DEFAULT_ROBOT_CONFIG: RobotDesignConfig = {
  baseX: 400,
  baseY: 400,
  name: 'Industrial 6-DOF Arm',
  endEffector: 'gripper',
  joints: [
    { id: 'j1', name: 'Base', type: 'revolute', length: 120, angle: 0, minAngle: -180, maxAngle: 180, color: '#3b82f6' },
    { id: 'j2', name: 'Shoulder', type: 'revolute', length: 180, angle: 45, minAngle: -90, maxAngle: 90, color: '#10b981' },
    { id: 'j3', name: 'Elbow', type: 'revolute', length: 150, angle: -30, minAngle: -135, maxAngle: 0, color: '#f59e0b' },
    { id: 'j4', name: 'Wrist', type: 'revolute', length: 80, angle: 0, minAngle: -180, maxAngle: 180, color: '#ef4444' },
  ],
};

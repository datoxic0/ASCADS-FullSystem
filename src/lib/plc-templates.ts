import { LadderState } from "@/lib/plc-types";

export const MOTOR_STARTER_TEMPLATE: LadderState = {
  nodes: [
    { id: "n1", type: "contact-no", x: 96, y: 48, width: 80, height: 40, tag: "Start", address: "I:0/1" },
    { id: "n2", type: "contact-nc", x: 260, y: 48, width: 80, height: 40, tag: "Stop", address: "I:0/2" },
    { id: "n3", type: "coil", x: 420, y: 48, width: 80, height: 40, tag: "Motor", address: "O:0/1" },
    { id: "n4", type: "contact-no", x: 96, y: 144, width: 80, height: 40, tag: "Aux", address: "O:0/1" },
    { id: "w_j1", type: "wire-junction", x: 200, y: 48, width: 16, height: 16, tag: "", address: "" },
    { id: "w_j2", type: "wire-junction", x: 200, y: 144, width: 16, height: 16, tag: "", address: "" }
  ],
  wires: [
    { id: "w1", fromId: "n1", fromSide: "right", toId: "w_j1", toSide: "left", points: [] },
    { id: "w2", fromId: "w_j1", fromSide: "right", toId: "n2", toSide: "left", points: [] },
    { id: "w3", fromId: "n2", fromSide: "right", toId: "n3", toSide: "left", points: [] },
    { id: "w4", fromId: "n4", fromSide: "right", toId: "w_j2", toSide: "left", points: [] },
    { id: "w5", fromId: "w_j2", fromSide: "right", toId: "w_j1", toSide: "left", points: [] }
  ],
  rungComments: { 0: "Motor Starter with Latch" },
  simulation: {
    isRunning: false,
    forcesEnabled: true,
    forces: {},
    values: { "I:0/1": false, "I:0/2": true, "O:0/1": false },
    history: {},
    logs: []
  }
};

export const TRAFFIC_SEQUENCER_TEMPLATE: LadderState = {
  nodes: [
    { id: "timer_ns", type: "timer-on", x: 96, y: 48, width: 80, height: 40, tag: "N/S Timer", address: "T4:0", params: { preset: 5, timeBase: "s" } },
    { id: "timer_ew", type: "timer-on", x: 96, y: 144, width: 80, height: 40, tag: "E/W Timer", address: "T4:1", params: { preset: 5, timeBase: "s" } },
    { id: "ns_dn", type: "contact-no", x: 260, y: 144, width: 80, height: 40, tag: "N/S Done", address: "T4:0_DN" },
    { id: "ew_dn", type: "contact-nc", x: 260, y: 48, width: 80, height: 40, tag: "E/W Done", address: "T4:1_DN" },
    { id: "green_ns", type: "coil", x: 420, y: 48, width: 80, height: 40, tag: "N/S Green", address: "O:0/1" },
    { id: "red_ew", type: "coil", x: 580, y: 48, width: 80, height: 40, tag: "E/W Red", address: "O:0/2" },
    { id: "green_ew", type: "coil", x: 420, y: 144, width: 80, height: 40, tag: "E/W Green", address: "O:0/3" },
    { id: "red_ns", type: "coil", x: 580, y: 144, width: 80, height: 40, tag: "N/S Red", address: "O:0/4" }
  ],
  wires: [
    { id: "w1", fromId: "timer_ns", fromSide: "right", toId: "ew_dn", toSide: "left", points: [] },
    { id: "w2", fromId: "ew_dn", fromSide: "right", toId: "green_ns", toSide: "left", points: [] },
    { id: "w3", fromId: "green_ns", fromSide: "right", toId: "red_ew", toSide: "left", points: [] },
    { id: "w4", fromId: "timer_ew", fromSide: "right", toId: "ns_dn", toSide: "left", points: [] },
    { id: "w5", fromId: "ns_dn", fromSide: "right", toId: "green_ew", toSide: "left", points: [] },
    { id: "w6", fromId: "green_ew", fromSide: "right", toId: "red_ns", toSide: "left", points: [] }
  ],
  rungComments: { 0: "N/S Traffic Phase", 1: "E/W Traffic Phase" },
  simulation: {
    isRunning: false,
    forcesEnabled: true,
    forces: {},
    values: { "O:0/1": true, "O:0/2": true, "O:0/3": false, "O:0/4": false },
    history: {},
    logs: []
  }
};

export const LED_BLINKER_TEMPLATE = {
  sheets: [
    {
      id: "sheet1",
      name: "Main",
      design: {
        components: [
          { id: "vcc", type: "BATTERY", label: "VCC", properties: { voltage: 5 }, x: 400, y: 100, rotation: 0 },
          { id: "gnd", type: "GROUND", label: "GND", properties: {}, x: 400, y: 500, rotation: 0 },
          { id: "ne555", type: "INTEGRATED_CIRCUIT", label: "NE555", properties: { model: "NE555" }, x: 400, y: 300, rotation: 0 },
          { id: "led", type: "LED", label: "LED1", properties: { color: "Red" }, x: 600, y: 300, rotation: 0 },
          { id: "r1", type: "RESISTOR", label: "R1", properties: { resistance: 10000 }, x: 200, y: 150, rotation: 0 },
          { id: "r2", type: "RESISTOR", label: "R2", properties: { resistance: 100000 }, x: 200, y: 250, rotation: 0 },
          { id: "c1", type: "CAPACITOR", label: "C1", properties: { capacitance: 0.00001 }, x: 200, y: 400, rotation: 0 }
        ],
        connections: [
          { id: "e1", from: "vcc", fromPin: 0, to: "ne555", toPin: 7 },
          { id: "e2", from: "vcc", fromPin: 0, to: "ne555", toPin: 3 },
          { id: "e3", from: "ne555", fromPin: 0, to: "gnd", toPin: 0 },
          { id: "e4", from: "vcc", fromPin: 0, to: "r1", toPin: 0 },
          { id: "e5", from: "r1", fromPin: 1, to: "ne555", toPin: 6 },
          { id: "e6", from: "r1", fromPin: 1, to: "r2", toPin: 0 },
          { id: "e7", from: "r2", fromPin: 1, to: "ne555", toPin: 5 },
          { id: "e8", from: "r2", fromPin: 1, to: "ne555", toPin: 1 },
          { id: "e9", from: "r2", fromPin: 1, to: "c1", toPin: 0 },
          { id: "e10", from: "c1", fromPin: 1, to: "gnd", toPin: 0 },
          { id: "e11", from: "ne555", fromPin: 2, to: "led", toPin: 0 },
          { id: "e12", from: "led", fromPin: 1, to: "gnd", toPin: 0 }
        ]
      }
    }
  ]
};

export const POWER_SUPPLY_TEMPLATE = {
  sheets: [
    {
      id: "sheet1",
      name: "Main",
      design: {
        components: [
          { id: "bat", type: "BATTERY", label: "9V Battery", properties: { voltage: 9 }, x: 200, y: 300, rotation: 0 },
          { id: "sw", type: "SWITCH", label: "Power Switch", properties: {}, x: 300, y: 200, rotation: 0 },
          { id: "reg", type: "VOLTAGE_REGULATOR", label: "7805", properties: { model: "L7805", Vout: 5 }, x: 500, y: 300, rotation: 0 },
          { id: "cin", type: "CAPACITOR", label: "Cin", properties: { capacitance: 0.00000033 }, x: 400, y: 400, rotation: 0 },
          { id: "cout", type: "CAPACITOR", label: "Cout", properties: { capacitance: 0.0000001 }, x: 600, y: 400, rotation: 0 },
          { id: "led", type: "LED", label: "Power LED", properties: { color: "Green" }, x: 700, y: 300, rotation: 0 },
          { id: "r", type: "RESISTOR", label: "R", properties: { resistance: 330 }, x: 700, y: 200, rotation: 0 },
          { id: "gnd", type: "GROUND", label: "GND", properties: {}, x: 500, y: 500, rotation: 0 }
        ],
        connections: [
          { id: "e1", from: "bat", fromPin: 0, to: "sw", toPin: 0 },
          { id: "e2", from: "sw", fromPin: 1, to: "reg", toPin: 0 },
          { id: "e3", from: "sw", fromPin: 1, to: "cin", toPin: 0 },
          { id: "e4", from: "cin", fromPin: 1, to: "gnd", toPin: 0 },
          { id: "e5", from: "bat", fromPin: 1, to: "gnd", toPin: 0 },
          { id: "e6", from: "reg", fromPin: 1, to: "gnd", toPin: 0 },
          { id: "e7", from: "reg", fromPin: 2, to: "cout", toPin: 0 },
          { id: "e8", from: "cout", fromPin: 1, to: "gnd", toPin: 0 },
          { id: "e9", from: "reg", fromPin: 2, to: "r", toPin: 0 },
          { id: "e10", from: "r", fromPin: 1, to: "led", toPin: 0 },
          { id: "e11", from: "led", fromPin: 1, to: "gnd", toPin: 0 }
        ]
      }
    }
  ]
};

export const ARDUINO_SHIELD_TEMPLATE = {
  sheets: [
    {
      id: "sheet1",
      name: "Main",
      design: {
        components: [
          { id: "mcu", type: "INTEGRATED_CIRCUIT", label: "ATmega328P", properties: { model: "ATmega328P" }, x: 500, y: 300, rotation: 0 },
          { id: "vcc", type: "BATTERY", label: "VCC", properties: { voltage: 5 }, x: 500, y: 150, rotation: 0 },
          { id: "gnd", type: "GROUND", label: "GND", properties: {}, x: 500, y: 500, rotation: 0 },
          { id: "btn", type: "PUSH_BUTTON", label: "Reset", properties: {}, x: 300, y: 200, rotation: 0 },
          { id: "r_rst", type: "RESISTOR", label: "R_Pullup", properties: { resistance: 10000 }, x: 400, y: 150, rotation: 0 },
          { id: "xtal", type: "SIGNAL_GENERATOR", label: "16MHz", properties: { frequency: 16000000 }, x: 300, y: 400, rotation: 0 },
          { id: "c1", type: "CAPACITOR", label: "22pF", properties: { capacitance: 0.000000000022 }, x: 200, y: 450, rotation: 0 },
          { id: "c2", type: "CAPACITOR", label: "22pF", properties: { capacitance: 0.000000000022 }, x: 400, y: 450, rotation: 0 }
        ],
        connections: [
          { id: "e1", from: "vcc", fromPin: 0, to: "mcu", toPin: 7 },
          { id: "e2", from: "vcc", fromPin: 0, to: "mcu", toPin: 6 },
          { id: "e3", from: "mcu", fromPin: 0, to: "gnd", toPin: 0 },
          { id: "e4", from: "vcc", fromPin: 0, to: "r_rst", toPin: 0 },
          { id: "e5", from: "r_rst", fromPin: 1, to: "mcu", toPin: 1 },
          { id: "e6", from: "btn", fromPin: 0, to: "mcu", toPin: 1 },
          { id: "e7", from: "btn", fromPin: 1, to: "gnd", toPin: 0 },
          { id: "e8", from: "xtal", fromPin: 0, to: "mcu", toPin: 2 },
          { id: "e9", from: "xtal", fromPin: 1, to: "mcu", toPin: 3 }
        ]
      }
    }
  ]
};

export const PICK_AND_PLACE_TEMPLATE = {
  data: {
    files: [
      {
        id: "main.py",
        name: "pick_and_place.py",
        language: "python",
        content: `import robot_api as rbt
import time

def sequence():
    print("Initializing Pick & Place Sequence...")
    rbt.move_j(0, -90, 90, 0, speed=50)
    
    # Move to pickup location
    rbt.move_l(200, 0, 100, speed=100)
    rbt.grip(True)
    time.sleep(0.5)
    
    # Lift and move to drop location
    rbt.move_l(200, 0, 200, speed=100)
    rbt.move_l(-200, 0, 200, speed=100)
    rbt.move_l(-200, 0, 100, speed=100)
    
    # Drop item
    rbt.grip(False)
    time.sleep(0.5)
    
    # Return to home
    rbt.move_j(0, -90, 90, 0, speed=50)
    print("Sequence Complete.")

if __name__ == "__main__":
    sequence()
`
      }
    ]
  }
};

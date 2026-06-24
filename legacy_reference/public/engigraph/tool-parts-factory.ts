import paper from 'https://esm.sh/paper';

/**
 * Registry of complex geometry definitions for components
 * Provides precise engineering footprints and metadata.
 */
export const PartFactory = {
    _applyStyle: (item, color = '#ffffff') => {
        if (item.children) {
            item.children.forEach(c => PartFactory._applyStyle(c, color));
        } else {
            item.strokeColor = color;
            item.strokeWidth = item.strokeWidth || 1;
        }
    },

    createCenterLine: (center, length, color = '#00aaff') => {
        const g = new paper.Group();
        const h = new paper.Path.Line(center.add([-length/2, 0]), center.add([length/2, 0]));
        const v = new paper.Path.Line(center.add([0, -length/2]), center.add([0, length/2]));
        [h,v].forEach(l => { 
            l.strokeColor = color; 
            l.strokeWidth = 0.5; 
            l.dashArray = [8, 2, 2, 2];
        });
        g.addChildren([h, v]);
        return g;
    },

    nema17: (group, color) => {
        const body = new paper.Path.Rectangle(new paper.Point(-21.15, -21.15), new paper.Size(42.3, 42.3));
        const boss = new paper.Path.Circle(new paper.Point(0, 0), 11);
        const shaft = new paper.Group([
            new paper.Path.Circle(new paper.Point(0, 0), 2.5),
            new paper.Path.Line([0, 0], [0, -10]) // Pointer for visibility
        ]);
        shaft.data.role = 'shaft';
        const holes = [ [-15.5, -15.5], [15.5, -15.5], [15.5, 15.5], [-15.5, 15.5] ].map(p => {
            const c = new paper.Path.Circle(new paper.Point(p), 1.5);
            const cl = PartFactory.createCenterLine(new paper.Point(p), 6, color);
            return new paper.Group([c, cl]);
        });
        group.addChildren([body, boss, shaft, ...holes, PartFactory.createCenterLine(new paper.Point(0,0), 50, color)]);
        group.data.metadata = "NEMA 17 Stepper Motor. 42.3mm sq. 31mm hole spacing.";
        group.data.speed = 2;
        group.data.powerDrawMA = 1200; // Typical holding current
        PartFactory._applyStyle(group, color);
    },

    arduino_uno: (group, color) => {
        const pcb = new paper.Path.Rectangle(new paper.Point(-34.3, -26.7), new paper.Size(68.6, 53.3));
        pcb.fillColor = 'rgba(0, 100, 150, 0.2)';
        const usb = new paper.Path.Rectangle(new paper.Point(-37, -20), new paper.Size(16, 12));
        const power = new paper.Path.Rectangle(new paper.Point(-37, 8), new paper.Size(14, 9));
        const icsp = new paper.Path.Rectangle(new paper.Point(28, -2), new paper.Size(4, 6));
        const chip = new paper.Path.Rectangle(new paper.Point(-5, -5), new paper.Size(25, 10));
        const header1 = new paper.Path.Rectangle(new paper.Point(-10, -25), new paper.Size(40, 3));
        const header2 = new paper.Path.Rectangle(new paper.Point(-10, 22), new paper.Size(35, 3));
        
        const mountHoles = [ [-19.05, -21.59], [31.75, -12.7], [31.75, 19.05], [-15.24, 24.13] ].map(p => new paper.Path.Circle(new paper.Point(p), 1.6));
        
        group.addChildren([pcb, usb, power, icsp, chip, header1, header2, ...mountHoles]);
        group.data.metadata = "Arduino Uno Rev3. 68.6 x 53.3 mm. Standard Shield Footprint.";
        group.data.powerDrawMA = 50;
        PartFactory._applyStyle(group, color);
    },

    lcd_1602: (group, color) => {
        const lcdPcb = new paper.Path.Rectangle(new paper.Point(-40, -18), new paper.Size(80, 36));
        lcdPcb.fillColor = 'rgba(0,0,0,0.4)';
        const lcdBezel = new paper.Path.Rectangle(new paper.Point(-35.5, -13), new paper.Size(71, 26));
        const lcdGlass = new paper.Path.Rectangle(new paper.Point(-32.25, -7.25), new paper.Size(64.5, 14.5));
        const lcdHoles = [ [-37.5, -15.5], [37.5, -15.5], [37.5, 15.5], [-37.5, 15.5] ].map(p => new paper.Path.Circle(new paper.Point(p), 1.5));
        const lcdPins = new paper.Group();
        for(let i=0; i<16; i++) {
            lcdPins.addChild(new paper.Path.Circle(new paper.Point(-35 + i*2.54, -16), 0.5));
        }
        group.addChildren([lcdPcb, lcdBezel, lcdGlass, ...lcdHoles, lcdPins]);
        group.data.metadata = "16x2 Character LCD Module. HD44780 compliant. 80x36mm.";
        PartFactory._applyStyle(group, color);
    },

    esp32: (group, color) => {
        const espPcb = new paper.Path.Rectangle(new paper.Point(-14, -24), new paper.Size(28, 48));
        espPcb.fillColor = 'rgba(50, 50, 50, 0.4)';
        const espModule = new paper.Path.Rectangle(new paper.Point(-9, -22), new paper.Size(18, 25.5));
        const antenna = new paper.Path.Rectangle(new paper.Point(-8, -21), new paper.Size(16, 5));
        antenna.strokeWidth = 0.5;
        antenna.dashArray = [1, 1];
        const espUsb = new paper.Path.Rectangle(new paper.Point(-4, 21), new paper.Size(8, 5));
        const pinStrip1 = new paper.Path.Rectangle(new paper.Point(-13, -20), new paper.Size(2.5, 40));
        const pinStrip2 = new paper.Path.Rectangle(new paper.Point(10.5, -20), new paper.Size(2.5, 40));
        
        group.addChildren([espPcb, espModule, antenna, espUsb, pinStrip1, pinStrip2]);
        group.data.metadata = "ESP32 DevKit V1. 30 GPIO. WiFi/BT enabled SoC.";
        group.data.powerDrawMA = 80;
        PartFactory._applyStyle(group, color);
    },

    keypad_4x4: (group, color) => {
        const kpPcb = new paper.Path.Rectangle(new paper.Point(-38.5, -34.5), new paper.Size(77, 69));
        const bezel = new paper.Path.Rectangle(new paper.Point(-35, -30), new paper.Size(70, 60));
        const buttons = [];
        for(let row=0; row<4; row++) {
            for(let col=0; col<4; col++) {
                const b = new paper.Path.Rectangle(new paper.Point(-30+col*17.5, -25+row*15), new paper.Size(12, 10));
                b.strokeWidth = 0.5;
                buttons.push(b);
            }
        }
        const connector = new paper.Path.Rectangle(new paper.Point(-10, 30), new paper.Size(20, 4));
        group.addChildren([kpPcb, bezel, ...buttons, connector]);
        group.data.metadata = "4x4 Matrix Keypad. Membrane type. 77x69mm.";
        PartFactory._applyStyle(group, color);
    },

    breadboard_half: (group, color) => {
        const board = new paper.Path.Rectangle(new paper.Point(-41, -27), new paper.Size(82, 54));
        const groove = new paper.Path.Rectangle(new paper.Point(-41, -1), new paper.Size(82, 2));
        groove.fillColor = 'rgba(0,0,0,0.1)';
        const holes = [];
        // Power rails
        for(let x = -38; x <= 38; x += 2.54) {
            holes.push(new paper.Path.Circle([x, -24], 0.5));
            holes.push(new paper.Path.Circle([x, -21], 0.5));
            holes.push(new paper.Path.Circle([x, 21], 0.5));
            holes.push(new paper.Path.Circle([x, 24], 0.5));
        }
        // Main grid
        for(let x = -38; x <= 38; x += 2.54) {
            for(let y = -15; y <= -5; y += 2.54) holes.push(new paper.Path.Circle([x, y], 0.5));
            for(let y = 5; y <= 15; y += 2.54) holes.push(new paper.Path.Circle([x, y], 0.5));
        }
        group.addChildren([board, groove, ...holes]);
        group.data.metadata = "Half-size Breadboard. 400 tie-points. 82x54mm.";
        PartFactory._applyStyle(group, color);
    },

    dc_motor_generic: (group, color) => {
        const body = new paper.Path.Circle([0, 0], 12);
        const shaft = new paper.Group([
            new paper.Path.Circle([0, 0], 2),
            new paper.Path.Line([0, 0], [0, -6])
        ]);
        shaft.data.role = 'shaft';
        const flat1 = new paper.Path.Line([-12, -8], [12, -8]);
        const flat2 = new paper.Path.Line([-12, 8], [12, 8]);
        const terminals = [
            new paper.Path.Rectangle([-15, -4], [3, 8]),
            new paper.Path.Rectangle([12, -4], [3, 8])
        ];
        group.addChildren([body, shaft, flat1, flat2, ...terminals]);
        group.data.metadata = "Generic DC Toy Motor. 24mm diameter.";
        group.data.speed = 10;
        PartFactory._applyStyle(group, color);
    },

    rpi_pico: (group, color) => {
        const picoPcb = new paper.Path.Rectangle(new paper.Point(-10.5, -25.5), new paper.Size(21, 51));
        const picoUsb = new paper.Path.Rectangle(new paper.Point(-3.5, -27), new paper.Size(7, 5));
        const picoHoles = [ [-9, -24], [9, -24], [9, 24], [-9, 24] ].map(p => new paper.Path.Circle(new paper.Point(p), 1.05));
        group.addChildren([picoPcb, picoUsb, ...picoHoles]);
        group.data.metadata = "Raspberry Pi Pico. 21 x 51 mm.";
        PartFactory._applyStyle(group, color);
    },

    servo_sg90: (group, color) => {
        const sBody = new paper.Path.Rectangle(new paper.Point(-11.25, -6), new paper.Size(22.5, 12));
        const sFlange = new paper.Path.Rectangle(new paper.Point(-16.25, -6), new paper.Size(32.5, 12));
        const sHorn = new paper.Group([
            new paper.Path.Circle(new paper.Point(5.75, 0), 2.5),
            new paper.Path.Line([5.75, 0], [15.75, 0])
        ]);
        sHorn.data.role = 'horn';
        const sHoles = [ [-14, 0], [14, 0] ].map(p => new paper.Path.Circle(new paper.Point(p), 1));
        group.addChildren([sFlange, sBody, sHorn, ...sHoles]);
        group.data.metadata = "TowerPro SG90 Micro Servo. 0-180° Range.";
        group.data.targetAngle = 90;
        group.data.currentAngle = 0;
        group.data.powerDrawMA = 250; // Average move current
        PartFactory._applyStyle(group, color);
    },

    hcsr04: (group, color) => {
        const hPcb = new paper.Path.Rectangle(new paper.Point(-22.5, -10), new paper.Size(45, 20));
        const eyeL = new paper.Path.Circle(new paper.Point(-13, 0), 8);
        const eyeR = new paper.Path.Circle(new paper.Point(13, 0), 8);
        const hHeader = new paper.Path.Rectangle(new paper.Point(-5, 7), new paper.Size(10, 2.5));
        group.addChildren([hPcb, eyeL, eyeR, hHeader]);
        group.data.metadata = "HC-SR04 Ultrasonic Sensor. 45 x 20 mm.";
        PartFactory._applyStyle(group, color);
    },

    bearing_608: (group, color) => {
        const od = new paper.Path.Circle(new paper.Point(0,0), 11);
        const id = new paper.Path.Circle(new paper.Point(0,0), 4);
        const cage = new paper.Path.Circle(new paper.Point(0,0), 7.5);
        cage.dashArray = [1, 2];
        group.addChildren([od, id, cage]);
        group.data.metadata = "608 Ball Bearing. OD: 22mm, ID: 8mm.";
        PartFactory._applyStyle(group, color);
    },

    battery_18650: (group, color) => {
        const bSide = new paper.Path.Rectangle(new paper.Point(-9, -32.5), new paper.Size(18, 65));
        const bNub = new paper.Path.Rectangle(new paper.Point(-4, -34), new paper.Size(8, 2));
        group.addChildren([bSide, bNub]);
        group.data.metadata = "18650 Li-ion Battery / DC Source.";
        group.data.capacityMAH = 2600;
        group.data.voltage = 3.7;
        PartFactory._applyStyle(group, color);
    },

    resistor: (group, color) => {
        const rBody = new paper.Path.Rectangle(new paper.Point(-10, -3), new paper.Size(20, 6));
        const rLine = new paper.Path.Line([-20, 0], [20, 0]);
        const bands = [ [-6, -3], [-2, -3], [2, -3] ].map(p => new paper.Path.Rectangle(new paper.Point(p), new paper.Size(2, 6)));
        bands.forEach((b, i) => b.fillColor = ['#8B4513', '#FF0000', '#FFA500'][i]);
        group.addChildren([rLine, rBody, ...bands]);
        group.data.metadata = "Precision Resistor.";
        group.data.resistance = 1000;
        PartFactory._applyStyle(group, color);
    },

    led_red: (group, color) => {
        const lAnode = new paper.Path.Line([-15, 0], [-5, 0]);
        const lCathode = new paper.Path.Line([5, 0], [15, 0]);
        const lTri = new paper.Path({ segments: [[-5, -5], [-5, 5], [5, 0]], closed: true });
        const lBar = new paper.Path.Line([5, -5], [5, 5]);
        const lBulb = new paper.Path.Circle([0,0], 8);
        lBulb.data.role = 'bulb';
        group.addChildren([lAnode, lCathode, lTri, lBar, lBulb]);
        group.data.metadata = "LED (Red) - 5V Logic Compatible.";
        PartFactory._applyStyle(group, color);
    },

    switch_spst: (group, color) => {
        const sLine1 = new paper.Path.Line([-15, 0], [-5, 0]);
        const sLine2 = new paper.Path.Line([5, 0], [15, 0]);
        const sLever = new paper.Path.Line([-5, 0], [5, -8]);
        sLever.data.role = 'lever';
        group.addChildren([sLine1, sLine2, sLever]);
        group.data.metadata = "SPST Toggle Switch.";
        group.data.state = 'open';
        PartFactory._applyStyle(group, color);
    },

    ground: (group, color) => {
        const gLine = new paper.Path.Line([0, 0], [0, -10]);
        const gBar1 = new paper.Path.Line([-8, 0], [8, 0]);
        const gBar2 = new paper.Path.Line([-5, 3], [5, 3]);
        const gBar3 = new paper.Path.Line([-2, 6], [2, 6]);
        group.addChildren([gLine, gBar1, gBar2, gBar3]);
        group.data.metadata = "Ground Reference (0V).";
        PartFactory._applyStyle(group, color);
    },

    button: (group, color) => {
        const bLine1 = new paper.Path.Line([-15, 0], [-5, 0]);
        const bLine2 = new paper.Path.Line([5, 0], [15, 0]);
        const bPlunger = new paper.Path.Line([-5, -5], [5, -5]);
        const bStem = new paper.Path.Line([0, -5], [0, -10]);
        const bCap = new paper.Path.Rectangle(new paper.Point(-4, -12), new paper.Size(8, 2));
        bPlunger.data.role = 'plunger';
        bStem.data.role = 'plunger';
        bCap.data.role = 'plunger';
        group.addChildren([bLine1, bLine2, bPlunger, bStem, bCap]);
        group.data.metadata = "Momentary Push Button.";
        group.data.state = false;
        PartFactory._applyStyle(group, color);
    },

    gate_and: (group, color) => {
        const andBody = new paper.Path({ segments: [[-10, -10], [0, -10], [10, 0], [0, 10], [-10, 10]], closed: true });
        const andIn1 = new paper.Path.Line([-15, -5], [-10, -5]);
        const andIn2 = new paper.Path.Line([-15, 5], [-10, 5]);
        const andOut = new paper.Path.Line([10, 0], [15, 0]);
        group.addChildren([andBody, andIn1, andIn2, andOut]);
        group.data.metadata = "Digital AND Gate.";
        group.data.logicType = 'AND';
        PartFactory._applyStyle(group, color);
    },

    gate_or: (group, color) => {
        const orBody = new paper.Path({ segments: [[-10, -10], [-5, 0], [-10, 10], [5, 10], [10, 0], [5, -10]], closed: true });
        const orIn1 = new paper.Path.Line([-15, -5], [-7, -5]);
        const orIn2 = new paper.Path.Line([-15, 5], [-7, 5]);
        const orOut = new paper.Path.Line([10, 0], [15, 0]);
        group.addChildren([orBody, orIn1, orIn2, orOut]);
        group.data.metadata = "Digital OR Gate.";
        group.data.logicType = 'OR';
        PartFactory._applyStyle(group, color);
    },

    gate_not: (group, color) => {
        const notBody = new paper.Path({ segments: [[-10, -10], [-10, 10], [5, 0]], closed: true });
        const notCircle = new paper.Path.Circle([7, 0], 2);
        const notIn = new paper.Path.Line([-15, 0], [-10, 0]);
        const notOut = new paper.Path.Line([9, 0], [15, 0]);
        group.addChildren([notBody, notCircle, notIn, notOut]);
        group.data.metadata = "Digital NOT Inverter.";
        group.data.logicType = 'NOT';
        PartFactory._applyStyle(group, color);
    },

    gate_xor: (group, color) => {
        const xorBody = new paper.Path({ segments: [[-10, -10], [-5, 0], [-10, 10], [5, 10], [10, 0], [5, -10]], closed: true });
        const xorCurve = new paper.Path({ segments: [[-13, -10], [-8, 0], [-13, 10]] });
        const xorIn1 = new paper.Path.Line([-15, -5], [-9, -5]);
        const xorIn2 = new paper.Path.Line([-15, 5], [-9, 5]);
        const xorOut = new paper.Path.Line([10, 0], [15, 0]);
        group.addChildren([xorBody, xorCurve, xorIn1, xorIn2, xorOut]);
        group.data.metadata = "Digital XOR Gate.";
        group.data.logicType = 'XOR';
        PartFactory._applyStyle(group, color);
    },

    gate_nand: (group, color) => {
        const nandBody = new paper.Path({ segments: [[-10, -10], [0, -10], [10, 0], [0, 10], [-10, 10]], closed: true });
        const nandCircle = new paper.Path.Circle([12, 0], 2);
        const nandIn1 = new paper.Path.Line([-15, -5], [-10, -5]);
        const nandIn2 = new paper.Path.Line([-15, 5], [-10, 5]);
        const nandOut = new paper.Path.Line([14, 0], [15, 0]); // Changed to snap correctly
        group.addChildren([nandBody, nandCircle, nandIn1, nandIn2, nandOut]);
        group.data.metadata = "Digital NAND Gate.";
        group.data.logicType = 'NAND';
        PartFactory._applyStyle(group, color);
    },

    gate_nor: (group, color) => {
        const norBody = new paper.Path({ segments: [[-10, -10], [-5, 0], [-10, 10], [5, 10], [10, 0], [5, -10]], closed: true });
        const norCircle = new paper.Path.Circle([12, 0], 2);
        const norIn1 = new paper.Path.Line([-15, -5], [-7, -5]);
        const norIn2 = new paper.Path.Line([-15, 5], [-7, 5]);
        const norOut = new paper.Path.Line([14, 0], [15, 0]); // Changed to snap correctly
        group.addChildren([norBody, norCircle, norIn1, norIn2, norOut]);
        group.data.metadata = "Digital NOR Gate.";
        group.data.logicType = 'NOR';
        PartFactory._applyStyle(group, color);
    },

    buzzer: (group, color) => {
        const bBody = new paper.Path.Rectangle(new paper.Point(-10, -8), new paper.Size(20, 16));
        const bLine1 = new paper.Path.Line([-15, 0], [-10, 0]);
        const bLine2 = new paper.Path.Line([10, 0], [15, 0]);
        const bSpeaker = new paper.Path({ segments: [[-5, -5], [5, -10], [5, 10], [-5, 5]], closed: true });
        const wave1 = new paper.Path.Arc({from: [8, -5], through: [10, 0], to: [8, 5]});
        const wave2 = new paper.Path.Arc({from: [11, -8], through: [14, 0], to: [11, 8]});
        wave1.data.role = 'wave';
        wave2.data.role = 'wave';
        group.addChildren([bLine1, bLine2, bBody, bSpeaker, wave1, wave2]);
        group.data.metadata = "Active Piezo Buzzer (5V).";
        PartFactory._applyStyle(group, color);
    },

    led_blue: (group, color) => {
        const lAnode = new paper.Path.Line([-15, 0], [-5, 0]);
        const lCathode = new paper.Path.Line([5, 0], [15, 0]);
        const lTri = new paper.Path({ segments: [[-5, -5], [-5, 5], [5, 0]], closed: true });
        const lBar = new paper.Path.Line([5, -5], [5, 5]);
        const lBulb = new paper.Path.Circle([0,0], 8);
        lBulb.data.role = 'bulb';
        lBulb.data.colorType = 'blue';
        group.addChildren([lAnode, lCathode, lTri, lBar, lBulb]);
        group.data.metadata = "LED (Blue) - 5V Logic Compatible.";
        PartFactory._applyStyle(group, color);
    },

    capacitor: (group, color) => {
        const cLine1 = new paper.Path.Line([-15, 0], [-3, 0]);
        const cLine2 = new paper.Path.Line([3, 0], [15, 0]);
        const plate1 = new paper.Path.Line([-3, -10], [-3, 10]);
        const plate2 = new paper.Path.Line([3, -10], [3, 10]);
        group.addChildren([cLine1, cLine2, plate1, plate2]);
        group.data.metadata = "Capacitor.";
        group.data.capacitance = "10uF";
        PartFactory._applyStyle(group, color);
    },

    inductor: (group, color) => {
        const iLine1 = new paper.Path.Line([-20, 0], [-10, 0]);
        const iLine2 = new paper.Path.Line([10, 0], [20, 0]);
        const coil1 = new paper.Path.Arc({from: [-10, 0], through: [-5, -8], to: [0, 0]});
        const coil2 = new paper.Path.Arc({from: [0, 0], through: [5, -8], to: [10, 0]});
        group.addChildren([iLine1, iLine2, coil1, coil2]);
        group.data.metadata = "Inductor.";
        group.data.inductance = "10mH";
        PartFactory._applyStyle(group, color);
    },

    diode: (group, color) => {
        const dAnode = new paper.Path.Line([-15, 0], [-5, 0]);
        const dCathode = new paper.Path.Line([5, 0], [15, 0]);
        const dTri = new paper.Path({ segments: [[-5, -8], [-5, 8], [5, 0]], closed: true });
        const dBar = new paper.Path.Line([5, -8], [5, 8]);
        group.addChildren([dAnode, dCathode, dTri, dBar]);
        group.data.metadata = "Diode (Rectifier/Signal).";
        PartFactory._applyStyle(group, color);
    },

    transistor: (group, color) => {
        const tBase = new paper.Path.Line([-10, 0], [-2, 0]);
        const tBar = new paper.Path.Line([-2, -8], [-2, 8]);
        const tColl = new paper.Path.Line([-2, -5], [8, -10]);
        const tCollPin = new paper.Path.Line([8, -10], [8, -15]);
        const tEmit = new paper.Path.Line([-2, 5], [8, 10]);
        const tEmitPin = new paper.Path.Line([8, 10], [8, 15]);
        const tArrow = new paper.Path({ segments: [[8, 10], [4, 9], [7, 6]], closed: true });
        tArrow.fillColor = color;
        const tCircle = new paper.Path.Circle([2, 0], 12);
        group.addChildren([tBase, tBar, tColl, tCollPin, tEmit, tEmitPin, tArrow, tCircle]);
        group.data.metadata = "NPN Transistor.";
        PartFactory._applyStyle(group, color);
        tArrow.strokeWidth = 0;
    },

    mosfet: (group, color) => {
        const mGate = new paper.Path.Line([-10, 0], [-4, 0]);
        const mGateBar = new paper.Path.Line([-4, -8], [-4, 8]);
        
        const mChan1 = new paper.Path.Line([-2, -8], [-2, -4]);
        const mChan2 = new paper.Path.Line([-2, -2], [-2, 2]);
        const mChan3 = new paper.Path.Line([-2, 4], [-2, 8]);
        
        const mDrain = new paper.Path.Line([-2, -6], [8, -6]);
        const mDrainPin = new paper.Path.Line([8, -6], [8, -15]);
        
        const mSource = new paper.Path.Line([-2, 6], [8, 6]);
        const mSourcePin = new paper.Path.Line([8, 6], [8, 15]);
        
        const mSubstrate = new paper.Path.Line([-2, 0], [8, 0]);
        const mSubArrow = new paper.Path({ segments: [[-2, 0], [2, -2], [2, 2]], closed: true });
        mSubArrow.fillColor = color;
        
        const mBodyDiode = new paper.Path.Line([8, 0], [8, 6]);
        const mCircle = new paper.Path.Circle([2, 0], 12);
        
        group.addChildren([mGate, mGateBar, mChan1, mChan2, mChan3, mDrain, mDrainPin, mSource, mSourcePin, mSubstrate, mSubArrow, mBodyDiode, mCircle]);
        group.data.metadata = "N-Channel MOSFET.";
        PartFactory._applyStyle(group, color);
        mSubArrow.strokeWidth = 0;
    },

    op_amp: (group, color) => {
        const opBody = new paper.Path({ segments: [[-10, -15], [-10, 15], [15, 0]], closed: true });
        const opInInv = new paper.Path.Line([-20, -7], [-10, -7]);
        const opInNonInv = new paper.Path.Line([-20, 7], [-10, 7]);
        const opOut = new paper.Path.Line([15, 0], [25, 0]);
        const opMinus = new paper.Path.Line([-8, -7], [-4, -7]);
        const opPlusH = new paper.Path.Line([-8, 7], [-4, 7]);
        const opPlusV = new paper.Path.Line([-6, 5], [-6, 9]);
        group.addChildren([opBody, opInInv, opInNonInv, opOut, opMinus, opPlusH, opPlusV]);
        group.data.metadata = "Operational Amplifier.";
        PartFactory._applyStyle(group, color);
    },

    voltage_regulator: (group, color) => {
        const vrBody = new paper.Path.Rectangle(new paper.Point(-12, -10), new paper.Size(24, 20));
        const vrIn = new paper.Path.Line([-20, 0], [-12, 0]);
        const vrOut = new paper.Path.Line([12, 0], [20, 0]);
        const vrGnd = new paper.Path.Line([0, 10], [0, 18]);
        group.addChildren([vrBody, vrIn, vrOut, vrGnd]);
        group.data.metadata = "Voltage Regulator.";
        PartFactory._applyStyle(group, color);
    },

    relay: (group, color) => {
        const rBody = new paper.Path.Rectangle(new paper.Point(-15, -12), new paper.Size(30, 24));
        const coil1 = new paper.Path.Line([-15, -6], [-20, -6]);
        const coil2 = new paper.Path.Line([-15, 6], [-20, 6]);
        const coilBox = new paper.Path.Rectangle(new paper.Point(-12, -8), new paper.Size(6, 16));
        
        const swCom = new paper.Path.Line([15, 0], [20, 0]);
        const swNo = new paper.Path.Line([15, -8], [20, -8]);
        const swNc = new paper.Path.Line([15, 8], [20, 8]);
        
        const swLever = new paper.Path.Line([13, 0], [5, 8]);
        
        group.addChildren([rBody, coil1, coil2, coilBox, swCom, swNo, swNc, swLever]);
        group.data.metadata = "SPDT Relay.";
        PartFactory._applyStyle(group, color);
    }
};
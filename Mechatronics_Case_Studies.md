# Mechatronics Three Subjects Learning Case Study

This documentation provides practical assessments and industrial blueprints for the Mechatronics Systems curriculum, covering logic interpretation, electrotechnology, and fluid power.

---

## 1. PLC & Function Block Diagram Interpretation

This module focuses on simplifying physical switching arrangements using standard PLC function block architectures (such as Siemens LOGO!). 

![Intro](/case-studies/image4.png)

### Truth Table Logic

When interpreting Function Block Diagrams, physical inversion bubbles are treated as part of the logic gate rather than physical NC/NO switches.

![TruthTable](/case-studies/image1.png)

For example, given the logic equation:
`Z = AB + A'B'`

The truth table requires only the 2 main inputs:

| A | B | Z |
| - | - | - |
| 0 | 0 | 1 |
| 0 | 1 | 0 |
| 1 | 0 | 0 |
| 1 | 1 | 1 |

![FBD Drawing](/case-studies/image2.png)

---

## 2. Electrotechnology: Stop/FWD/REV DC Motor Control

**Objective:** Implement bidirectional control using 4 relays (R1–R4) and 3 buttons (PB-STOP, PB-FWD, PB-REV).

### Bill of Materials (BOM)
- **Relays (R1–R4):** 4x. R1/R2 handle Forward operation; R3/R4 handle Reverse and interlocking logic.
- **Push Buttons:** 3x. PB-STOP (NC); PB-FWD & PB-REV (NO Momentary).
- **DC Motor:** Primary system load.
- **Power Supply:** Dual source for coils and motor drive.

![Motor Circuit](/case-studies/image7.png)

### Relay Functional Logic:
- **FWD Action:** Pressing PB-FWD energizes R1/R2. R1 connects M+ to supply. R2 NO contacts latch the circuit.
- **REV Action:** PB-REV energizes R3/R4, swapping motor polarity. R4 NO contacts latch the reverse state.
- **Safety Interlock:** The coil for R1/R2 is routed through **R3 NC** contacts; similarly, R3/R4 is routed through **R1 NC**. This prevents short circuits from dual-direction activation.
- **Stop Command:** PB-STOP (NC) is placed in series with all coil paths to break the latches.

### Circuit Schematics

---

## 3. Electro-Pneumatic Single Cycle Diagram

### Problem Statement
A common failure in pneumatic systems is when the cylinder initiates extension upon push-button activation but fails to execute the retraction phase. This is usually caused by an improperly configured return trigger or dual-solenoid activation creating a pneumatic lock.

![Pneumatic Fault](/case-studies/image6.png)

### Core Failure Analysis
Extension succeeds because the `PB → K1 → 1M1` path is valid.
Retraction fails because either the `S2` limit switch fails to switch `K2`, or the `1M1` solenoid is still energized, overriding the pilot pressure of `1M2`.

![SPS](/case-studies/image5.png)

### Corrective Action: Interlocking
Incorporate a **normally closed (NC) K2 contact** to break the `K1/1M1` path. 
When `K2` energizes, it interrupts `K1`, deactivating `1M1`, allowing `1M2` to complete the retraction.

### Final Industrial Sequence Protocol
A single Push Button trigger must execute: **Extension → 1s Dwell at limit → Retraction → Termination at home position.**

1. **Extension** initiated by PB.
2. **Timer** initiated by S2 contact.
3. **Retraction** initiated by Timer completion.
4. **Cycle Terminated** by S1 feedback.

**Simplified Logic Path:**
`PB → K1 (Extension) → S2 Sensor → T1 Timer → T1 Timeout → K2 (Retraction) → S1 (Reset)`

![Final Pneumatic Diagram](/case-studies/image3.png)

## 4. Advanced System Templates & Case Studies

The following advanced blueprints have been designed within ASCADS and are available as reference templates for your projects:

### A. FBD Conveyor Logic Automation
A comprehensive Function Block Diagram implementing sequential logic for a multi-stage conveyor sorting system.
![FBD Conveyor Logic](/fbd_case_study_1782158332093.png)

### B. Motor Star-Delta Starter
A complete industrial motor control schematic for reduced-voltage starting, featuring main, star, and delta contactors with timer interlocks.
![Star-Delta Starter](/motor_star_delta_case_study_1782158350983.png)

### C. Pneumatic Cylinder Sequence Controller
An electro-pneumatic cascade controller designed to orchestrate dual-cylinder operations (A+ B+ A- B-) with limit switch feedback.
![Pneumatic Sequencer](/pneumatic_case_study_1782158367807.png)
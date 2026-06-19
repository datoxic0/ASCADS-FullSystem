import paper from 'https://esm.sh/paper';

/**
 * AI & Communication Manager for EngiGraph Pro
 */
export class AIManager {
    constructor(app) {
        this.app = app;
        this.isLinterActive = false;
        this.linterTimer = null;
    }

    toggleRealtimeLinter(active) {
        this.isLinterActive = active;
        if (active) {
            this.linterTimer = setInterval(() => this.runBackgroundAudit(), 15000); // Audit every 15s
            this.logAI("System", "Real-time AI Linter engaged. Evaluating design for " + this.app.currentStandard + "...");
        } else {
            if (this.linterTimer) clearInterval(this.linterTimer);
            this.linterTimer = null;
        }
    }

    async runBackgroundAudit() {
        // Silent audit that updates a UI element instead of flooding chat
        const res = document.getElementById('validation-results');
        const items = paper.project.layers['geometry_layer']?.children || [];
        if (items.length === 0) return;

        try {
            const completion = await websim.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: `You are a real-time engineering linter. Briefly (10 words max) identify the single biggest design risk in the provided netlist for ${this.app.currentStandard}. If safe, say 'Standard Compliant'.`
                    },
                    {
                        role: "user",
                        content: `Context: ${JSON.stringify(items.slice(0,10).map(i => i.data.partType))}`
                    }
                ]
            });
            const text = completion.content.trim();
            if (res) {
                res.innerHTML = `<div class="ai-linter-indicator"><i data-ai-icon="bot" style="width:12px"></i> ${text}</div>`;
                createIcons({ icons: { Bot }, nameAttr: 'data-ai-icon' });
            }
        } catch (e) {}
    }

    toggleAIModal(show = true) {
        const modal = document.getElementById('ai-modal-overlay');
        if (show) {
            modal.classList.remove('hidden');
            document.getElementById('ai-input').focus();
        } else {
            modal.classList.add('hidden');
        }
    }

    logAI(role, content) {
        const chatBox = document.getElementById('ai-messages');
        if (!chatBox) {
            console.log(`[EngiGraph AI ${role}]: ${content}`);
            return;
        }
        const msgCls = role.toLowerCase().includes('assistant') ? 'bot' : (role.toLowerCase() === 'system' ? 'system' : 'user');
        chatBox.innerHTML += `<div class="msg ${msgCls}"><strong>${role}:</strong> ${content}</div>`;
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    async getCanvasSnapshot() {
        // Temporarily hide guides/grid for a clean AI "Vision" pass
        const gridVisible = this.app.layers.grid.visible;
        this.app.layers.grid.visible = false;
        paper.view.update();
        
        // Performance optimization: Downscale high-resolution canvases before sending to AI
        const maxDim = 1024;
        const width = this.app.canvas.width;
        const height = this.app.canvas.height;
        
        let dataUrl;
        if (width > maxDim || height > maxDim) {
            const scale = Math.min(maxDim / width, maxDim / height);
            const offscreen = document.createElement('canvas');
            offscreen.width = width * scale;
            offscreen.height = height * scale;
            const ctx = offscreen.getContext('2d');
            ctx.drawImage(this.app.canvas, 0, 0, offscreen.width, offscreen.height);
            dataUrl = offscreen.toDataURL('image/jpeg', 0.8); // JPEG at 80% quality for bandwidth efficiency
        } else {
            dataUrl = this.app.canvas.toDataURL('image/png');
        }
        
        this.app.layers.grid.visible = gridVisible;
        paper.view.update();
        return dataUrl;
    }

    async handleAIChat() {
        const input = document.getElementById('ai-input');
        const query = input.value.trim();
        if (!query) return;

        this.logAI("You", query);
        input.value = '';

        const loaderMsg = "Processing agentic intent...";
        this.logAI("System", loaderMsg);

        const items = paper.project.layers['geometry_layer']?.children || [];
        const schematicData = items.map(c => ({
            id: c.id,
            type: c.data.type || c.className,
            part: c.data.partType,
            pos: { x: Math.round(c.position.x), y: Math.round(c.position.y) },
            rotation: Math.round(c.rotation || 0),
            powered: c.data.isPowered,
            metadata: c.data.metadata,
            layer: c.layer.name
        }));

        try {
            const snapshot = await this.getCanvasSnapshot();
            const completion = await websim.chat.completions.create({
                messages: [
                    { 
                        role: "system", 
                        content: `You are EngiGraph AI, an Autonomous Mechatronics Agent.
                        You have VISION to see the canvas and full CONTROL over the CAD environment.
                        
                        ## CAPABILITIES & AGENTIC ACTIONS:
                        1. **DRAFT**: Create new components, geometry, or full subsystems.
                        2. **MODIFY**: Update properties (color, position, rotation, data values) of items.
                        3. **COMMAND**: Control the environment (ZOOM, CLEAR, UNDO, THEME, SIM_START, SIM_STOP).
                        4. **DELETE**: Wipe specific IDs or entire layers.
                        5. **ANNOTATE**: Add smart dimensions or technical leaders.
                        6. **SOLVE**: Provide a mathematical or logic analysis of the mechatronic state.
                        
                        ## COMPONENT LIBRARY:
                        Controllers: arduino_uno, esp32, rpi_pico.
                        Displays: lcd_1602, hcsr04 (sonar).
                        Input: keypad_4x4, switch_spst.
                        Motion: nema17, servo_sg90, dc_motor_generic, bearing_608.
                        Discrete: resistor, led_red, battery_18650, ground.
                        Logic: gate_and, gate_or, gate_not, gate_xor.
                        Structure: breadboard_half.

                        ## AUTONOMOUS ENGINEERING INTELLIGENCE:
                        - **SCHEMATIC SYNTHESIS**: If a user asks for a "distance tracker", draft a SONAR + MCU + LCD subsystem and suggest WIRING routes.
                        - **VISUAL RECTIFICATION**: Use VISION to identify messy hand-drawn lines (splines) and replace them with precise LINE/CIRCLE entities.
                        - **MECHATRONIC DEBUGGER**: Detect shorts (VCC to GND) or floating inputs and warn the user.
                        - **AUTO-LAYOUT**: Arrange components in a professional, manufacture-ready grid.

                        ## OUTPUT FORMAT:
                        Respond with technical engineering insight, then a JSON block.
                        JSON Schema:
                        {
                          "actions": [
                            { "type": "DRAFT", "entities": [{"type": "line|circle|rect|component", "partType": "str", "p1": {"x":f, "y":f}, "p2": {"x":f, "y":f}, "pos": {"x":f, "y":f}}] },
                            { "type": "MODIFY", "id": number, "props": { "pos": {"x":f, "y":f}, "resistance": f, "voltage": f, "state": "open|closed" } },
                            { "type": "ANNOTATE", "targetId": number, "dimType": "linear|radial", "text": "str" },
                            { "type": "COMMAND", "cmd": "string" },
                            { "type": "DELETE", "id": number }
                          ]
                        }

                        Workspace Center is roughly: ${paper.view.center.toString()}. 
                        Current Scale: 1mm = ${this.app.scaleFactor}px.
                        Canvas Context: ${JSON.stringify(schematicData.slice(0, 20))}`
                    },
                    { 
                        role: "user", 
                        content: [
                            { type: "text", text: query },
                            { type: "image_url", image_url: { url: snapshot } }
                        ]
                    }
                ]
            });
            
            const response = completion?.content || "Vision processing failed.";
            this.logAI("AI Assistant", response);

            const jsonMatch = response.match(/\{[\s\S]*"actions"[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    const cleanJson = jsonMatch[0].replace(/```json|```/g, '').trim();
                    const data = JSON.parse(cleanJson);
                    if (data.actions) this.applyAIActions(data.actions);
                } catch (e) { 
                    console.error("AI JSON Error:", e);
                    this.logAI("System", "Action block invalid. Re-check intent.");
                }
            }
        } catch (e) {
            console.error("AI Chat Error:", e);
            this.logAI("System", "Autonomous control interface failed.");
        }
    }

    applyAIActions(actions) {
        let changed = false;
        actions.forEach(action => {
            try {
                switch(action.type) {
                    case 'DRAFT':
                        this.applyAIDraft(action.entities);
                        changed = true;
                        break;
                    case 'MODIFY':
                        const item = paper.project.getItem({ id: action.id });
                        if (item) {
                            if (action.props.pos) item.position = new paper.Point(action.props.pos.x, action.props.pos.y);
                            if (action.props.color) item.strokeColor = action.props.color;
                            if (action.props.rotation !== undefined) item.rotate(action.props.rotation - (item.rotation || 0));
                            if (action.props.resistance !== undefined) item.data.resistance = action.props.resistance;
                            if (action.props.voltage !== undefined) item.data.voltage = action.props.voltage;
                            if (action.props.state !== undefined) item.data.state = action.props.state;
                            changed = true;
                        }
                        break;
                    case 'ANNOTATE':
                        const target = paper.project.getItem({ id: action.targetId });
                        if (target) {
                            if (action.dimType === 'linear' && target.segments?.length === 2) {
                                this.app.tools.annotations.createDimension(target.segments[0].point, target.segments[1].point, action.text || (target.length * (1/this.app.scaleFactor)).toFixed(2));
                            } else if (action.dimType === 'radial') {
                                this.app.tools.annotations.createRadialDimension(target.position, target.segments[0].point, action.text || (target.position.getDistance(target.segments[0].point) * (1/this.app.scaleFactor)).toFixed(2));
                            }
                            changed = true;
                        }
                        break;
                    case 'COMMAND':
                        if (action.cmd === 'SIM_START') this.app.circuit.start();
                        else if (action.cmd === 'SIM_STOP') this.app.circuit.stop();
                        else this.app.executeCommand(action.cmd);
                        changed = true;
                        break;
                    case 'DELETE':
                        const toDel = paper.project.getItem({ id: action.id });
                        if (toDel) { toDel.remove(); changed = true; }
                        break;
                }
            } catch (err) {
                console.error("AI Action failed:", action, err);
            }
        });

        if (changed) {
            this.app.history.pushState();
            this.app.ui.layers.updateLayerUI();
            paper.view.update();
        }
    }

    async runComplianceAudit() {
        this.app.ai.logAI("System", "Initiating Agentic Vision Audit (OCR + Logic)...");
        
        const items = paper.project.layers['geometry_layer']?.children || [];
        const schematic = items.map(c => ({
            type: c.data.type || c.className,
            part: c.data.partType,
            bounds: c.bounds.toString(),
            powered: c.data.isPowered,
            metadata: c.data.metadata
        }));

        try {
            const snapshot = await this.getCanvasSnapshot();
            const completion = await websim.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: `You are a Senior Mechatronics Compliance Linter with OCR Vision. 
                        Evaluate the provided canvas image and metadata against ${this.app.currentStandard}.
                        
                        Audit Priorities:
                        1. Visual alignment and SANS 10111 compliance.
                        2. Logic Flow: Identify if components are physically disconnected but intended to be wired.
                        3. Thermal/Power: Identify potential overloads (e.g. 18650 battery directly to 3V rail).
                        4. Standards: Missing projection symbols or scale bars.
                        
                        Format as a professional 'Agentic Engineering Report'.`
                    },
                    {
                        role: "user",
                        content: [
                            { type: "text", text: `Analyze this design state: ${JSON.stringify(schematic)}` },
                            { type: "image_url", image_url: { url: snapshot } }
                        ]
                    }
                ]
            });
            this.logAI("Agentic Auditor", completion.content);
        } catch (e) {
            this.logAI("System", "Vision-based audit failed.");
        }
    }

    async generateCustomComponent() {
        const desc = prompt("Describe the hardware component (e.g., 'A 4-pin OLED display i2c 0.96 inch' or 'A custom L-bracket'):");
        if (!desc) return;

        this.app.ai.logAI("System", "Architecting custom component footprint...");
        
        try {
            const completion = await websim.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: `You are an Industrial Footprint Architect.
                        The user wants a Paper.js implementation of a component.
                        Generate a valid JSON DRAFT block.
                        The component should be visually distinct and technically sized (mm).
                        Focus on 'arduino' style pin arrangements if requested.`
                    },
                    { role: "user", content: `Create a mechatronic component for: ${desc}` }
                ]
            });

            const response = completion.content;
            const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
            if (jsonMatch) {
                const data = JSON.parse(jsonMatch[1]);
                if (data.entities) this.applyAIDraft(data.entities);
            } else {
                this.logAI("Architect", "Could not generate footprint from that description. Please be more specific.");
            }
        } catch (e) {
            this.logAI("System", "Architecture failed.");
        }
    }

    applyAIDraft(entities) {
        this.app.layers.geometry.activate();
        const center = paper.view.center;
        
        entities.forEach(ent => {
            const pos = new paper.Point(ent.pos?.x || 0, ent.pos?.y || 0).add(center);
            if (ent.type === 'component') {
                this.app.tools.components.placeAt(ent.partType, pos);
            } else if (ent.type === 'wire' || ent.type === 'line') {
                const p1 = new paper.Point(ent.p1.x, ent.p1.y).add(center);
                const p2 = new paper.Point(ent.p2.x, ent.p2.y).add(center);
                const line = new paper.Path.Line(p1, p2);
                line.strokeColor = this.app.themeColors.geometry;
                line.strokeWidth = 2;
                line.data.type = ent.type;
            }
        });
        
        this.app.history.pushState();
        this.logAI("System", `Successfully drafted ${entities.length} entities onto the canvas.`);
    }
}
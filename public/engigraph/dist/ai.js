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
        }
        else {
            if (this.linterTimer)
                clearInterval(this.linterTimer);
            this.linterTimer = null;
        }
    }
    async runBackgroundAudit() {
        // Silent audit that updates a UI element instead of flooding chat
        const res = document.getElementById('validation-results');
        const items = paper.project.layers['geometry_layer']?.children || [];
        if (items.length === 0)
            return;
        try {
            const completion = await websim.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: `You are a real-time engineering linter. Briefly (10 words max) identify the single biggest design risk in the provided netlist for ${this.app.currentStandard}. If safe, say 'Standard Compliant'.`
                    },
                    {
                        role: "user",
                        content: `Context: ${JSON.stringify(items.slice(0, 10).map(i => i.data.partType))}`
                    }
                ]
            });
            const text = completion.content.trim();
            if (res) {
                res.innerHTML = `<div class="ai-linter-indicator"><i data-ai-icon="bot" style="width:12px"></i> ${text}</div>`;
                createIcons({ icons: { Bot }, nameAttr: 'data-ai-icon' });
            }
        }
        catch (e) { }
    }
    toggleAIModal(show = true) {
        const modal = document.getElementById('ai-modal-overlay');
        if (show) {
            modal.classList.remove('hidden');
            document.getElementById('ai-input').focus();
        }
        else {
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
        }
        else {
            dataUrl = this.app.canvas.toDataURL('image/png');
        }
        this.app.layers.grid.visible = gridVisible;
        paper.view.update();
        return dataUrl;
    }
    async handleAIChat() {
        const input = document.getElementById('ai-input');
        const query = input.value.trim();
        if (!query)
            return;
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
                    if (data.actions)
                        this.applyAIActions(data.actions);
                }
                catch (e) {
                    console.error("AI JSON Error:", e);
                    this.logAI("System", "Action block invalid. Re-check intent.");
                }
            }
        }
        catch (e) {
            console.error("AI Chat Error:", e);
            this.logAI("System", "Autonomous control interface failed.");
        }
    }
    applyAIActions(actions) {
        let changed = false;
        actions.forEach(action => {
            try {
                switch (action.type) {
                    case 'DRAFT':
                        this.applyAIDraft(action.entities);
                        changed = true;
                        break;
                    case 'MODIFY':
                        const item = paper.project.getItem({ id: action.id });
                        if (item) {
                            if (action.props.pos)
                                item.position = new paper.Point(action.props.pos.x, action.props.pos.y);
                            if (action.props.color)
                                item.strokeColor = action.props.color;
                            if (action.props.rotation !== undefined)
                                item.rotate(action.props.rotation - (item.rotation || 0));
                            if (action.props.resistance !== undefined)
                                item.data.resistance = action.props.resistance;
                            if (action.props.voltage !== undefined)
                                item.data.voltage = action.props.voltage;
                            if (action.props.state !== undefined)
                                item.data.state = action.props.state;
                            changed = true;
                        }
                        break;
                    case 'ANNOTATE':
                        const target = paper.project.getItem({ id: action.targetId });
                        if (target) {
                            if (action.dimType === 'linear' && target.segments?.length === 2) {
                                this.app.tools.annotations.createDimension(target.segments[0].point, target.segments[1].point, action.text || (target.length * (1 / this.app.scaleFactor)).toFixed(2));
                            }
                            else if (action.dimType === 'radial') {
                                this.app.tools.annotations.createRadialDimension(target.position, target.segments[0].point, action.text || (target.position.getDistance(target.segments[0].point) * (1 / this.app.scaleFactor)).toFixed(2));
                            }
                            changed = true;
                        }
                        break;
                    case 'COMMAND':
                        if (action.cmd === 'SIM_START')
                            this.app.circuit.start();
                        else if (action.cmd === 'SIM_STOP')
                            this.app.circuit.stop();
                        else
                            this.app.executeCommand(action.cmd);
                        changed = true;
                        break;
                    case 'DELETE':
                        const toDel = paper.project.getItem({ id: action.id });
                        if (toDel) {
                            toDel.remove();
                            changed = true;
                        }
                        break;
                }
            }
            catch (err) {
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
        }
        catch (e) {
            this.logAI("System", "Vision-based audit failed.");
        }
    }
    async generateCustomComponent() {
        const desc = prompt("Describe the hardware component (e.g., 'A 4-pin OLED display i2c 0.96 inch' or 'A custom L-bracket'):");
        if (!desc)
            return;
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
                if (data.entities)
                    this.applyAIDraft(data.entities);
            }
            else {
                this.logAI("Architect", "Could not generate footprint from that description. Please be more specific.");
            }
        }
        catch (e) {
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
            }
            else if (ent.type === 'wire' || ent.type === 'line') {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9haS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEtBQUssTUFBTSxzQkFBc0IsQ0FBQztBQUV6Qzs7R0FFRztBQUNILE1BQU0sT0FBTyxTQUFTO0lBQ2xCLFlBQVksR0FBRztRQUNYLElBQUksQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDO1FBQ2YsSUFBSSxDQUFDLGNBQWMsR0FBRyxLQUFLLENBQUM7UUFDNUIsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7SUFDNUIsQ0FBQztJQUVELG9CQUFvQixDQUFDLE1BQU07UUFDdkIsSUFBSSxDQUFDLGNBQWMsR0FBRyxNQUFNLENBQUM7UUFDN0IsSUFBSSxNQUFNLEVBQUUsQ0FBQztZQUNULElBQUksQ0FBQyxXQUFXLEdBQUcsV0FBVyxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsa0JBQWtCO1lBQzFGLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLHFEQUFxRCxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsZUFBZSxHQUFHLEtBQUssQ0FBQyxDQUFDO1FBQ25ILENBQUM7YUFBTSxDQUFDO1lBQ0osSUFBSSxJQUFJLENBQUMsV0FBVztnQkFBRSxhQUFhLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQ3RELElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO1FBQzVCLENBQUM7SUFDTCxDQUFDO0lBRUQsS0FBSyxDQUFDLGtCQUFrQjtRQUNwQixrRUFBa0U7UUFDbEUsTUFBTSxHQUFHLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1FBQzFELE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLEVBQUUsUUFBUSxJQUFJLEVBQUUsQ0FBQztRQUNyRSxJ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
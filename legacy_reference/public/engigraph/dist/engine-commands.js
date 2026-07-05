import paper from 'https://esm.sh/paper';
/**
 * Interprets and executes textual commands from the status bar.
 */
export class CommandProcessor {
    constructor(app) {
        this.app = app;
    }
    init() {
        const input = document.getElementById('command-input');
        if (!input)
            return;
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const cmd = input.value.trim().toLowerCase();
                input.value = '';
                this.execute(cmd);
            }
        });
    }
    execute(raw) {
        const parts = raw.split(' ');
        const cmd = parts[0];
        const args = parts.slice(1);
        // Advanced Coordinates Parser for drawing tools (e.g. line @100<45)
        // If a command is just coordinates and we are in a drawing tool, parse it!
        if (this.app.tools.startPoint && (raw.includes('@') || raw.includes('<') || raw.includes(','))) {
            const p = this.parseCoordinates(raw);
            if (p) {
                // Simulate a mouse down at that exact point
                const simulatedEvent = { point: p };
                this.app.tools.events.handleMouseDown(simulatedEvent);
                this.app.tools.events.handleMouseUp(simulatedEvent);
                this.logToTerminal(`Point entered: ${p.x.toFixed(2)}, ${p.y.toFixed(2)}`, 'system');
                return;
            }
        }
        switch (cmd) {
            case 'l':
            case 'line':
                this.app.tools.setTool('line');
                break;
            case 'c':
            case 'circle':
                this.app.tools.setTool('circle');
                break;
            case 'r':
            case 'rect':
                this.app.tools.setTool('rect');
                break;
            case 'arc':
                this.app.tools.setTool('arc');
                break;
            case 'txt':
            case 'text':
                this.app.tools.setTool('text');
                break;
            case 'dim':
                this.app.tools.setTool('dim-smart');
                break;
            case 'z':
            case 'zoom':
                if (args[0] === 'e' || args[0] === 'extents')
                    this.app.viewManager.zoomExtents();
                else if (!isNaN(parseFloat(args[0])))
                    this.app.viewManager.setZoom(parseFloat(args[0]) / 100);
                break;
            case 'grid':
                if (args[0] === 'on') {
                    document.getElementById('snap-grid').checked = true;
                    this.app.snapSettings.grid = true;
                    this.app.viewManager.drawGrid();
                }
                else if (args[0] === 'off') {
                    document.getElementById('snap-grid').checked = false;
                    this.app.snapSettings.grid = false;
                    this.app.viewManager.drawGrid();
                }
                else if (!isNaN(parseFloat(args[0]))) {
                    const stepEl = document.getElementById('snap-grid-step');
                    if (stepEl) {
                        stepEl.value = args[0];
                        stepEl.dispatchEvent(new Event('change'));
                    }
                }
                break;
            case 'snap':
                if (args[0] === 'on') {
                    document.getElementById('snap-object').checked = true;
                    this.app.snapSettings.object = true;
                }
                else if (args[0] === 'off') {
                    document.getElementById('snap-object').checked = false;
                    this.app.snapSettings.object = false;
                }
                break;
            case 'ortho':
                const orthoEl = document.getElementById('snap-ortho');
                if (args[0] === 'on') {
                    orthoEl.checked = true;
                    this.app.snapSettings.ortho = true;
                }
                else if (args[0] === 'off') {
                    orthoEl.checked = false;
                    this.app.snapSettings.ortho = false;
                }
                break;
            case 'iso':
                if (args[0] === 'on')
                    this.app.ui.setIsoMode(true);
                else if (args[0] === 'off')
                    this.app.ui.setIsoMode(false);
                break;
            case 'isoplane':
                if (['top', 'left', 'right'].includes(args[0])) {
                    this.app.isoPlane = args[0];
                    const sel = document.getElementById('select-isoplane');
                    if (sel)
                        sel.value = args[0];
                    this.app.viewManager.drawGrid();
                }
                break;
            case 'offset':
                const dist = parseFloat(args[0]);
                if (!isNaN(dist)) {
                    this.app.tools.modelling.lastOffsetDist = dist;
                    this.app.tools.setTool('offset');
                }
                break;
            case 'delete':
                if (this.app.tools.selection) {
                    this.app.tools.selection.remove();
                    this.app.tools.selection = null;
                    this.app.ui.properties.updateProperties(null);
                    this.app.history.pushState();
                }
                break;
            case 'undo':
                this.app.history.undo();
                break;
            case 'redo':
                this.app.history.redo();
                break;
            case 'cls':
            case 'clear':
                this.app.initLayers();
                break;
            case 'mv':
            case 'move':
                if (this.app.tools.selection && args.length >= 2) {
                    const dx = parseFloat(args[0]) * this.app.scaleFactor;
                    const dy = parseFloat(args[1]) * this.app.scaleFactor;
                    if (!isNaN(dx) && !isNaN(dy)) {
                        this.app.tools.selection.position = this.app.tools.selection.position.add([dx, dy]);
                        this.app.history.pushState();
                        this.app.ui.properties.updateProperties(this.app.tools.selection);
                    }
                }
                break;
            case 'rot':
            case 'rotate':
                if (this.app.tools.selection && args.length >= 1) {
                    const deg = parseFloat(args[0]);
                    if (!isNaN(deg)) {
                        this.app.tools.selection.rotate(deg);
                        this.app.history.pushState();
                    }
                }
                break;
            case 'sc':
            case 'scale':
                if (this.app.tools.selection && args.length >= 1) {
                    const factor = parseFloat(args[0]);
                    if (!isNaN(factor)) {
                        this.app.tools.selection.scale(factor);
                        this.app.history.pushState();
                    }
                }
                break;
            case 'fillet':
                if (args.length > 0 && !isNaN(parseFloat(args[0]))) {
                    // Store the radius globally or on the tool manager
                    this.app.tools.modelling.lastFilletRadius = parseFloat(args[0]);
                }
                this.app.tools.setTool('fillet');
                break;
            case 'gear':
                if (args.length >= 2) {
                    this.app.tools.modelling.lastGearTeeth = parseInt(args[0]);
                    this.app.tools.modelling.lastGearModule = parseFloat(args[1]);
                }
                this.app.tools.setTool('gear');
                break;
            case 'symbol':
                this.app.tools.setTool('third_angle_symbol');
                break;
            case 'trim':
                this.app.tools.setTool('trim');
                break;
            case 'extend':
                this.app.tools.setTool('extend');
                break;
            case 'bom':
                this.app.ui.generateBOM();
                break;
            case 'export':
                if (args[0] === 'svg')
                    this.app.ui.exportSVG();
                else if (args[0] === 'json')
                    this.app.ui.exportProjectJSON();
                break;
            case 'theme':
                if (args[0] === 'dark') {
                    document.documentElement.setAttribute('data-theme', 'dark');
                    this.app.theme.update();
                }
                else if (args[0] === 'light') {
                    document.documentElement.setAttribute('data-theme', 'light');
                    this.app.theme.update();
                }
                else
                    this.app.ui.toggleTheme();
                break;
            case 'std':
            case 'standard':
                if (['sans', 'iso', 'ansi', 'din'].includes(args[0])) {
                    const val = args[0].toUpperCase();
                    this.app.currentStandard = val;
                    const sel = document.getElementById('standard-select');
                    if (sel)
                        sel.value = val;
                    this.app.ai.logAI("System", `Standard switched via command to ${val}.`);
                }
                break;
            case 'help':
                this.app.ui.modals.showThesis('manual');
                break;
            default:
                this.app.ai.logAI("System", `Unknown command: ${cmd}`);
        }
    }
    parseCoordinates(input) {
        input = input.trim();
        const sf = this.app.scaleFactor || 1;
        // Polar relative: @length<angle
        if (input.startsWith('@') && input.includes('<')) {
            const parts = input.substring(1).split('<');
            const length = parseFloat(parts[0]) * sf;
            const angle = parseFloat(parts[1]);
            if (!isNaN(length) && !isNaN(angle) && this.app.tools.startPoint) {
                const rad = angle * Math.PI / 180;
                return this.app.tools.startPoint.add(new paper.Point(Math.cos(rad) * length, Math.sin(rad) * length));
            }
        }
        // Cartesian absolute: x,y
        if (input.includes(',') && !input.startsWith('@')) {
            const parts = input.split(',');
            const x = parseFloat(parts[0]) * sf;
            const y = parseFloat(parts[1]) * sf;
            if (!isNaN(x) && !isNaN(y)) {
                return new paper.Point(x, y);
            }
        }
        // Cartesian relative: @x,y
        if (input.startsWith('@') && input.includes(',')) {
            const parts = input.substring(1).split(',');
            const dx = parseFloat(parts[0]) * sf;
            const dy = parseFloat(parts[1]) * sf;
            if (!isNaN(dx) && !isNaN(dy) && this.app.tools.startPoint) {
                return this.app.tools.startPoint.add(new paper.Point(dx, dy));
            }
        }
        return null;
    }
    logToTerminal(msg, type) {
        // Find existing terminal
        const term = document.getElementById('command-history');
        if (term) {
            const el = document.createElement('div');
            el.className = `term-line ${type}`;
            el.textContent = `[CAD] ${msg}`;
            term.appendChild(el);
            term.scrollTop = term.scrollHeight;
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW5naW5lLWNvbW1hbmRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vZW5naW5lLWNvbW1hbmRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sS0FBSyxNQUFNLHNCQUFzQixDQUFDO0FBRXpDOztHQUVHO0FBQ0gsTUFBTSxPQUFPLGdCQUFnQjtJQUN6QixZQUFZLEdBQUc7UUFDWCxJQUFJLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztJQUNuQixDQUFDO0lBRUQsSUFBSTtRQUNBLE1BQU0sS0FBSyxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsZUFBZSxDQUFDLENBQUM7UUFDdkQsSUFBSSxDQUFDLEtBQUs7WUFBRSxPQUFPO1FBRW5CLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRTtZQUNwQyxJQUFJLENBQUMsQ0FBQyxHQUFHLEtBQUssT0FBTyxFQUFFLENBQUM7Z0JBQ3BCLE1BQU0sR0FBRyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQzdDLEtBQUssQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDO2dCQUNqQixJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3RCLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFFRCxPQUFPLENBQUMsR0FBRztRQUNQLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDN0IsTUFBTSxHQUFHLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3JCLE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFNUIsb0VBQW9FO1FBQ3BFLDJFQUEyRTtRQUMzRSxJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLFVBQVUsSUFBSSxDQUFDLEdBQUcs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
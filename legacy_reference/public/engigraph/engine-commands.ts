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
        if (!input) return;

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
            case 'line': this.app.tools.setTool('line'); break;
            case 'c':
            case 'circle': this.app.tools.setTool('circle'); break;
            case 'r':
            case 'rect': this.app.tools.setTool('rect'); break;
            case 'arc': this.app.tools.setTool('arc'); break;
            case 'txt':
            case 'text': this.app.tools.setTool('text'); break;
            case 'dim': this.app.tools.setTool('dim-smart'); break;
            
            case 'z':
            case 'zoom':
                if (args[0] === 'e' || args[0] === 'extents') this.app.viewManager.zoomExtents();
                else if (!isNaN(parseFloat(args[0]))) this.app.viewManager.setZoom(parseFloat(args[0]) / 100);
                break;
            
            case 'grid':
                if (args[0] === 'on') { document.getElementById('snap-grid').checked = true; this.app.snapSettings.grid = true; this.app.viewManager.drawGrid(); }
                else if (args[0] === 'off') { document.getElementById('snap-grid').checked = false; this.app.snapSettings.grid = false; this.app.viewManager.drawGrid(); }
                else if (!isNaN(parseFloat(args[0]))) {
                    const stepEl = document.getElementById('snap-grid-step');
                    if (stepEl) { stepEl.value = args[0]; stepEl.dispatchEvent(new Event('change')); }
                }
                break;

            case 'snap':
                if (args[0] === 'on') { document.getElementById('snap-object').checked = true; this.app.snapSettings.object = true; }
                else if (args[0] === 'off') { document.getElementById('snap-object').checked = false; this.app.snapSettings.object = false; }
                break;

            case 'ortho':
                const orthoEl = document.getElementById('snap-ortho');
                if (args[0] === 'on') { orthoEl.checked = true; this.app.snapSettings.ortho = true; }
                else if (args[0] === 'off') { orthoEl.checked = false; this.app.snapSettings.ortho = false; }
                break;

            case 'iso':
                if (args[0] === 'on') this.app.ui.setIsoMode(true);
                else if (args[0] === 'off') this.app.ui.setIsoMode(false);
                break;

            case 'isoplane':
                if (['top', 'left', 'right'].includes(args[0])) {
                    this.app.isoPlane = args[0];
                    const sel = document.getElementById('select-isoplane');
                    if (sel) sel.value = args[0];
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

            case 'undo': this.app.history.undo(); break;
            case 'redo': this.app.history.redo(); break;
            case 'cls':
            case 'clear': this.app.initLayers(); break;

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

            case 'trim': this.app.tools.setTool('trim'); break;
            case 'extend': this.app.tools.setTool('extend'); break;

            case 'bom': this.app.ui.generateBOM(); break;
            case 'export':
                if (args[0] === 'svg') this.app.ui.exportSVG();
                else if (args[0] === 'json') this.app.ui.exportProjectJSON();
                break;
            
            case 'theme':
                if (args[0] === 'dark') { document.documentElement.setAttribute('data-theme', 'dark'); this.app.theme.update(); }
                else if (args[0] === 'light') { document.documentElement.setAttribute('data-theme', 'light'); this.app.theme.update(); }
                else this.app.ui.toggleTheme();
                break;

            case 'std':
            case 'standard':
                if (['sans', 'iso', 'ansi', 'din'].includes(args[0])) {
                    const val = args[0].toUpperCase();
                    this.app.currentStandard = val;
                    const sel = document.getElementById('standard-select');
                    if (sel) sel.value = val;
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
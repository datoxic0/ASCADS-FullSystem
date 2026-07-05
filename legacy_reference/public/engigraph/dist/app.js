import { createIcons, FilePlus, Upload, Save, MousePointer2, Minus, Circle, RefreshCw, Square, Split, Tangent, CornerDownRight, Ruler, Radius, Sparkles, Maximize, Maximize2, Send, Eye, Plus, Trash2, EyeOff, Move, Type, ShieldCheck, Download, Printer, Bot, Zap, ZapOff, Layers, Info, ChevronLeft, ChevronRight, ChevronDown, PenTool, Box, Pipette, Triangle, Cpu, LayoutGrid, Copy, Columns, GitMerge, Waves, Undo2, Redo2, Sun, Moon, ZoomIn, ZoomOut, List, Settings, Terminal, Activity, Lightbulb, ToggleLeft, GitBranch, CircleSlash, GitPullRequest, GitCommit, BookOpen, GraduationCap, Compass, Wind, Mic, Flame } from 'https://esm.sh/lucide';
import paper from 'https://esm.sh/paper';
import { vectorizeImage } from './vectorizer.js';
import { AIManager } from './ai.js';
import { ViewManager } from './view.js';
import { UIManager } from './ui.js';
import { ToolManager } from './tools.js';
import { HistoryManager } from './history.js';
import { CircuitEngine } from './engine-circuit.js';
import { ThemeManager } from './engine-theme.js';
import { PersistenceManager } from './engine-persistence.js';
import { CommandProcessor } from './engine-commands.js';
import { ShortcutManager } from './engine-shortcuts.js';
import { ValidationEngine } from './engine-validation.js';
import { FluidFlowSimulator } from './engine-simulation-flow.js';
import { AcousticSimulator } from './engine-simulation-acoustic.js';
import { MaterialNoiseSimulator } from './engine-simulation-noise.js';
createIcons({
    icons: { FilePlus, Upload, Save, MousePointer2, Minus, Circle, RefreshCw, Square, Split, Tangent, CornerDownRight, Ruler, Radius, Sparkles, Maximize, Maximize2, Send, Eye, Plus, Trash2, EyeOff, Move, Type, ShieldCheck, Download, Printer, Bot, Zap, ZapOff, Layers, Info, ChevronLeft, ChevronRight, ChevronDown, PenTool, Box, Pipette, Triangle, Cpu, LayoutGrid, Copy, Columns, GitMerge, Waves, Undo2, Redo2, Sun, Moon, ZoomIn, ZoomOut, List, Settings, Terminal, Activity, Lightbulb, ToggleLeft, GitBranch, CircleSlash, GitPullRequest, GitCommit, BookOpen, GraduationCap, Compass, Wind, Mic, Flame },
    nameAttr: 'data-app-icon'
});
class EngiGraphApp {
    constructor() {
        this.canvas = document.getElementById('main-canvas');
        paper.setup(this.canvas);
        this.currentTool = 'select';
        this.scaleFactor = 1.0;
        this.currentStandard = 'SANS';
        this.activeColor = '#ffffff';
        this.snapSettings = { grid: true, object: true, ortho: false, angleSnap: true, gridStep: 1.0 };
        this.materialLibrary = {
            'PLA': { density: 0.00125 }, // g/mm3
            'Aluminum': { density: 0.0027 },
            'Steel': { density: 0.00785 },
            'Acrylic': { density: 0.00118 }
        };
        this.isIsometric = false;
        this.isoPlane = 'top';
        // Modular component initialization
        this.ai = new AIManager(this);
        this.viewManager = new ViewManager(this);
        this.history = new HistoryManager(this);
        this.ui = new UIManager(this);
        this.tools = new ToolManager(this);
        this.circuit = new CircuitEngine(this);
        // Extended Engine Modules
        this.theme = new ThemeManager(this);
        this.persistence = new PersistenceManager(this);
        this.commands = new CommandProcessor(this);
        this.shortcuts = new ShortcutManager(this);
        this.validation = new ValidationEngine(this);
        this.flowSim = new FluidFlowSimulator(this);
        this.acousticSim = new AcousticSimulator(this);
        this.noiseSim = new MaterialNoiseSimulator(this);
        this.theme.init();
        this.ui.initUI();
        this.initLayers();
        this.commands.init();
        this.tools.initTools();
        this.viewManager.initNavigation();
        this.shortcuts.init();
        this.persistence.init();
        this.initConnectivity();
        this.optimizeEngine();
        this.ai.logAI("System", "EngiGraph Pro AI ready to assist with your engineering graphics.");
        // Suppress non-critical environment rejections (like MetaMask errors)
        window.addEventListener('unhandledrejection', (event) => {
            if (event.reason && (event.reason.message?.includes('MetaMask') || event.reason.toString().includes('MetaMask'))) {
                event.preventDefault();
                return;
            }
            console.error("EngiGraph Engine Unhandled Rejection:", event.reason);
        });
        // Optimization: Debounce property updates during intensive interactions
        this._updatePropsThrottled = (item) => {
            if (this._propTimer)
                return;
            this._propTimer = requestAnimationFrame(() => {
                this.ui.properties.updateProperties(item);
                this._propTimer = null;
            });
        };
        // Finalize initialization and hide loader
        setTimeout(() => {
            document.getElementById('loading-overlay').style.opacity = '0';
            document.getElementById('app').classList.remove('hidden');
            setTimeout(() => document.getElementById('loading-overlay').remove(), 500);
        }, 100);
    }
    // removed initTheme() {}
    // removed updateThemeColors() {}
    // removed initPersistence() {}
    initConnectivity() {
        const updateStatus = () => {
            const isOnline = navigator.onLine;
            const statusEl = document.getElementById('connection-status');
            if (statusEl) {
                statusEl.classList.toggle('online', isOnline);
                statusEl.classList.toggle('offline', !isOnline);
                statusEl.querySelector('.conn-text').textContent = isOnline ? 'Online' : 'Offline';
                const icon = statusEl.querySelector('i');
                if (icon) {
                    icon.setAttribute('data-lucide', isOnline ? 'zap' : 'zap-off');
                    createIcons({ icons: { Zap, ZapOff } });
                }
            }
            if (!isOnline) {
                this.ai.logAI("System", "Network connection lost. AI features will be limited.");
            }
            else {
                this.ai.logAI("System", "Network restored.");
            }
        };
        window.addEventListener('online', updateStatus);
        window.addEventListener('offline', updateStatus);
        updateStatus();
    }
    // removed toggleAIModal(show = true) {}
    initLayers() {
        // Deep reset of the engine state
        if (this.circuit)
            this.circuit.stop();
        paper.project.clear();
        this.layers = {
            grid: new paper.Layer({ name: 'grid_layer', locked: true }),
            sheet: new paper.Layer({ name: 'sheet_layer' }),
            geometry: new paper.Layer({ name: 'geometry_layer' }),
            dimensions: new paper.Layer({ name: 'dimensions_layer' }),
            construction: new paper.Layer({ name: 'construction_layer' }),
            text: new paper.Layer({ name: 'text_layer' }),
            mechatronics: new paper.Layer({ name: 'mechatronics_layer' }),
            electrotech: new paper.Layer({ name: 'electrotech_layer' })
        };
        if (this.history) {
            this.history.undoStack = [];
            this.history.redoStack = [];
            localStorage.removeItem('engigraph_autosave');
        }
        this.viewManager.drawGrid();
        this.layers.geometry.activate();
        this.ui.layers.updateLayerUI();
        this.ui.properties.updateProperties(null);
        // Push fresh initial state
        setTimeout(() => this.history.pushState(), 100);
    }
    // removed initCommandBar() {}
    // removed executeCommand(raw) {}
    executeCommand(raw) { this.commands.execute(raw); }
    // removed drawGrid() {}
    // removed updateLayerUI() {}
    // removed initNavigation() {}
    // removed initShortcuts() {}
    // removed showModal(title, body, onOk) {}
    // removed initUI() {}
    // removed switchTab(tabId) {}
    // removed setTool(toolId) {}
    // removed resetTemp() {}
    // removed getProcessedPoint(rawPoint) {}
    // removed showSnapIndicator(point) {}
    // removed hideSnapIndicator() {}
    // removed initTools() {}
    // removed createDimension(p1, p2, textValue) {}
    // removed createRadialDimension(center, edge, radius) {}
    // removed handleBisect(point) {}
    // removed handleFillet(point) {}
    // removed handleSmartDim(point) {}
    // removed updateProperties(item) {}
    async handleImport(file) {
        const overlay = document.getElementById('vectorize-overlay');
        const progressFill = overlay.querySelector('.progress-fill');
        const statusText = document.getElementById('vectorize-status');
        overlay.classList.remove('hidden');
        try {
            const entities = await vectorizeImage(file, (progress, msg) => {
                progressFill.style.width = `${progress}%`;
                if (statusText)
                    statusText.textContent = msg;
            });
            this.layers.geometry.activate();
            entities.forEach(data => {
                let item;
                if (data.type === 'line')
                    item = new paper.Path.Line(data.p1, data.p2);
                else if (data.type === 'circle')
                    item = new paper.Path.Circle(data.center, data.radius);
                else if (data.type === 'rect')
                    item = new paper.Path.Rectangle(data.p1, data.p2);
                else if (data.type === 'component')
                    this.tools.components.placeAt(data.partType, data.pos);
                else if (data.type === 'dimension')
                    this.tools.annotations.createDimension(new paper.Point(data.p1), new paper.Point(data.p2), data.text);
                if (item && data.type !== 'component') {
                    item.strokeColor = this.themeColors.geometry;
                    item.strokeWidth = 1.5;
                    item.data.type = data.type;
                }
            });
            this.ai.logAI("System", `Imported ${entities.length} entities successfully.`);
            if (this.circuit)
                this.circuit.needsDiscovery = true;
        }
        catch (err) {
            console.error("Import failure:", err);
            this.ai.logAI("System", "Digitization failed. Check network connection or image quality.");
        }
        finally {
            overlay.classList.add('hidden');
            this.tools.setTool('select');
        }
    }
    // removed runValidation() {}
    runValidation() { this.validation.run(); }
    optimizeEngine() {
        // High-level performance optimizations for the Paper.js project
        if (paper.project) {
            paper.settings.handleSize = 8;
            paper.settings.hitTolerance = 10;
        }
        // Cache layer references for hot loops
        this.activeLayer = paper.project.activeLayer;
        // Monitor for memory leaks or excessive entities
        setInterval(() => {
            const count = paper.project.getItems({}).length;
            if (count > 2000) {
                this.ai.logAI("System", "Warning: High entity count detected. Performance may be impacted.");
            }
        }, 30000);
    }
}
if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', () => { window.app = new EngiGraphApp(); });
}
else {
    window.app = new EngiGraphApp();
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vYXBwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxXQUFXLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsYUFBYSxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLGVBQWUsRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxZQUFZLEVBQUUsV0FBVyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxHQUFHLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsU0FBUyxFQUFFLFVBQVUsRUFBRSxTQUFTLEVBQUUsV0FBVyxFQUFFLGNBQWMsRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLGFBQWEsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsTUFBTSx1QkFBdUIsQ0FBQztBQUMvbkIsT0FBTyxLQUFLLE1BQU0sc0JBQXNCLENBQUM7QUFDekMsT0FBTyxFQUFFLGNBQWMsRUFBRSxNQUFNLGlCQUFpQixDQUFDO0FBQ2pELE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFB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
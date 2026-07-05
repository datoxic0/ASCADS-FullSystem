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
            if (this._propTimer) return;
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
            } else {
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
        if (this.circuit) this.circuit.stop();
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
                if (statusText) statusText.textContent = msg;
            });
            
            this.layers.geometry.activate();
            entities.forEach(data => {
                let item;
                if (data.type === 'line') item = new paper.Path.Line(data.p1, data.p2);
                else if (data.type === 'circle') item = new paper.Path.Circle(data.center, data.radius);
                else if (data.type === 'rect') item = new paper.Path.Rectangle(data.p1, data.p2);
                else if (data.type === 'component') this.tools.components.placeAt(data.partType, data.pos);
                else if (data.type === 'dimension') this.tools.annotations.createDimension(new paper.Point(data.p1), new paper.Point(data.p2), data.text);
                
                if (item && data.type !== 'component') { 
                    item.strokeColor = this.themeColors.geometry; 
                    item.strokeWidth = 1.5; 
                    item.data.type = data.type; 
                }
            });
            
            this.ai.logAI("System", `Imported ${entities.length} entities successfully.`);
            if (this.circuit) this.circuit.needsDiscovery = true;
        } catch (err) {
            console.error("Import failure:", err);
            this.ai.logAI("System", "Digitization failed. Check network connection or image quality.");
        } finally {
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
} else {
    window.app = new EngiGraphApp();
}
import { 
    createIcons, FilePlus, MousePointer2, Move, Undo2, Redo2, Trash2, Maximize2, 
    Minus, Circle, RefreshCw, Square, PenTool, Split, Tangent, CornerDownRight, 
    Box, Pipette, Triangle, Cpu, LayoutGrid, Copy, Columns, GitMerge, Waves, 
    Ruler, Radius, Sparkles, Type, Upload, ZapOff, Download, FileDown, Printer, Bot, 
    Zap, Send, Battery, Activity, Lightbulb, ToggleLeft, GitBranch, CircleSlash,
    GitPullRequest, GitCommit, BookOpen, GraduationCap, ShieldCheck, Compass, Wind, Mic, Flame,
    Settings, Grid, Terminal, List, Eye, Code, Sun, Moon, Layers, Info, ChevronLeft, Plus, ChevronRight, ZoomIn, ZoomOut, Maximize
} from 'https://esm.sh/lucide';
import { RibbonSections } from './ui-ribbon-sections.js';

/**
 * Manages the Ribbon UI injection and tab logic
 */
export class RibbonManager {
    constructor(app, ui) {
        this.app = app;
        this.ui = ui;
        this.tabs = [
            { id: 'home', label: 'Home' },
            { id: 'draw', label: 'Draw & Sketch' },
            { id: 'components', label: 'Mechatronics' },
            { id: 'modelling', label: 'Hybrid Ops' },
            { id: 'annotate', label: 'Annotate' },
            { id: 'digitize', label: 'Digitize' },
            { id: 'circuit', label: 'Electrotechnology' },
            { id: 'output', label: 'Output' },
            { id: 'ai', label: 'EngiGraph AI' },
            { id: 'help', label: 'Documentation' }
        ];
    }

    render() {
        const tabsContainer = document.getElementById('ribbon-tabs-container');
        const contentContainer = document.getElementById('ribbon-content-container');

        if (!tabsContainer || !contentContainer) return;

        // Render Tabs
        tabsContainer.innerHTML = this.tabs.map(tab => 
            `<button class="tab-btn ${tab.id === 'home' ? 'active' : ''}" data-tab="${tab.id}">${tab.label}</button>`
        ).join('');

        // Render Sections using decoupled template factory
        contentContainer.innerHTML = `
            ${RibbonSections.renderHomeTab()}
            ${RibbonSections.renderDrawTab()}
            ${RibbonSections.renderComponentsTab()}
            ${RibbonSections.renderModellingTab()}
            ${RibbonSections.renderAnnotateTab()}
            ${RibbonSections.renderDigitizeTab()}
            ${RibbonSections.renderCircuitTab()}
            ${RibbonSections.renderOutputTab()}
            ${RibbonSections.renderAITab()}
            ${RibbonSections.renderHelpTab()}
        `;
        
        this.attachListeners();
    }

    // removed renderHomeTab() {}
    // removed renderDrawTab() {}
    // removed renderComponentsTab() {}
    // removed renderModellingTab() {}
    // removed renderAnnotateTab() {}
    // removed renderDigitizeTab() {}
    // removed renderCircuitTab() {}
    // removed renderOutputTab() {}
    // removed renderAITab() {}

    attachListeners() {
        // Ensure buttons are responsive even if child icons are clicked
        const handleToolClick = (e) => {
            const btn = e.target.closest('.tool-btn');
            if (!btn) return;
            
            if (btn.dataset.tool) {
                this.app.tools.setTool(btn.dataset.tool);
            } else if (btn.classList.contains('btn-part-trigger') || btn.dataset.part) {
                const partType = btn.dataset.part;
                if (partType) this.app.tools.components.startPlacement(partType);
            } else if (btn.id === 'btn-sim-start' || btn.closest('#btn-sim-start')) {
                this.app.circuit.start();
                const startBtn = document.getElementById('btn-sim-start');
                if (startBtn) startBtn.classList.add('tool-active');
            } else if (btn.id === 'btn-sim-stop' || btn.closest('#btn-sim-stop')) {
                this.app.circuit.stop();
                const startBtn = document.getElementById('btn-sim-start');
                if (startBtn) startBtn.classList.remove('tool-active');
            } else if (btn.id === 'btn-sim-scope' || btn.closest('#btn-sim-scope')) {
                this.ui.simulation.toggleScope(true);
            } else if (btn.id === 'btn-sim-terminal' || btn.closest('#btn-sim-terminal')) {
                document.getElementById('terminal-panel').classList.remove('hidden');
            } else if (btn.id === 'btn-sim-flow' || btn.closest('#btn-sim-flow')) {
                if(this.app.flowSim) this.app.flowSim.toggle();
            } else if (btn.id === 'btn-sim-acoustic' || btn.closest('#btn-sim-acoustic')) {
                if(this.app.acousticSim) this.app.acousticSim.toggle();
            } else if (btn.id === 'btn-sim-noise' || btn.closest('#btn-sim-noise')) {
                if(this.app.noiseSim) this.app.noiseSim.toggle();
            }
        };

        // Delegate listener to ribbon container for better performance and reliability
        const ribbonContent = document.getElementById('ribbon-content-container');
        if (ribbonContent) {
            ribbonContent.onclick = handleToolClick;
        }

        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(tab => {
            tab.onclick = () => this.ui.switchTab(tab.dataset.tab);
        });

        // Icons re-render scoped to ribbon
        createIcons({
            icons: { 
                FilePlus, MousePointer2, Move, Undo2, Redo2, Trash2, Maximize2, 
                Minus, Circle, RefreshCw, Square, PenTool, Split, Tangent, 
                CornerDownRight, Box, Pipette, Triangle, Cpu, LayoutGrid, 
                Copy, Columns, GitMerge, Waves, Ruler, Radius, Sparkles, Compass,
                Type, Upload, Download, FileDown, Printer, Bot, Zap, ZapOff, Send,
                Battery, Activity, Lightbulb, ToggleLeft, GitBranch, CircleSlash,
                GitPullRequest, GitCommit, BookOpen, GraduationCap, ShieldCheck, Wind, Mic, Flame,
                Settings, Grid, Terminal, List, Eye, Code, Sun, Moon, Layers, Info, ChevronLeft, Plus, ChevronRight, ZoomIn, ZoomOut, Maximize
            },
            nameAttr: 'data-ribbon-icon'
        });
    }
}
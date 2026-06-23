import { createIcons, FilePlus, MousePointer2, Move, Undo2, Redo2, Trash2, Maximize2, Minus, Circle, RefreshCw, Square, PenTool, Split, Tangent, CornerDownRight, Box, Pipette, Triangle, Cpu, LayoutGrid, Copy, Columns, GitMerge, Waves, Ruler, Radius, Sparkles, Type, Upload, ZapOff, Download, FileDown, Printer, Bot, Zap, Send, Battery, Activity, Lightbulb, ToggleLeft, GitBranch, CircleSlash, GitPullRequest, GitCommit, BookOpen, GraduationCap, ShieldCheck, Compass, Wind, Mic, Flame, Settings, Grid, Terminal, List, Eye, Code, Sun, Moon, Layers, Info, ChevronLeft, Plus, ChevronRight, ZoomIn, ZoomOut, Maximize } from 'https://esm.sh/lucide';
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
        if (!tabsContainer || !contentContainer)
            return;
        // Render Tabs
        tabsContainer.innerHTML = this.tabs.map(tab => `<button class="tab-btn ${tab.id === 'home' ? 'active' : ''}" data-tab="${tab.id}">${tab.label}</button>`).join('');
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
            if (!btn)
                return;
            if (btn.dataset.tool) {
                this.app.tools.setTool(btn.dataset.tool);
            }
            else if (btn.classList.contains('btn-part-trigger') || btn.dataset.part) {
                const partType = btn.dataset.part;
                if (partType)
                    this.app.tools.components.startPlacement(partType);
            }
            else if (btn.id === 'btn-sim-start' || btn.closest('#btn-sim-start')) {
                this.app.circuit.start();
                const startBtn = document.getElementById('btn-sim-start');
                if (startBtn)
                    startBtn.classList.add('tool-active');
            }
            else if (btn.id === 'btn-sim-stop' || btn.closest('#btn-sim-stop')) {
                this.app.circuit.stop();
                const startBtn = document.getElementById('btn-sim-start');
                if (startBtn)
                    startBtn.classList.remove('tool-active');
            }
            else if (btn.id === 'btn-sim-scope' || btn.closest('#btn-sim-scope')) {
                this.ui.simulation.toggleScope(true);
            }
            else if (btn.id === 'btn-sim-terminal' || btn.closest('#btn-sim-terminal')) {
                document.getElementById('terminal-panel').classList.remove('hidden');
            }
            else if (btn.id === 'btn-sim-flow' || btn.closest('#btn-sim-flow')) {
                if (this.app.flowSim)
                    this.app.flowSim.toggle();
            }
            else if (btn.id === 'btn-sim-acoustic' || btn.closest('#btn-sim-acoustic')) {
                if (this.app.acousticSim)
                    this.app.acousticSim.toggle();
            }
            else if (btn.id === 'btn-sim-noise' || btn.closest('#btn-sim-noise')) {
                if (this.app.noiseSim)
                    this.app.noiseSim.toggle();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidWktcmliYm9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vdWktcmliYm9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFDSCxXQUFXLEVBQUUsUUFBUSxFQUFFLGFBQWEsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUMzRSxLQUFLLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsZUFBZSxFQUMxRSxHQUFHLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxHQUFHLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFDdkUsS0FBSyxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUMvRSxHQUFHLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsU0FBUyxFQUFFLFVBQVUsRUFBRSxTQUFTLEVBQUUsV0FBVyxFQUMzRSxjQUFjLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRSxhQUFhLEVBQUUsV0FBVyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFDMUYsUUFBUSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUNqSSxNQUFNLHVCQUF1QixDQUFDO0FBQy9CLE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSx5QkFBeUIsQ0FBQztBQUV6RDs7R0FFRztBQUNILE1BQU0sT0FBTyxhQUFhO0lB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
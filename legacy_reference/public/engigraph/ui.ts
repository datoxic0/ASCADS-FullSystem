import paper from 'https://esm.sh/paper';
import { LayerPanel } from './ui-layers.js';
import { PropertyPanel } from './ui-properties.js';
import { RibbonManager } from './ui-ribbon.js';
import { ModalManager } from './ui-modals.js';
import { IOManager } from './ui-io.js';
import { TemplateManager } from './ui-templates.js';
import { ReportManager } from './ui-reports.js';
import { SimulationUI } from './ui-simulation.js';

/**
 * Refactored UI Manager: Orchestrates specialized UI modules.
 */
export class UIManager {
    constructor(app) {
        this.app = app;
        
        // UI sub-components
        this.ribbon = new RibbonManager(app, this);
        this.modals = new ModalManager(app, this);
        this.layers = new LayerPanel(app, this);
        this.properties = new PropertyPanel(app, this);
        this.simulation = new SimulationUI(app);
    }

    initUI() {
        this.ribbon.render();
        this.modals.render();

        this.initGeneralListeners();
        this.initNavigationListeners();
        this.initDocumentListeners();
        this.initSidebarListeners();

        this.layers.updateLayerUI();
    }

    initGeneralListeners() {
        const updateScale = (e) => {
            const val = e.target.value.split(':');
            this.app.scaleFactor = parseFloat(val[0]) / parseFloat(val[1]);
            document.querySelectorAll('select[id^="select-scale"]').forEach(s => s.value = e.target.value);
        };
        document.getElementById('select-scale-home')?.addEventListener('change', updateScale);

        ['grid', 'object', 'ortho', 'angle'].forEach(s => {
            const el = document.getElementById(`snap-${s}`);
            const key = s === 'angle' ? 'angleSnap' : s;
            if (el) el.addEventListener('change', () => {
                this.app.snapSettings[key] = el.checked;
                if (key === 'grid') this.app.viewManager.drawGrid();
            });
        });

        const stepInput = document.getElementById('snap-grid-step');
        if (stepInput) {
            stepInput.addEventListener('change', (e) => {
                this.app.snapSettings.gridStep = parseFloat(e.target.value) || 1.0;
                this.app.viewManager.drawGrid();
            });
        }

        document.getElementById('btn-theme-toggle')?.addEventListener('click', () => this.toggleTheme());

        const activeColorPicker = document.getElementById('active-color-picker');
        if (activeColorPicker) {
            activeColorPicker.addEventListener('input', (e) => {
                this.app.activeColor = e.target.value;
                // If something is selected, apply the color immediately to provide "live" control
                if (this.app.tools.selection) {
                    const item = this.app.tools.selection;
                    const applyToItem = (obj) => {
                        if (obj.children) obj.children.forEach(c => applyToItem(c));
                        else if (obj.strokeColor) obj.strokeColor = e.target.value;
                    };
                    applyToItem(item);
                    this.app.history.pushState();
                    paper.view.update();
                }
            });
        }
    }

    logToTerminal(msg, type = 'system') {
        const log = document.getElementById('terminal-log');
        if (!log) return;
        const line = document.createElement('div');
        line.className = `term-line ${type}`;
        line.textContent = `${type === 'mcu' ? '' : '> '}${msg}`;
        log.appendChild(line);
        log.scrollTop = log.scrollHeight;
        
        // Limit terminal history
        while (log.children.length > 100) {
            log.removeChild(log.firstChild);
        }
    }

    initNavigationListeners() {
        document.getElementById('btn-zoom-in')?.addEventListener('click', () => this.app.viewManager.zoomByFactor(1.2));
        document.getElementById('btn-zoom-out')?.addEventListener('click', () => this.app.viewManager.zoomByFactor(0.8));
        document.getElementById('btn-zoom-reset')?.addEventListener('click', () => {
            paper.view.zoom = 1.0;
            paper.view.center = new paper.Point(0, 0);
            this.app.viewManager.drawGrid();
        });
        document.getElementById('btn-zoom-extents')?.addEventListener('click', () => this.app.viewManager.zoomExtents());

        document.getElementById('btn-iso-on')?.addEventListener('click', () => this.setIsoMode(true));
        document.getElementById('btn-iso-off')?.addEventListener('click', () => this.setIsoMode(false));
        document.getElementById('select-isoplane')?.addEventListener('change', (e) => {
            this.app.isoPlane = e.target.value;
            this.app.viewManager.drawGrid();
        });
    }

    initDocumentListeners() {
        document.getElementById('btn-new-home')?.addEventListener('click', () => {
            if(confirm("Discard current drawing?")) this.app.initLayers();
        });
        document.getElementById('btn-insert-template')?.addEventListener('click', () => {
            const size = document.getElementById('sheet-select').value;
            if (size !== 'none') this.applySheetTemplate(size);
        });
        document.getElementById('standard-select')?.addEventListener('change', (e) => {
            this.app.currentStandard = e.target.value;
            this.app.ai.logAI("System", `Standard switched to ${e.target.value}. Compliance rules updated.`);
        });
        document.getElementById('btn-validate')?.addEventListener('click', () => this.app.runValidation());
        document.getElementById('btn-ai-audit')?.addEventListener('click', () => this.app.ai.runComplianceAudit());
        document.getElementById('btn-undo')?.addEventListener('click', () => this.app.history.undo());
        document.getElementById('btn-redo')?.addEventListener('click', () => this.app.history.redo());
        document.getElementById('btn-delete')?.addEventListener('click', () => {
            if (this.app.tools.selection) {
                this.app.tools.selection.remove();
                this.app.tools.selection = null;
                this.properties.updateProperties(null);
                this.app.history.pushState();
            }
        });
        document.getElementById('btn-import-digitize')?.addEventListener('click', () => document.getElementById('import-input').click());
        document.getElementById('import-input')?.addEventListener('change', async (e) => {
            if (e.target.files.length > 0) this.app.handleImport(e.target.files[0]);
        });
        document.getElementById('btn-save-ribbon')?.addEventListener('click', () => this.exportSVG());
        document.getElementById('btn-download-project')?.addEventListener('click', () => this.exportProjectJSON());
        document.getElementById('btn-open-project')?.addEventListener('click', () => document.getElementById('project-import-input')?.click());
        document.getElementById('project-import-input')?.addEventListener('change', async (e) => {
            if (e.target.files.length > 0) IOManager.importProjectJSON(this.app, e.target.files[0]);
        });
        document.getElementById('btn-print-ribbon')?.addEventListener('click', () => window.print());
        document.getElementById('btn-gen-bom')?.addEventListener('click', () => this.generateBOM());
        document.getElementById('btn-open-code')?.addEventListener('click', () => this.showCodeView());
        document.getElementById('btn-ai-architect')?.addEventListener('click', () => this.app.ai.generateCustomComponent());
        document.getElementById('btn-ai-vision')?.addEventListener('click', () => {
            this.app.ai.toggleAIModal(true);
            this.app.ai.logAI("System", "Vision initialized. Processing canvas image...");
            this.app.ai.handleAIChat(); // Triggers a vision-aware chat based on the current canvas
        });
        document.getElementById('btn-ai-compliance')?.addEventListener('click', () => this.app.ai.runComplianceAudit());
        document.getElementById('btn-ai-route')?.addEventListener('click', () => {
            this.app.ai.toggleAIModal(true);
            this.app.ai.logAI("You", "AI, please auto-route the current mechatronic components logically.");
            this.app.ai.handleAIChat();
        });
        document.getElementById('btn-gen-enclosure')?.addEventListener('click', () => this.app.tools.modelling.handleGenerateEnclosure());
        document.getElementById('btn-ai-refine')?.addEventListener('click', () => {
            this.app.ai.toggleAIModal(true);
            this.app.ai.logAI("You", "AI, refine my current sketches into precise CAD geometry.");
            this.app.ai.handleAIChat();
        });
        document.getElementById('btn-open-ai')?.addEventListener('click', () => this.app.ai.toggleAIModal(true));
        document.getElementById('btn-open-thesis')?.addEventListener('click', () => this.modals.showThesis('abstract'));
        document.getElementById('btn-open-tutorial')?.addEventListener('click', () => this.modals.showThesis('tutorial'));
        document.getElementById('btn-standards-info')?.addEventListener('click', () => this.modals.showThesis('standards'));
    }

    initSidebarListeners() {
        const setSidebar = (side, collapse) => {
            const el = document.getElementById(`sidebar-${side}`);
            el.classList.toggle('collapsed', collapse);
            document.getElementById(`btn-expand-${side}`).classList.toggle('hidden', !collapse);
            setTimeout(() => this.app.viewManager.drawGrid(), 310);
        };
        const toggleMobileSidebar = (side) => {
            const target = side === 'left' ? 'sidebar-left' : 'sidebar-right';
            document.getElementById(target).classList.toggle('open');
            const other = side === 'left' ? 'sidebar-right' : 'sidebar-left';
            document.getElementById(other).classList.remove('open');
        };

        const layersToggleHeader = document.getElementById('header-layers-toggle');
        if (layersToggleHeader) {
            layersToggleHeader.addEventListener('click', (e) => {
                if (e.target.closest('#btn-collapse-left')) return;
                const wrapper = document.getElementById('layers-collapsible-wrapper');
                const icon = document.getElementById('icon-layers-toggle');
                if (wrapper.classList.contains('hidden')) {
                    wrapper.classList.remove('hidden');
                    if(icon) icon.style.transform = 'rotate(0deg)';
                } else {
                    wrapper.classList.add('hidden');
                    if(icon) icon.style.transform = 'rotate(-90deg)';
                }
            });
        }

        document.getElementById('btn-toggle-layers')?.addEventListener('click', () => toggleMobileSidebar('left'));
        document.getElementById('btn-toggle-props')?.addEventListener('click', () => toggleMobileSidebar('left'));
        document.getElementById('btn-collapse-left')?.addEventListener('click', () => setSidebar('left', true));
        document.getElementById('btn-expand-left')?.addEventListener('click', () => setSidebar('left', false));
        document.getElementById('btn-collapse-right')?.addEventListener('click', () => setSidebar('right', true));
        document.getElementById('btn-expand-right')?.addEventListener('click', () => setSidebar('right', false));
        document.getElementById('btn-close-scope')?.addEventListener('click', () => this.simulation.toggleScope(false));
        document.getElementById('btn-close-terminal')?.addEventListener('click', () => {
            document.getElementById('terminal-panel').classList.add('hidden');
        });
        document.getElementById('btn-term-clear')?.addEventListener('click', () => {
            (document.getElementById('terminal-log') || {}).innerHTML = '';
        });
        document.getElementById('term-input')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const val = e.target.value;
                if (val) {
                    this.logToTerminal(val, 'user');
                    e.target.value = '';
                }
            }
        });
        document.getElementById('btn-add-layer')?.addEventListener('click', () => {
            const name = prompt("Enter layer name:");
            if (name) {
                new paper.Layer({ name: name + '_layer' });
                this.layers.updateLayerUI();
            }
        });
    }

    setIsoMode(active) {
        this.app.isIsometric = active;
        const btnOn = document.getElementById('btn-iso-on');
        const btnOff = document.getElementById('btn-iso-off');
        const controls = document.getElementById('isoplane-controls');
        if (btnOn) btnOn.classList.toggle('active', active);
        if (btnOff) btnOff.classList.toggle('active', !active);
        if (controls) controls.classList.toggle('hidden', !active);
        this.app.viewManager.drawGrid();
    }

    switchTab(tabId) {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tabId));
        document.querySelectorAll('.tool-section').forEach(s => s.classList.toggle('hidden', s.dataset.tab !== tabId));
    }

    toggleTheme() {
        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        const newTheme = isLight ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        
        localStorage.setItem('engigraph_theme', newTheme);
        this.app.theme.update();
        
        // Brief delay to allow CSS transitions to finish before redrawing grid
        setTimeout(() => {
            this.app.viewManager.drawGrid();
        }, 50);
    }

    exportSVG() { IOManager.exportSVG(this.app); }
    exportProjectJSON() { IOManager.exportProjectJSON(this.app); }
    applySheetTemplate(size) { 
        const details = {
            project: document.getElementById('sheet-project')?.value || "PROJECT",
            designer: document.getElementById('sheet-designer')?.value || "DESIGNER",
            date: document.getElementById('sheet-date')?.value || new Date().toLocaleDateString()
        };
        TemplateManager.applySheetTemplate(this.app, size, details); 
    }
    generateBOM() { ReportManager.generateBOM(this.app, this); }

    showCodeView() {
        const overlay = document.getElementById('code-view-overlay');
        this.updateCodeViewFormat('json');
        overlay.classList.remove('hidden');

        const copyBtn = document.getElementById('btn-copy-code');
        if (copyBtn) {
            copyBtn.onclick = () => {
                const editor = document.getElementById('code-editor');
                editor.select();
                navigator.clipboard.writeText(editor.value);
                this.app.ai.logAI("System", "Code copied to clipboard via secure API.");
            };
        }

        const applyBtn = document.getElementById('btn-apply-code');
        if (applyBtn) {
            applyBtn.onclick = () => {
                try {
                    const content = document.getElementById('code-editor').value;
                    this.app.history.applyState(content);
                    overlay.classList.add('hidden');
                    this.app.ai.logAI("System", "Project source updated and synchronized.");
                } catch (e) { 
                    console.error("Import error:", e);
                    this.app.ai.logAI("System", "Error: Invalid JSON engineering source.");
                }
            };
        }
    }

    updateCodeViewFormat(format) { ReportManager.updateCodeViewFormat(this.app, format); }

    showModal(title, body, onOk) {
        const modal = document.getElementById('generic-modal');
        (document.getElementById('modal-title') || {}).textContent = title;
        (document.getElementById('modal-body') || {}).innerHTML = body;
        modal.classList.remove('hidden');
        document.getElementById('modal-ok').onclick = () => { onOk?.(); modal.classList.add('hidden'); };
        document.getElementById('modal-close').onclick = () => modal.classList.add('hidden');
    }

    // removed generatePythonSchemDraw() {}
}
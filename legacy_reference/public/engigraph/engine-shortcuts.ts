/**
 * Global Keyboard Shortcut Manager.
 */
export class ShortcutManager {
    constructor(app) {
        this.app = app;
    }

    applyColorShortcut(key) {
        const palette = {
            '1': this.app.themeColors.geometry, // Theme Default
            '2': '#ff3b30', // Industrial Red
            '3': '#4cd964', // Safety Green
            '4': '#007aff', // Deep Blue
            '5': '#ffcc00', // Warning Yellow
            '6': '#5ac8fa', // Technical Cyan
            '7': '#ff9500', // Electrical Orange
            '8': '#af52de', // Purple
            '9': '#555555', // Steel / Dark Gray
            '0': '#000000'  // Black
        };

        const color = palette[key];
        if (!color) return;

        // Update active color "lock" for future drawing
        this.app.activeColor = color;
        const picker = document.getElementById('active-color-picker');
        if (picker) picker.value = color;

        const item = this.app.tools.selection;
        if (item) {
            const applyToItem = (obj) => {
                if (obj.children) {
                    obj.children.forEach(child => applyToItem(child));
                } else {
                    if (obj.strokeColor) obj.strokeColor = color;
                }
            };

            applyToItem(item);
            this.app.ui.properties.updateProperties(item);
            this.app.history.pushState();
            if (typeof paper !== 'undefined' && paper.view) paper.view.update();
            const msgEl = document.getElementById('status-msg');
            if (msgEl) msgEl.textContent = `Shortcut: Color [${key}] applied to selection.`;
        } else {
            const msgEl = document.getElementById('status-msg');
            if (msgEl) msgEl.textContent = `Active color set to [${key}]. New entities will use this color.`;
        }
    }

    init() {
        window.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            // Multi-key shortcuts
            if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
                switch (e.key.toLowerCase()) {
                    case 'z': e.preventDefault(); this.app.history.undo(); break;
                    case 'y': e.preventDefault(); this.app.history.redo(); break;
                    case 's': e.preventDefault(); this.app.ui.exportSVG(); break;
                }
            }

            if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
                switch (e.key.toLowerCase()) {
                    case 'z': e.preventDefault(); this.app.history.redo(); break;
                }
            }

            // Single key shortcuts
            const key = e.key.toLowerCase();

            // Color Shortcuts (Tinkercad style 0-9)
            if (!isNaN(parseInt(key)) && !e.ctrlKey && !e.metaKey && !e.altKey) {
                this.applyColorShortcut(key);
                return;
            }

            switch (key) {
                case 'delete':
                case 'backspace':
                    if (this.app.tools.selection) {
                        this.app.tools.selection.remove();
                        this.app.tools.selection = null;
                        this.app.ui.properties.updateProperties(null);
                        this.app.history.pushState();
                    }
                    break;
                case 'escape':
                    this.app.tools.resetTemp();
                    this.app.tools.setTool('select');
                    break;
                case 'v': this.app.tools.setTool('select'); break;
                case 'h': this.app.tools.setTool('pan'); break;
                case 'l': this.app.tools.setTool('line'); break;
                case 'c': this.app.tools.setTool('circle'); break;
                case 'r': this.app.tools.setTool('rect'); break;
                case 'a': this.app.tools.setTool('arc'); break;
                case 't': this.app.tools.setTool('text'); break;
                case 'd': this.app.tools.setTool('dim-smart'); break;
                
                // Navigation & View Controls
                case 'f': this.app.viewManager.zoomExtents(); break;
                case 'g': 
                    const gridCheck = document.getElementById('snap-grid');
                    if (gridCheck) { gridCheck.checked = !gridCheck.checked; gridCheck.dispatchEvent(new Event('change')); }
                    break;
                case 'o':
                    const orthoCheck = document.getElementById('snap-ortho');
                    if (orthoCheck) { orthoCheck.checked = !orthoCheck.checked; orthoCheck.dispatchEvent(new Event('change')); }
                    break;
                case 's':
                    if (!e.ctrlKey && !e.metaKey) {
                        const objCheck = document.getElementById('snap-object');
                        if (objCheck) { objCheck.checked = !objCheck.checked; objCheck.dispatchEvent(new Event('change')); }
                    }
                    break;
                case 'i':
                    this.app.ui.setIsoMode(!this.app.isIsometric);
                    break;
                case 'q':
                    this.app.ui.toggleTheme();
                    break;
                
                // UI Management
                case 'p':
                    const collapseBtn = document.getElementById('btn-collapse-left');
                    const expandBtn = document.getElementById('btn-expand-left');
                    if (collapseBtn && !collapseBtn.closest('.collapsed')) collapseBtn.click();
                    else if (expandBtn) expandBtn.click();
                    break;
                case 'b':
                    this.app.ui.generateBOM();
                    break;
            }
        });
    }
}
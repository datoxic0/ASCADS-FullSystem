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
            '0': '#000000' // Black
        };
        const color = palette[key];
        if (!color)
            return;
        // Update active color "lock" for future drawing
        this.app.activeColor = color;
        const picker = document.getElementById('active-color-picker');
        if (picker)
            picker.value = color;
        const item = this.app.tools.selection;
        if (item) {
            const applyToItem = (obj) => {
                if (obj.children) {
                    obj.children.forEach(child => applyToItem(child));
                }
                else {
                    if (obj.strokeColor)
                        obj.strokeColor = color;
                }
            };
            applyToItem(item);
            this.app.ui.properties.updateProperties(item);
            this.app.history.pushState();
            if (typeof paper !== 'undefined' && paper.view)
                paper.view.update();
            const msgEl = document.getElementById('status-msg');
            if (msgEl)
                msgEl.textContent = `Shortcut: Color [${key}] applied to selection.`;
        }
        else {
            const msgEl = document.getElementById('status-msg');
            if (msgEl)
                msgEl.textContent = `Active color set to [${key}]. New entities will use this color.`;
        }
    }
    init() {
        window.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')
                return;
            // Multi-key shortcuts
            if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
                switch (e.key.toLowerCase()) {
                    case 'z':
                        e.preventDefault();
                        this.app.history.undo();
                        break;
                    case 'y':
                        e.preventDefault();
                        this.app.history.redo();
                        break;
                    case 's':
                        e.preventDefault();
                        this.app.ui.exportSVG();
                        break;
                }
            }
            if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
                switch (e.key.toLowerCase()) {
                    case 'z':
                        e.preventDefault();
                        this.app.history.redo();
                        break;
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
                case 'v':
                    this.app.tools.setTool('select');
                    break;
                case 'h':
                    this.app.tools.setTool('pan');
                    break;
                case 'l':
                    this.app.tools.setTool('line');
                    break;
                case 'c':
                    this.app.tools.setTool('circle');
                    break;
                case 'r':
                    this.app.tools.setTool('rect');
                    break;
                case 'a':
                    this.app.tools.setTool('arc');
                    break;
                case 't':
                    this.app.tools.setTool('text');
                    break;
                case 'd':
                    this.app.tools.setTool('dim-smart');
                    break;
                // Navigation & View Controls
                case 'f':
                    this.app.viewManager.zoomExtents();
                    break;
                case 'g':
                    const gridCheck = document.getElementById('snap-grid');
                    if (gridCheck) {
                        gridCheck.checked = !gridCheck.checked;
                        gridCheck.dispatchEvent(new Event('change'));
                    }
                    break;
                case 'o':
                    const orthoCheck = document.getElementById('snap-ortho');
                    if (orthoCheck) {
                        orthoCheck.checked = !orthoCheck.checked;
                        orthoCheck.dispatchEvent(new Event('change'));
                    }
                    break;
                case 's':
                    if (!e.ctrlKey && !e.metaKey) {
                        const objCheck = document.getElementById('snap-object');
                        if (objCheck) {
                            objCheck.checked = !objCheck.checked;
                            objCheck.dispatchEvent(new Event('change'));
                        }
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
                    if (collapseBtn && !collapseBtn.closest('.collapsed'))
                        collapseBtn.click();
                    else if (expandBtn)
                        expandBtn.click();
                    break;
                case 'b':
                    this.app.ui.generateBOM();
                    break;
            }
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW5naW5lLXNob3J0Y3V0cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL2VuZ2luZS1zaG9ydGN1dHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7O0dBRUc7QUFDSCxNQUFNLE9BQU8sZUFBZTtJQUN4QixZQUFZLEdBQUc7UUFDWCxJQUFJLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztJQUNuQixDQUFDO0lBRUQsa0JBQWtCLENBQUMsR0FBRztRQUNsQixNQUFNLE9BQU8sR0FBRztZQUNaLEdBQUcsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxRQUFRLEVBQUUsZ0JBQWdCO1lBQ3BELEdBQUcsRUFBRSxTQUFTLEVBQUUsaUJBQWlCO1lBQ2pDLEdBQUcsRUFBRSxTQUFTLEVBQUUsZUFBZTtZQUMvQixHQUFHLEVBQUUsU0FBUyxFQUFFLFlBQVk7WUFDNUIsR0FBRyxFQUFFLFNBQVMsRUFBRSxpQkFBaUI7WUFDakMsR0FBRyxFQUFFLFNBQVMsRUFBRSxpQkFBaUI7WUFDakMsR0FBRyxFQUFFLFNBQVMsRUFBRSxvQkFBb0I7WUFDcEMsR0FBRyxFQUFFLFNBQVMsRUFBRSxTQUFTO1lBQ3pCLEdBQUcsRUFBRSxTQUFTLEVBQUUsb0JBQW9CO1lBQ3BDLEdBQUcsRUFBRSxTQUFTLENBQUUsUUFBUTtTQUMzQixDQUFDO1FBRUYsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzNCLElBQUksQ0FBQyxLQUFLO1lBQUUsT0FBTztRQUVuQixnREFBZ0Q7UUFDaEQsSUFBSSxDQUFDLEdBQUcsQ0FBQyxXQUFXLEdBQUcsS0FBSyxDQUFDO1FBQzdCLE1BQU0sTUFBTSxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMscUJBQXFCLENBQUMsQ0FBQztRQUM5RCxJQUFJLE1BQU07WUFBRSxNQUFNLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztRQUVqQyxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFD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
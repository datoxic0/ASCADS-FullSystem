import paper from 'https://esm.sh/paper';

/**
 * Handles application theming and dynamic color profile updates.
 */
export class ThemeManager {
    constructor(app) {
        this.app = app;
    }

    init() {
        const savedTheme = localStorage.getItem('engigraph_theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.update();
    }

    update() {
        const oldGeom = this.app.themeColors?.geometry;
        const oldText = this.app.themeColors?.text;

        const style = getComputedStyle(document.documentElement);
        const getHex = (prop) => {
            const val = style.getPropertyValue(prop).trim();
            if (!val) return null;
            try { return new paper.Color(val).toCSS(true).toLowerCase(); } catch (e) { return val.toLowerCase(); }
        };

        this.app.themeColors = {
            geometry: getHex('--geometry-default') || (document.documentElement.getAttribute('data-theme') === 'light' ? '#000000' : '#ffffff'),
            text: getHex('--text-main') || '#ffffff',
            accent: getHex('--accent') || '#00f2ff'
        };

        // Sync active color with theme if it's currently the default
        if (this.app.activeColor === oldGeom || !oldGeom) {
            this.app.activeColor = this.app.themeColors.geometry;
            const picker = document.getElementById('active-color-picker');
            if (picker) picker.value = this.app.activeColor;
        }

        // Theme color migration for existing geometry
        if (oldGeom && oldGeom !== this.app.themeColors.geometry) {
            paper.project.getItems({
                match: (item) => item.layer && item.layer.name !== 'grid_layer'
            }).forEach(item => {
                const checkAndSwap = (prop, oldVal, newVal) => {
                    if (item[prop]) {
                        const current = item[prop].toCSS(true).toLowerCase();
                        if (current === oldVal) item[prop] = newVal;
                    }
                };
                checkAndSwap('strokeColor', oldGeom, this.app.themeColors.geometry);
                checkAndSwap('fillColor', oldGeom, this.app.themeColors.geometry);
                checkAndSwap('strokeColor', oldText, this.app.themeColors.text);
                checkAndSwap('fillColor', oldText, this.app.themeColors.text);
            });
            paper.view.update();
        }
        
        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        const lightIcon = document.getElementById('theme-icon-light');
        const darkIcon = document.getElementById('theme-icon-dark');
        if (lightIcon && darkIcon) {
            lightIcon.classList.toggle('hidden', !isLight);
            darkIcon.classList.toggle('hidden', isLight);
        }
    }
}
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
            if (!val)
                return null;
            try {
                return new paper.Color(val).toCSS(true).toLowerCase();
            }
            catch (e) {
                return val.toLowerCase();
            }
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
            if (picker)
                picker.value = this.app.activeColor;
        }
        // Theme color migration for existing geometry
        if (oldGeom && oldGeom !== this.app.themeColors.geometry) {
            paper.project.getItems({
                match: (item) => item.layer && item.layer.name !== 'grid_layer'
            }).forEach(item => {
                const checkAndSwap = (prop, oldVal, newVal) => {
                    if (item[prop]) {
                        const current = item[prop].toCSS(true).toLowerCase();
                        if (current === oldVal)
                            item[prop] = newVal;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW5naW5lLXRoZW1lLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vZW5naW5lLXRoZW1lLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sS0FBSyxNQUFNLHNCQUFzQixDQUFDO0FBRXpDOztHQUVHO0FBQ0gsTUFBTSxPQUFPLFlBQVk7SUFDckIsWUFBWSxHQUFHO1FBQ1gsSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUM7SUFDbkIsQ0FBQztJQUVELElBQUk7UUFDQSxNQUFNLFVBQVUsR0FBRyxZQUFZLENBQUMsT0FBTyxDQUFDLGlCQUFpQixDQUFDLElBQUksTUFBTSxDQUFDO1FBQ3JFLFFBQVEsQ0FBQyxlQUFlLENBQUMsWUFBWSxDQUFDLFlBQVksRUFBRSxVQUFVLENBQUMsQ0FBQztRQUNoRSxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7SUFDbEIsQ0FBQztJQUVELE1BQU07UUFDRixNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRSxRQUFRLENBQUM7UUFDL0MsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDO1FBRTNDLE1BQU0sS0FBSyxHQUFHLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUMsQ0FBQztRQUN6RCxNQUFNLE1BQU0sR0FBRyxDQUFDLElBQUksRUFBRSxFQUFFO1lBQ3BCLE1BQU0sR0FBRyxHQUFHLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNoRCxJQUFJLENBQUMsR0FBRztnQkFBRSxPQUFPLElBQUksQ0FBQztZQUN0QixJQUFJLENBQUM7Z0JBQUMsT0FBTyxJQUFJLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQUMsQ0FBQztZQUFDLE9BQU8sQ0FBQyxFQUFFLENB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
import paper from 'https://esm.sh/paper';

/**
 * Manufacturing-focused Design Automation (Enclosures/Mounts)
 */
export class ManufacturingOps {
    static handleGenerateEnclosure(app) {
        const selection = paper.project.selectedItems.filter(i => i.layer && i.layer.name !== 'grid_layer');
        if (selection.length === 0) return;

        const bounds = selection.reduce((acc, item) => acc.unite(item.bounds), selection[0].bounds);
        const padding = 15 * app.scaleFactor;
        const encBounds = bounds.expand(padding * 2);
        const enclosureLayer = app.layers.enclosure || new paper.Layer({ name: 'enclosure_layer' });
        enclosureLayer.activate();
        enclosureLayer.removeChildren();

        const topGroup = new paper.Group();
        const shell = new paper.Path.Rectangle(encBounds, 5 * app.scaleFactor);
        shell.strokeColor = 'var(--accent)';
        shell.strokeWidth = 2;
        shell.fillColor = 'rgba(0, 136, 255, 0.05)';
        topGroup.addChild(shell);

        const frontY = encBounds.bottom + 50 * app.scaleFactor;
        const frontBase = new paper.Path.Rectangle(new paper.Point(encBounds.left, frontY), new paper.Size(encBounds.width, 3 * app.scaleFactor));
        frontBase.strokeColor = 'var(--accent)';

        app.ai.logAI("System", "SANS 10111 enclosure blueprint generated.");
        app.history.pushState();
        app.layers.geometry.activate();
        app.ui.layers.updateLayerUI();
    }
}
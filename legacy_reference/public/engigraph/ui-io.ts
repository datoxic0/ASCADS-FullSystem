import paper from 'https://esm.sh/paper';

/**
 * Handles Input/Output operations for the application.
 */
export class IOManager {
    static exportSVG(app) {
        const svgElement = paper.project.exportSVG();
        const style = getComputedStyle(document.documentElement);
        
        const resolveColor = (val) => {
            if (val && val.includes('var(--')) {
                const varName = val.match(/var\(--([^)]+)\)/)[1];
                return style.getPropertyValue('--' + varName).trim();
            }
            return val;
        };

        const walk = (node) => {
            if (node.attributes) {
                for (let attr of node.attributes) {
                    if (attr.value.includes('var(--')) {
                        attr.value = resolveColor(attr.value);
                    }
                }
            }
            for (let child of node.childNodes) walk(child);
        };
        walk(svgElement);

        const serializer = new XMLSerializer();
        let svgString = serializer.serializeToString(svgElement);
        svgString = '<?xml version="1.0" standalone="no"?>\r\n' + svgString;

        const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; 
        a.download = `EngiGraph_Export_${new Date().toISOString().slice(0,10)}.svg`; 
        a.click();
        
        app.ai.logAI("System", "Professional SVG exported with resolved color profiles.");
    }

    static exportProjectJSON(app) {
        const state = paper.project.layers
            .filter(l => l.name !== 'grid_layer')
            .map(l => ({ name: l.name, json: l.exportJSON() }));
        
        const data = {
            appName: "EngiGraph Pro",
            version: "1.2.0",
            timestamp: new Date().toISOString(),
            standard: app.currentStandard,
            scale: app.scaleFactor,
            layers: state
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Project_${new Date().getTime()}.engigraph.json`;
        a.click();
        app.ai.logAI("System", "Project package downloaded successfully.");
    }

    static importProjectJSON(app, file) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (!data || !data.layers) throw new Error("Invalid Project File");

                // Clear existing layers safely
                for (let i = paper.project.layers.length - 1; i >= 0; i--) {
                    const layer = paper.project.layers[i];
                    if (layer.name !== 'grid_layer') {
                        layer.remove();
                    } else {
                        // Keep grid but ensure it is at bottom
                        layer.sendToBack();
                    }
                }

                app.layers = { grid: paper.project.layers.find(l => l.name === 'grid_layer') };

                // Reconstruct layers from JSON
                data.layers.forEach(layerData => {
                    const newLayer = new paper.Layer({ name: layerData.name });
                    newLayer.importJSON(layerData.json);
                    
                    if (layerData.name === 'geometry_layer') app.layers.geometry = newLayer;
                    else if (layerData.name === 'dimensions_layer') app.layers.dimensions = newLayer;
                    else if (layerData.name === 'annotations_layer') app.layers.annotations = newLayer;
                });

                // Ensure core layers exist if they weren't in the file
                if (!app.layers.geometry) app.layers.geometry = new paper.Layer({ name: 'geometry_layer' });
                if (!app.layers.dimensions) app.layers.dimensions = new paper.Layer({ name: 'dimensions_layer' });
                if (!app.layers.annotations) app.layers.annotations = new paper.Layer({ name: 'annotations_layer' });

                app.layers.geometry.activate();

                if (data.standard) {
                    app.currentStandard = data.standard;
                    const select = document.getElementById('standard-select');
                    if (select) select.value = data.standard;
                }

                if (data.scale) {
                    app.scaleFactor = data.scale;
                    const scaleSelect = document.getElementById('select-scale-home');
                    if (scaleSelect) {
                        const ratioStr = app.scaleFactor < 1 ? `1:${Math.round(1/app.scaleFactor)}` : `${Math.round(app.scaleFactor)}:1`;
                        scaleSelect.value = ratioStr;
                    }
                }

                paper.view.update();
                app.ai.logAI("System", `Project successfully loaded from file.`);
            } catch (err) {
                app.ai.logAI("Error", `Failed to load project: ${err.message}`);
                console.error("Project Import Error", err);
            }
        };
        reader.readAsText(file);
    }
}
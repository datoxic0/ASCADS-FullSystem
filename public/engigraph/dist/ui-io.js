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
            for (let child of node.childNodes)
                walk(child);
        };
        walk(svgElement);
        const serializer = new XMLSerializer();
        let svgString = serializer.serializeToString(svgElement);
        svgString = '<?xml version="1.0" standalone="no"?>\r\n' + svgString;
        const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `EngiGraph_Export_${new Date().toISOString().slice(0, 10)}.svg`;
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
        if (!file)
            return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (!data || !data.layers)
                    throw new Error("Invalid Project File");
                // Clear existing layers safely
                for (let i = paper.project.layers.length - 1; i >= 0; i--) {
                    const layer = paper.project.layers[i];
                    if (layer.name !== 'grid_layer') {
                        layer.remove();
                    }
                    else {
                        // Keep grid but ensure it is at bottom
                        layer.sendToBack();
                    }
                }
                app.layers = { grid: paper.project.layers.find(l => l.name === 'grid_layer') };
                // Reconstruct layers from JSON
                data.layers.forEach(layerData => {
                    const newLayer = new paper.Layer({ name: layerData.name });
                    newLayer.importJSON(layerData.json);
                    if (layerData.name === 'geometry_layer')
                        app.layers.geometry = newLayer;
                    else if (layerData.name === 'dimensions_layer')
                        app.layers.dimensions = newLayer;
                    else if (layerData.name === 'annotations_layer')
                        app.layers.annotations = newLayer;
                });
                // Ensure core layers exist if they weren't in the file
                if (!app.layers.geometry)
                    app.layers.geometry = new paper.Layer({ name: 'geometry_layer' });
                if (!app.layers.dimensions)
                    app.layers.dimensions = new paper.Layer({ name: 'dimensions_layer' });
                if (!app.layers.annotations)
                    app.layers.annotations = new paper.Layer({ name: 'annotations_layer' });
                app.layers.geometry.activate();
                if (data.standard) {
                    app.currentStandard = data.standard;
                    const select = document.getElementById('standard-select');
                    if (select)
                        select.value = data.standard;
                }
                if (data.scale) {
                    app.scaleFactor = data.scale;
                    const scaleSelect = document.getElementById('select-scale-home');
                    if (scaleSelect) {
                        const ratioStr = app.scaleFactor < 1 ? `1:${Math.round(1 / app.scaleFactor)}` : `${Math.round(app.scaleFactor)}:1`;
                        scaleSelect.value = ratioStr;
                    }
                }
                paper.view.update();
                app.ai.logAI("System", `Project successfully loaded from file.`);
            }
            catch (err) {
                app.ai.logAI("Error", `Failed to load project: ${err.message}`);
                console.error("Project Import Error", err);
            }
        };
        reader.readAsText(file);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidWktaW8uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi91aS1pby50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEtBQUssTUFBTSxzQkFBc0IsQ0FBQztBQUV6Qzs7R0FFRztBQUNILE1BQU0sT0FBTyxTQUFTO0lBQ2xCLE1BQU0sQ0FBQyxTQUFTLENBQUMsR0FBRztRQUNoQixNQUFNLFVBQVUsR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxDQUFDO1FBQzdDLE1BQU0sS0FBSyxHQUFHLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUMsQ0FBQztRQUV6RCxNQUFNLFlBQVksR0FBRyxDQUFDLEdBQUcsRUFBRSxFQUFFO1lBQ3pCLElBQUksR0FBRyxJQUFJLEdBQUcsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztnQkFDaEMsTUFBTSxPQUFPLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNqRCxPQUFPLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEdBQUcsT0FBTyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDekQsQ0FBQztZQUNELE9BQU8sR0FBRyxDQUFDO1FBQ2YsQ0FBQyxDQUFDO1FBRUYsTUFBTSxJQUFJLEdBQUcsQ0FBQyxJQUFJLEVBQUUsRUFBRTtZQUNsQixJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztnQkFDbEIsS0FBSyxJQUFJLElBQUksSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7b0JBQy9CLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQzt3QkFDaEMsSUFBSSxDQUFDLEtBQUssR0FBRyxZQUFZLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUMxQyxDQUFDO2dCQUNMLENBQUM7WUFDTCxDQUFDO1lBQ0QsS0FBSyxJQUFJ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
import paper from 'https://esm.sh/paper';
/**
 * Handles BOM generation and Engineering Source Code (JSON/Python) views.
 */
export class ReportManager {
    static generateBOM(app, ui) {
        const geomLayer = paper.project.layers.find(l => l.name === 'geometry_layer');
        const items = geomLayer?.children || [];
        const components = items.filter(it => it.data.type === 'component');
        if (components.length === 0) {
            app.ai.logAI("System", "No components found to generate BOM.");
            return;
        }
        const counts = {};
        components.forEach(c => {
            const type = c.data.partType || "Unknown Part";
            counts[type] = (counts[type] || 0) + 1;
        });
        let bomHtml = `
            <table style="width:100%; border-collapse: collapse; font-size: 13px;">
                <thead>
                    <tr style="background: #444; color: white; text-align: left;">
                        <th style="padding: 8px;">Part Description</th>
                        <th style="padding: 8px;">Qty</th>
                    </tr>
                </thead>
                <tbody>
        `;
        for (const [part, qty] of Object.entries(counts)) {
            bomHtml += `
                <tr style="border-bottom: 1px solid #444;">
                    <td style="padding: 8px;">${part.replace(/_/g, ' ').toUpperCase()}</td>
                    <td style="padding: 8px;">${qty}</td>
                </tr>
            `;
        }
        bomHtml += `</tbody></table>`;
        ui.showModal("Engineering Bill of Materials (BOM)", bomHtml);
    }
    static updateCodeViewFormat(app, format) {
        const editor = document.getElementById('code-editor');
        const state = paper.project.layers
            .filter(l => l.name !== 'grid_layer' && l.visible)
            .map(l => ({ name: l.name, json: l.exportJSON() }));
        if (format === 'json') {
            editor.value = JSON.stringify({
                app: "EngiGraph Pro",
                standard: app.currentStandard,
                layers: state
            }, null, 2);
            document.getElementById('btn-apply-code').disabled = false;
        }
        else if (format === 'python') {
            editor.value = ReportManager.generatePythonSchemDraw(state);
            document.getElementById('btn-apply-code').disabled = true;
        }
    }
    static generatePythonSchemDraw(layers) {
        let code = "import schemdraw\nimport schemdraw.elements as elm\n\nd = schemdraw.Drawing()\n";
        layers.forEach(layer => {
            const parsed = JSON.parse(layer.json);
            const items = parsed[1]?.children || [];
            items.forEach(it => {
                const data = it[1]?.data || {};
                const pos = it[1]?.matrix?.[4] || [0, 0, 0, 0, 0, 0];
                const x = (pos[4] || 0) / 10;
                const y = (pos[5] || 0) / 10;
                if (data.type === 'wire')
                    code += `d.add(elm.Line().at((${x}, ${y})))\n`;
                else if (data.partType === 'resistor')
                    code += `d.add(elm.Resistor().at((${x}, ${y})))\n`;
                else if (data.partType === 'battery_18650')
                    code += `d.add(elm.Battery().at((${x}, ${y})))\n`;
                else if (data.partType === 'led_red')
                    code += `d.add(elm.LED().at((${x}, ${y})))\n`;
                else if (data.partType === 'ground')
                    code += `d.add(elm.Ground().at((${x}, ${y})))\n`;
            });
        });
        code += "\nd.draw()\n";
        return code;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidWktcmVwb3J0cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3VpLXJlcG9ydHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxLQUFLLE1BQU0sc0JBQXNCLENBQUM7QUFFekM7O0dBRUc7QUFDSCxNQUFNLE9BQU8sYUFBYTtJQUN0QixNQUFNLENBQUMsV0FBVyxDQUFDLEdBQUcsRUFBRSxFQUFFO1FBQ3RCLE1BQU0sU0FBUyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssZ0JBQWdCLENBQUMsQ0FBQztRQUM5RSxNQUFNLEtBQUssR0FBRyxTQUFTLEVBQUUsUUFBUSxJQUFJLEVBQUUsQ0FBQztRQUN4QyxNQUFNLFVBQVUsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLEtBQUssV0FBVyxDQUFDLENBQUM7UUFFcEUsSUFBSSxVQUFVLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO1lBQzFCLEdBQUcsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxzQ0FBc0MsQ0FBQyxDQUFDO1lBQy9ELE9BQU87UUFDWCxDQUFDO1FBRUQsTUFBTSxNQUFNLEdBQUcsRUFBRSxDQUFDO1FBQ2xCLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUU7WUFDbkIsTUFBTSxJQUFJLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLElBQUksY0FBYyxDQUFDO1lBQy9DLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDM0MsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLE9BQU8sR0FBRzs7Ozs7Ozs7O1NBU2IsQ0FBQztRQUVGLEtB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
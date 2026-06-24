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
        } else if (format === 'python') {
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
                const pos = it[1]?.matrix?.[4] || [0,0,0,0,0,0];
                const x = (pos[4] || 0) / 10;
                const y = (pos[5] || 0) / 10;

                if (data.type === 'wire') code += `d.add(elm.Line().at((${x}, ${y})))\n`;
                else if (data.partType === 'resistor') code += `d.add(elm.Resistor().at((${x}, ${y})))\n`;
                else if (data.partType === 'battery_18650') code += `d.add(elm.Battery().at((${x}, ${y})))\n`;
                else if (data.partType === 'led_red') code += `d.add(elm.LED().at((${x}, ${y})))\n`;
                else if (data.partType === 'ground') code += `d.add(elm.Ground().at((${x}, ${y})))\n`;
            });
        });
        code += "\nd.draw()\n";
        return code;
    }
}
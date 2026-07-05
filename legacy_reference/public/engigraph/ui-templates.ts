import paper from 'https://esm.sh/paper';
import * as geom from './geometry.js';

/**
 * Handles Engineering Sheet Templates and Standard Projection Symbols.
 */
export class TemplateManager {
    static applySheetTemplate(app, size, details = {}) {
        const {
            project = "TECHNICAL DRAWING",
            designer = "DESIGNER",
            date = new Date().toLocaleDateString()
        } = details;

        const dims = {
            'A4': [210, 297],
            'A3': [420, 297],
            'A2': [594, 420],
            'A1': [841, 594],
            'A0': [1189, 841]
        };
        const [w, h] = dims[size];
        
        const sheetLayer = app.layers.sheet;
        sheetLayer.activate();
        sheetLayer.removeChildren();

        const rect = new paper.Path.Rectangle(new paper.Point(0, 0), new paper.Size(w, h));
        rect.strokeColor = 'var(--text-dim)';
        rect.strokeWidth = 3;
        rect.fillColor = 'transparent';
        
        // Inner margin line (Standard industrial practice)
        const margin = 10;
        const innerRect = new paper.Path.Rectangle(new paper.Point(margin, margin), new paper.Size(w - margin*2, h - margin*2));
        innerRect.strokeColor = 'var(--text-dim)';
        innerRect.strokeWidth = 1;

        const tbH = 45;
        const tbW = 180;
        const titleBlock = new paper.Group();
        const tbOuter = new paper.Path.Rectangle(new paper.Point(w - tbW - margin, h - tbH - margin), new paper.Size(tbW, tbH));
        tbOuter.strokeColor = 'var(--text-main)';
        tbOuter.strokeWidth = 2;
        titleBlock.addChild(tbOuter);
        titleBlock.strokeColor = 'var(--text-main)';
        titleBlock.strokeWidth = 1.5;

        const titleText = new paper.PointText({
            point: [w - tbW - margin + 8, h - tbH - margin + 12],
            content: `PROJ: ${project.toUpperCase()}`,
            fillColor: 'var(--text-main)',
            fontSize: 8,
            fontWeight: 'bold',
            fontFamily: 'monospace'
        });

        const designerText = new paper.PointText({
            point: [w - tbW - margin + 8, h - tbH - margin + 22],
            content: `DRWN BY: ${designer.toUpperCase()} | DATE: ${date}`,
            fillColor: 'var(--text-dim)',
            fontSize: 7,
            fontFamily: 'monospace'
        });

        const stdText = new paper.PointText({
            point: [w - tbW - margin + 8, h - tbH - margin + 32],
            content: `STD: ${app.currentStandard} | SCALE: 1:${(1/app.scaleFactor).toFixed(1)} | SIZE: ${size}`,
            fillColor: 'var(--accent)',
            fontSize: 7,
            fontFamily: 'monospace'
        });

        if (app.currentStandard === 'SANS') {
            const symbol = geom.createThirdAngleSymbol(new paper.Point(w - 35 - margin, h - 25 - margin), 14);
            sheetLayer.addChild(symbol);
        }

        sheetLayer.addChildren([rect, innerRect, titleBlock, titleText, designerText, stdText]);
        app.viewManager.zoomExtents();
        app.history.pushState();
        app.layers.geometry.activate();
    }
}
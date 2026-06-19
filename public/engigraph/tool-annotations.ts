import paper from 'https://esm.sh/paper';

/**
 * Dimensioning and Annotation Tools
 */
export class AnnotationTools {
    constructor(app, manager) {
        this.app = app;
        this.manager = manager;
    }

    createDimension(p1, p2, val) {
        const prevLayer = paper.project.activeLayer;
        const dimLayer = paper.project.layers['dimensions_layer'] || paper.project.activeLayer;
        dimLayer.activate();
        
        const g = new paper.Group();
        const dir = p2.subtract(p1).normalize();
        const n = new paper.Point(-dir.y, dir.x).multiply(30 / (this.app.viewManager.getZoom() || 1));
        
        const lineStart = p1.add(n);
        const lineEnd = p2.add(n);
        
        // Main Dimension Line
        const l = new paper.Path.Line(lineStart, lineEnd);
        l.strokeColor = '#00ff00';
        l.strokeWidth = 1;
        
        // Arrowheads (Professional CAD style)
        const arrowSize = 6 / (this.app.viewManager.getZoom() || 1);
        const createArrow = (tip, direction) => {
            const head = new paper.Path({
                segments: [
                    tip,
                    tip.add(direction.rotate(165).multiply(arrowSize)),
                    tip.add(direction.rotate(-165).multiply(arrowSize))
                ],
                closed: true,
                fillColor: '#00ff00',
                strokeColor: '#00ff00'
            });
            return head;
        };
        
        const head1 = createArrow(lineStart, dir);
        const head2 = createArrow(lineEnd, dir.multiply(-1));

        // Extension Lines
        const e1 = new paper.Path.Line(p1.add(n.multiply(0.1)), p1.add(n.multiply(1.2)));
        const e2 = new paper.Path.Line(p2.add(n.multiply(0.1)), p2.add(n.multiply(1.2)));
        [e1, e2].forEach(e => { 
            e.strokeColor = '#00ff00'; 
            e.strokeWidth = 0.5; 
            g.addChild(e); 
        });

        // Text
        const mid = lineStart.add(lineEnd).divide(2).add(n.normalize(-8));
        const angle = dir.angle;
        const textRotation = (angle > 90 || angle < -90) ? angle + 180 : angle;
        
        // SANS 10111-1: Dimensions are in mm by default, unit suffix omitted
        const currentStandard = document.getElementById('standard-select')?.value || 'ISO';
        const displayVal = (currentStandard === 'SANS' || currentStandard === 'ISO') ? val : val + " mm";

        const txt = new paper.PointText({ 
            point: mid, 
            content: displayVal, 
            fillColor: '#00ff00', 
            justification: 'center', 
            fontSize: 10, 
            fontWeight: 'bold',
            fontFamily: 'monospace',
            rotation: textRotation
        });
        
        g.addChildren([l, head1, head2, txt]);
        g.data.type = 'dimension';
        prevLayer.activate();
    }

    createRadialDimension(center, edge, radius) {
        const prevLayer = paper.project.activeLayer;
        const dimLayer = paper.project.layers['dimensions_layer'] || paper.project.activeLayer;
        dimLayer.activate();
        const g = new paper.Group();
        const l = new paper.Path.Line(center, edge); l.strokeColor = '#00ff00'; l.dashArray = [2, 2];
        const txt = new paper.PointText({ 
            point: edge.add(edge.subtract(center).normalize(15)), 
            content: "Ø" + (radius * 2).toFixed(2), 
            fillColor: '#00ff00', 
            fontSize: 11, 
            fontFamily: 'monospace' 
        });
        g.addChildren([l, txt]); g.data.type = 'dimension';
        prevLayer.activate();
    }

    handleSmartDim(pt) {
        const h = paper.project.hitTest(pt, { stroke: true, tolerance: 10, match: h => h.item && h.item.layer && h.item.layer.name === 'geometry_layer' });
        if (!h) return;
        const it = h.item;
        if (it.className === 'Path' && it.segments.length === 2) {
            this.createDimension(it.segments[0].point, it.segments[1].point, (it.length * (1/this.app.scaleFactor)).toFixed(2));
            this.app.history.pushState();
        } else if (it.data.type === 'circle' || it.className === 'Path' && it.closed) {
            // Assume circle/arc for simplicity in smart dim
            this.createRadialDimension(it.position, it.segments[0].point, (it.position.getDistance(it.segments[0].point) * (1/this.app.scaleFactor)).toFixed(2));
            this.app.history.pushState();
        }
    }

    createLeader(p1, p2, text) {
        const prevLayer = paper.project.activeLayer;
        const textLayer = paper.project.layers['text_layer'] || paper.project.activeLayer;
        textLayer.activate();

        const group = new paper.Group();
        const dir = p2.subtract(p1).normalize();
        
        // Horizontal landing
        const p3 = p2.add([dir.x > 0 ? 20 : -20, 0]);
        const textColor = this.app.themeColors.text;

        const line = new paper.Path([p1, p2, p3]);
        line.strokeColor = textColor;
        line.strokeWidth = 1;

        const arrowSize = 4 / (this.app.viewManager.getZoom() || 1);
        const arrow = new paper.Path({
            segments: [
                p1,
                p1.add(dir.multiply(-1).rotate(20).multiply(arrowSize)),
                p1.add(dir.multiply(-1).rotate(-20).multiply(arrowSize))
            ],
            closed: true,
            fillColor: textColor
        });

        const txt = new paper.PointText({
            point: p3.add([dir.x > 0 ? 5 : -5, 4]),
            content: text,
            fillColor: textColor,
            fontSize: 11,
            justification: dir.x > 0 ? 'left' : 'right'
        });

        group.addChildren([line, arrow, txt]);
        group.data.type = 'leader';
        
        prevLayer.activate();
    }
}
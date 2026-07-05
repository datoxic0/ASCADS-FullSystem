import paper from 'https://esm.sh/paper';
import * as geom from './geometry.js';

/**
 * Logic for standard geometry primitive creation.
 */
export const ShapeDrawing = {
    createPrimitive: (app, type, point) => {
        const color = app.activeColor || app.themeColors.geometry;
        let path = null;

        switch(type) {
            case 'gear':
                const teeth = app.tools.modelling.lastGearTeeth || 18;
                const mod = app.tools.modelling.lastGearModule || 5;
                path = geom.generateGearPath(teeth, mod, 20); 
                path.position = point;
                path.strokeColor = color;
                path.strokeWidth = 2;
                path.data.type = 'gear';
                path.data.teeth = teeth;
                path.data.module = mod;
                break;
            case 'wire':
                path = new paper.Path();
                path.strokeColor = '#3b82f6'; // distinct wire color (blue-500)
                path.strokeWidth = 3;
                path.shadowColor = '#3b82f6';
                path.shadowBlur = 4;
                path.strokeCap = 'round';
                path.strokeJoin = 'round';
                path.add(point);
                path.data.type = 'wire';
                break;
            case 'line':
                path = new paper.Path.Line(point, point);
                path.strokeColor = color;
                path.strokeWidth = 2;
                break;
            case 'circle':
                path = app.isIsometric ? 
                    new paper.Path.Ellipse({ center: point, radius: [0.1, 0.1] }) : 
                    new paper.Path.Circle(point, 0.1);
                path.strokeColor = color;
                path.strokeWidth = 2;
                break;
            case 'rect':
                path = new paper.Path.Rectangle(point, new paper.Size(0.1, 0.1));
                path.strokeColor = color;
                path.strokeWidth = 2;
                break;
            case 'rounded_rect':
                path = new paper.Path.Rectangle(new paper.Rectangle(point, new paper.Size(0.1, 0.1)), new paper.Size(5, 5));
                path.strokeColor = color;
                path.strokeWidth = 2;
                break;
            case 'ellipse':
                path = new paper.Path.Ellipse({ center: point, radius: [0.1, 0.1] });
                path.strokeColor = color;
                path.strokeWidth = 2;
                break;
            case 'polygon':
                path = new paper.Path.RegularPolygon(point, 6, 0.1);
                path.strokeColor = color;
                path.strokeWidth = 2;
                break;
            case 'spline':
                path = new paper.Path();
                path.strokeColor = color;
                path.strokeWidth = 2;
                path.add(point);
                break;
        }
        return path;
    },

    handleArc: (app, manager, point) => {
        manager.clickSequence.push(point);
        if (manager.clickSequence.length === 3) {
            const [p1, p2, p3] = manager.clickSequence;
            try {
                const arc = new paper.Path.Arc(p1, p2, p3);
                arc.strokeColor = 'var(--geometry-default)';
                arc.strokeWidth = 2;
                arc.data.type = 'arc';
            } catch (e) { app.ai.logAI("System", "Arc failed: Invalid geometry."); }
            manager.clickSequence = [];
            if (manager.tempPath) manager.tempPath.remove();
            return null;
        } else {
            let tempPath = manager.tempPath;
            if (!tempPath) {
                tempPath = new paper.Path();
                tempPath.strokeColor = 'rgba(255,255,255,0.5)';
                tempPath.dashArray = [4, 4];
            }
            tempPath.add(point);
            return tempPath;
        }
    },

    updateShapeOnDrag: (app, type, point, startPoint, tempPath) => {
        if (!tempPath) return;
        const color = app.themeColors.geometry;

        if (type === 'line') {
            tempPath.segments[1].point = point;
        } else if (type === 'circle') {
            const r = startPoint.getDistance(point);
            tempPath.remove();
            let newPath;
            if (app.isIsometric) {
                const isoRatio = 0.57735026919; 
                newPath = new paper.Path.Ellipse({ center: startPoint, radius: [r, r * isoRatio] });
                switch(app.isoPlane) {
                    case 'top': newPath.rotate(45); break;
                    case 'left': newPath.rotate(-30); break;
                    case 'right': newPath.rotate(30); break;
                }
            } else {
                newPath = new paper.Path.Circle(startPoint, r);
            }
            newPath.strokeColor = color;
            newPath.strokeWidth = 2;
            (document.getElementById('status-msg') || {}).textContent = `Radius: ${geom.formatCoord(r, app.scaleFactor)} mm`;
            return newPath;
        } else if (type === 'rect') {
            tempPath.remove();
            const newPath = new paper.Path.Rectangle(startPoint, point);
            newPath.strokeColor = color;
            newPath.strokeWidth = 2;
            return newPath;
        } else if (type === 'rounded_rect') {
            tempPath.remove();
            const rect = new paper.Rectangle(startPoint, point);
            // Dynamic corner radius based on size, max 20
            const cornerSize = Math.min(rect.width * 0.2, rect.height * 0.2, 20);
            const newPath = new paper.Path.Rectangle(rect, new paper.Size(cornerSize, cornerSize));
            newPath.strokeColor = color;
            newPath.strokeWidth = 2;
            return newPath;
        } else if (type === 'ellipse') {
            tempPath.remove();
            const rect = new paper.Rectangle(startPoint, point);
            const newPath = new paper.Path.Ellipse(rect);
            newPath.strokeColor = color;
            newPath.strokeWidth = 2;
            return newPath;
        } else if (type === 'polygon') {
            tempPath.remove();
            const r = startPoint.getDistance(point);
            const sides = app.tools?.modelling?.lastPolygonSides || 6;
            const newPath = new paper.Path.RegularPolygon(startPoint, sides, r);
            // Rotate so it follows cursor angle
            const angle = point.subtract(startPoint).angle;
            newPath.rotate(angle, startPoint);
            newPath.strokeColor = color;
            newPath.strokeWidth = 2;
            return newPath;
        } else if (type === 'wire') {
            tempPath.remove();
            const newPath = new paper.Path();
            newPath.strokeColor = '#3b82f6';
            newPath.strokeWidth = 3;
            newPath.shadowColor = '#3b82f6';
            newPath.shadowBlur = 4;
            newPath.strokeCap = 'round';
            newPath.strokeJoin = 'round';
            
            // Generate a bezier curve (ReactFlow style)
            const dx = point.x - startPoint.x;
            const dy = point.y - startPoint.y;
            
            // If dragging horizontally mostly, use horizontal tangents
            if (Math.abs(dx) > Math.abs(dy)) {
                const tangentLength = Math.abs(dx) * 0.5;
                newPath.add(new paper.Segment(
                    startPoint,
                    null,
                    new paper.Point(tangentLength * Math.sign(dx), 0)
                ));
                newPath.add(new paper.Segment(
                    point,
                    new paper.Point(-tangentLength * Math.sign(dx), 0),
                    null
                ));
            } else {
                // Vertical tangents
                const tangentLength = Math.abs(dy) * 0.5;
                newPath.add(new paper.Segment(
                    startPoint,
                    null,
                    new paper.Point(0, tangentLength * Math.sign(dy))
                ));
                newPath.add(new paper.Segment(
                    point,
                    new paper.Point(0, -tangentLength * Math.sign(dy)),
                    null
                ));
            }
            
            newPath.data.type = 'wire';
            return newPath;
        } else if (type === 'spline') {
            tempPath.add(point);
        } else if (type === 'arc' && tempPath.segments.length > 1) {
            tempPath.removeSegment(1);
            tempPath.add(point);
        }
        return tempPath;
    }
};
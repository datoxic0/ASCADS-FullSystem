import paper from 'https://esm.sh/paper';
import * as geom from './geometry.js';
/**
 * Logic for standard geometry primitive creation.
 */
export const ShapeDrawing = {
    createPrimitive: (app, type, point) => {
        const color = app.activeColor || app.themeColors.geometry;
        let path = null;
        switch (type) {
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
            }
            catch (e) {
                app.ai.logAI("System", "Arc failed: Invalid geometry.");
            }
            manager.clickSequence = [];
            if (manager.tempPath)
                manager.tempPath.remove();
            return null;
        }
        else {
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
        if (!tempPath)
            return;
        const color = app.themeColors.geometry;
        if (type === 'line') {
            tempPath.segments[1].point = point;
        }
        else if (type === 'circle') {
            const r = startPoint.getDistance(point);
            tempPath.remove();
            let newPath;
            if (app.isIsometric) {
                const isoRatio = 0.57735026919;
                newPath = new paper.Path.Ellipse({ center: startPoint, radius: [r, r * isoRatio] });
                switch (app.isoPlane) {
                    case 'top':
                        newPath.rotate(45);
                        break;
                    case 'left':
                        newPath.rotate(-30);
                        break;
                    case 'right':
                        newPath.rotate(30);
                        break;
                }
            }
            else {
                newPath = new paper.Path.Circle(startPoint, r);
            }
            newPath.strokeColor = color;
            newPath.strokeWidth = 2;
            (document.getElementById('status-msg') || {}).textContent = `Radius: ${geom.formatCoord(r, app.scaleFactor)} mm`;
            return newPath;
        }
        else if (type === 'rect') {
            tempPath.remove();
            const newPath = new paper.Path.Rectangle(startPoint, point);
            newPath.strokeColor = color;
            newPath.strokeWidth = 2;
            return newPath;
        }
        else if (type === 'rounded_rect') {
            tempPath.remove();
            const rect = new paper.Rectangle(startPoint, point);
            // Dynamic corner radius based on size, max 20
            const cornerSize = Math.min(rect.width * 0.2, rect.height * 0.2, 20);
            const newPath = new paper.Path.Rectangle(rect, new paper.Size(cornerSize, cornerSize));
            newPath.strokeColor = color;
            newPath.strokeWidth = 2;
            return newPath;
        }
        else if (type === 'ellipse') {
            tempPath.remove();
            const rect = new paper.Rectangle(startPoint, point);
            const newPath = new paper.Path.Ellipse(rect);
            newPath.strokeColor = color;
            newPath.strokeWidth = 2;
            return newPath;
        }
        else if (type === 'polygon') {
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
        }
        else if (type === 'wire') {
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
                newPath.add(new paper.Segment(startPoint, null, new paper.Point(tangentLength * Math.sign(dx), 0)));
                newPath.add(new paper.Segment(point, new paper.Point(-tangentLength * Math.sign(dx), 0), null));
            }
            else {
                // Vertical tangents
                const tangentLength = Math.abs(dy) * 0.5;
                newPath.add(new paper.Segment(startPoint, null, new paper.Point(0, tangentLength * Math.sign(dy))));
                newPath.add(new paper.Segment(point, new paper.Point(0, -tangentLength * Math.sign(dy)), null));
            }
            newPath.data.type = 'wire';
            return newPath;
        }
        else if (type === 'spline') {
            tempPath.add(point);
        }
        else if (type === 'arc' && tempPath.segments.length > 1) {
            tempPath.removeSegment(1);
            tempPath.add(point);
        }
        return tempPath;
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9vbC1kcmF3aW5nLXNoYXBlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3Rvb2wtZHJhd2luZy1zaGFwZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxLQUFLLE1BQU0sc0JBQXNCLENBQUM7QUFDekMsT0FBTyxLQUFLLElBQUksTUFBTSxlQUFlLENBQUM7QUFFdEM7O0dBRUc7QUFDSCxNQUFNLENBQUMsTUFBTSxZQUFZLEdBQUc7SUFDeEIsZUFBZSxFQUFFLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsRUFBRTtRQUNsQyxNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsV0FBVyxJQUFJLEdBQUcsQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDO1FBQzFELElBQUksSUFBSSxHQUFHLElBQUksQ0FBQztRQUVoQixRQUFPLElBQUksRUFBRSxDQUFDO1lBQ1YsS0FBSyxNQUFNO2dCQUNQLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLGFBQWEsSUFBSSxFQUFFLENBQUM7Z0JBQ3RELE1BQU0sR0FBRyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLGNBQWMsSUFBSSxDQUFDLENBQUM7Z0JBQ3BELElBQUksR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxFQUFFLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQztnQkFDN0MsSUFBSSxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUM7Z0JBQ3RCLElBQUksQ0FBQyxXQUFXLEdBQUcsS0FBSyxDQUFDO2dCQUN6QixJQUFJLENBQUMsV0FBVyxHQUFHLENBQUMsQ0FBQztnQkFDckIsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEdBQUcsTUFBTSxDQUFDO2dCQUN4QixJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7Z0JBQ3hCLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLEdBQUcsQ0FB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
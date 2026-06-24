import paper from 'https://esm.sh/paper';
import { InstrumentHandles } from './tool-drawing-handles.js';

/**
 * Specialized factory for technical drafting instruments.
 */
export const InstrumentDrawing = {
    createRuler: (app, point, isPart = false) => {
        const height = 40; 
        const size = 300; // Standard 300mm scale ruler (Physical tool units)
        const g = new paper.Group();
        g.data.isInstrument = true;
        g.data.instrumentType = 'ruler';

        const rect = new paper.Path.Rectangle(new paper.Point(0, -height/2), new paper.Size(size, height));
        rect.data = { role: 'instrument-base' };
        rect.strokeColor = '#111';
        rect.fillColor = {
            gradient: {
                stops: [['#2a2a2a', 0], ['#444', 0.5], ['#2a2a2a', 1]],
                origin: [0, -height/2],
                destination: [0, height/2]
            }
        };

        for (let i = 0; i <= 300; i += 1.0) {
            const xPos = i;
            const isMajor = i % 10 === 0;
            const len = isMajor ? 18 : 8;
            const mark = new paper.Path.Line(new paper.Point(xPos, -height/2), new paper.Point(xPos, -height/2 + len));
            mark.strokeColor = isMajor ? '#fff' : '#888';
            g.addChild(mark);
            if (isMajor && i % 20 === 0) {
                g.addChild(new paper.PointText({
                    point: [xPos, 10], content: i.toString(), fillColor: '#fff', fontSize: 8, justification: 'center', fontFamily: 'monospace'
                }));
            }
        }

        const head = new paper.Path.Rectangle(new paper.Point(-20, -height), new paper.Size(20, height * 2));
        head.fillColor = '#111';
        
        g.addChildren([head, rect]);
        g.position = point;
        g.data.type = 'instrument-guide';
        
        if (!isPart) {
            app.layers.construction.addChild(g);
            InstrumentHandles.add(app, g);
        }
        return g;
    },

    createSetSquare: (app, point, angle, isPart = false) => {
        const size = 220; // 220mm physical tool size
        const g = new paper.Group();
        g.data.isInstrument = true;
        g.data.instrumentType = 'set-square';
        g.data.angle = angle;
        g.data.localRotation = 0;
        g.data.activeBase = 0;
        
        const tri = new paper.Path();
        tri.data = { role: 'instrument-base' };
        
        let h;
        if (angle === 30) {
            // 30-60-90: Short side = size, Long side = size * sqrt(3)
            h = size * Math.sqrt(3);
            tri.add(new paper.Point(0, 0)); 
            tri.add(new paper.Point(size, 0)); 
            tri.add(new paper.Point(0, -h));
        } else {
            // 45-45-90: Isosceles
            h = size;
            tri.add(new paper.Point(0, 0)); 
            tri.add(new paper.Point(size, 0)); 
            tri.add(new paper.Point(0, -h));
        }
        
        tri.closed = true;
        tri.strokeColor = 'rgba(0, 255, 136, 0.7)';
        tri.fillColor = 'rgba(0, 255, 136, 0.12)';
        tri.strokeWidth = 2;

        // Add Scale Ticks and Numbers to Legs
        const addScale = (pStart, pEnd, flipNormal = false) => {
            const vector = pEnd.subtract(pStart);
            const length = vector.length;
            const unit = vector.normalize();
            let normal = new paper.Point(-unit.y, unit.x);
            if (flipNormal) normal = normal.multiply(-1);
            
            const actualLen = Math.floor(length);
            for (let i = 0; i <= actualLen; i += 1.0) {
                const isMajor = i % 10 === 0;
                const isMid = i % 5 === 0;
                const tickLen = isMajor ? 8 : (isMid ? 6 : 3.5);
                const pos = pStart.add(unit.multiply(i));
                const mark = new paper.Path.Line(pos, pos.add(normal.multiply(tickLen)));
                mark.strokeColor = isMajor ? '#fff' : (isMid ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.4)');
                mark.strokeWidth = isMajor ? 1.2 : 0.6;
                g.addChild(mark);

                if (isMajor && i > 0 && i % 10 === 0) {
                    const txt = new paper.PointText({
                        point: pos.add(normal.multiply(tickLen + 4)),
                        content: i.toString(),
                        fillColor: '#fff',
                        fontSize: 7.5,
                        justification: 'center',
                        fontFamily: 'monospace'
                    });
                    txt.rotate(vector.angle + 90, pos.add(normal.multiply(tickLen + 4)));
                    g.addChild(txt);
                }
            }
        };

        // All sides measurement: 
        // 1. Bottom Leg (Horizontal)
        addScale(new paper.Point(0, 0), new paper.Point(size, 0), true);
        // 2. Vertical Leg
        addScale(new paper.Point(0, -h), new paper.Point(0, 0), false);
        // 3. Hypotenuse - Ensure precision on the angled side
        addScale(new paper.Point(size, 0), new paper.Point(0, -h), false);

        const innerTri = new paper.Path();
        innerTri.add(new paper.Point(size*0.15, -h*0.15));
        innerTri.add(new paper.Point(size*0.6, -h*0.15));
        innerTri.add(new paper.Point(size*0.15, -h*0.6));
        innerTri.closed = true;
        innerTri.strokeColor = 'rgba(0, 255, 136, 0.3)';

        const label = new paper.PointText({
            point: [25, -25], content: `PRECISION ${angle}° SET SQUARE`,
            fillColor: 'rgba(0, 255, 136, 0.8)', fontSize: 9, fontWeight: 'bold', fontFamily: 'Consolas'
        });

        g.addChildren([tri, innerTri, label]);
        g.position = point;
        g.data.type = 'instrument-guide';
        if (!isPart) {
            app.layers.construction.addChild(g);
            InstrumentHandles.add(app, g);
        }
        return g;
    },

    createProtractor: (app, point) => {
        const size = 160; // 160mm Diameter physical tool
        const g = new paper.Group();
        g.data.isInstrument = true;
        g.data.instrumentType = 'protractor';
        
        const circle = new paper.Path.Circle(new paper.Point(0,0), size);
        circle.data = { role: 'instrument-base' };
        circle.strokeColor = '#00ffee';
        circle.fillColor = 'rgba(0, 255, 238, 0.03)';
        circle.strokeWidth = 2.5;

        for (let i = 0; i < 360; i += 1.0) {
            const isMajor = i % 10 === 0;
            const isMid = i % 5 === 0;
            let len = isMajor ? 22 : (isMid ? 16 : 10);
            const p1 = new paper.Point({ angle: i, length: size });
            const p2 = new paper.Point({ angle: i, length: size - len });
            const tick = new paper.Path.Line(p1, p2);
            tick.strokeColor = isMajor ? '#ffffff' : (isMid ? 'rgba(0, 255, 238, 0.8)' : 'rgba(0, 255, 238, 0.3)');
            tick.strokeWidth = isMajor ? 1.5 : 0.6;
            g.addChild(tick);

            if (isMajor && i % 20 === 0) {
                const text = new paper.PointText({
                    point: new paper.Point({ angle: i, length: size - 36 }), 
                    content: `${i}°`, fillColor: '#ffffff', fontSize: 9, fontWeight: 'bold', justification: 'center',
                    fontFamily: 'Consolas', rotation: i + 90
                });
                g.addChild(text);
            }
        }

        const hLine = new paper.Path.Line([-size*1.1, 0], [size*1.1, 0]);
        const vLine = new paper.Path.Line([0, -size*1.1], [0, size*1.1]);
        [hLine, vLine].forEach(l => { l.strokeColor = 'rgba(0, 255, 204, 0.4)'; l.strokeWidth = 0.5; l.dashArray = [10, 5]; });

        g.addChildren([circle, hLine, vLine]);
        g.position = point;
        g.data.type = 'protractor-guide';
        app.layers.construction.addChild(g);
        InstrumentHandles.add(app, g);
        return g;
    },

    createDrafter: (app, point, isPart = false) => {
        const size = 250; // 250mm arm physical size
        const g = new paper.Group();
        g.data.isInstrument = true;
        g.data.instrumentType = 'drafter';
        g.applyMatrix = false;

        const head = new paper.Group();
        const outer = new paper.Path.Circle([0,0], 40);
        outer.fillColor = '#1a1a1a'; outer.strokeColor = '#444'; outer.strokeWidth = 2;
        const inner = new paper.Path.Circle([0,0], 28);
        inner.strokeColor = '#00f2ff'; inner.strokeWidth = 3;
        const mark = new paper.Path.Line([0, -28], [0, -40]);
        mark.strokeColor = '#00f2ff'; mark.strokeWidth = 2;
        head.addChildren([outer, inner, mark]);
        head.data = { role: 'instrument-base' };

        // Scale setup - Offset so they form an L attached to the head
        const scaleOffset = 38;

        // Horizontal Scale
        const hScale = new paper.Group();
        const hRect = new paper.Path.Rectangle([scaleOffset, -12], [size, 24]);
        hRect.fillColor = '#222'; hRect.strokeColor = '#555';
        hScale.addChild(hRect);
        for(let i=0; i<=size; i+=10) {
            const x = scaleOffset + i;
            const isMajor = i % 50 === 0;
            const tick = new paper.Path.Line([x, -12], [x, isMajor ? 0 : -6]);
            tick.strokeColor = isMajor ? '#fff' : '#888';
            hScale.addChild(tick);
        }

        // Vertical Scale
        const vScale = new paper.Group();
        const vRect = new paper.Path.Rectangle([-12, scaleOffset], [24, size]);
        vRect.fillColor = '#222'; vRect.strokeColor = '#555';
        vScale.addChild(vRect);
        for(let i=0; i<=size; i+=10) {
            const y = scaleOffset + i;
            const isMajor = i % 50 === 0;
            const tick = new paper.Path.Line([-12, y], [isMajor ? 0 : -6, y]);
            tick.strokeColor = isMajor ? '#fff' : '#888';
            vScale.addChild(tick);
        }

        g.addChildren([head, hScale, vScale]);
        g.position = point;
        g.data.type = 'instrument-guide';
        
        if (!isPart) {
            app.layers.construction.addChild(g);
            InstrumentHandles.add(app, g);
        }
        return g;
    },

    createPairedSet: (app, point, type) => {
        const angle = type.endsWith('30') ? 30 : 45;
        const g = new paper.Group();
        g.applyMatrix = false;
        g.data.isInstrument = true;
        g.data.instrumentType = 'paired-set';
        g.data.rotation = 0;
        
        // 1. Create Ruler (T-Square Base)
        const ruler = InstrumentDrawing.createRuler(app, new paper.Point(0, 0), true);
        ruler.data.isPart = true;
        ruler.data.role = 'instrument-base';
        
        // 2. Create Set Square (Slider)
        const tri = InstrumentDrawing.createSetSquare(app, new paper.Point(0, 0), angle, true);
        tri.data.isPart = true;
        tri.data.isSlider = true;
        tri.data.instrumentType = 'set-square-slider';
        
        // Fixed Alignment: Ruler height 40, center 0, top edge -20.
        // Set square path goes from 0 up to -h. Its base (y=0) should touch -20.
        // Triangle center is at -h/2. To move y=0 to y=-20, new center is -20 - h/2.
        const h = angle === 30 ? (220 * Math.sqrt(3)) : 220;
        // Corrected y-alignment: The ruler top is at -20. The triangle base (y=0) should sit exactly at -20.
        // Triangle's pivot is at its own (0,0). Its bounds.bottom is 0. 
        // So we place it so its bottom edge is at -20 relative to the ruler's center.
        tri.position = new paper.Point(150, -20 - (h / 2));

        g.addChildren([ruler, tri]);
        g.position = point;
        
        app.layers.construction.addChild(g);
        InstrumentHandles.add(app, g);
        
        app.ai.logAI("System", `T-Square paired with ${angle}° Set-Square deployed. The triangle is locked to the horizontal sliding plane.`);
        return g;
    },

    createPairedDrafterSet: (app, point) => {
        const g = new paper.Group();
        g.applyMatrix = false;
        g.data.isInstrument = true;
        g.data.instrumentType = 'paired-drafter';
        g.data.rotation = 0;

        // 1. Create Drafter as Base
        const drafter = InstrumentDrawing.createDrafter(app, new paper.Point(0, 0), true);
        drafter.data.role = 'instrument-base';

        // 2. Create Set Square Slider (45) - Standard for drafter heads
        const tri = InstrumentDrawing.createSetSquare(app, new paper.Point(0, 0), 45, true);
        tri.data.isPart = true;
        tri.data.isSlider = true;
        tri.data.instrumentType = 'set-square-slider';
        
        // Drafter head is complex. The ruler arm starts at x=38.
        // Horizontal arm top edge is -12.
        const h = 220;
        // Drafter arm y-offset is -12 to center the arm. 
        // Top edge of the arm is at -12. Placing triangle bottom edge at -12.
        tri.position = new paper.Point(140, -12 - (h / 2));

        g.addChildren([drafter, tri]);
        g.position = point;
        
        app.layers.construction.addChild(g);
        InstrumentHandles.add(app, g);
        
        app.ai.logAI("System", "Drafter system deployed. The precision set-square is synchronized to the horizontal drafting arm.");
        return g;
    }
};
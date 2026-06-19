import paper from 'https://esm.sh/paper';

/**
 * Advanced AI-Powered Raster to Vector Digitization
 * Uses Websim's vision capabilities to transform engineering sketches into parametric geometry.
 */

async function urlToDataUrl(url) {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

export async function vectorizeImage(file, onProgress) {
    try {
        onProgress(10, "Preprocessing engineering scan...");
        const url = URL.createObjectURL(file);
        const dataUrl = await urlToDataUrl(url).catch(e => { throw new Error("Image loading failed"); });
        
        onProgress(30, "Digitizing Vision-to-CAD Mapping...");
        
        const prompt = `Task: Perform high-precision industrial CAD digitization.
        1. Output Coordinate Space: 0.0 to 1000.0 (float precision).
        2. Geometry Recognition: Detect line, circle (center/radius), rect (corners), component (type/pos), dimension (value/points).
        3. Logic: Precisely snap endpoints to intersections. Differentiate between construction lines and object lines.
        4. Recognized Component Library (Identify by visual footprint): 
           - arduino_uno (rectangular with headers/USB)
           - esp32 (small dual-inline module)
           - lcd_1602 (large rectangular display with 16 pins)
           - keypad_4x4 (square matrix of 16 buttons)
           - nema17 (square motor profile with 4 holes)
           - servo_sg90 (small actuator with mounting ears)
           - breadboard_half (long grid of holes)
           - battery_18650 (cylindrical cell)
           - led_red, resistor, gate_and, gate_or, gate_not, gate_xor (standard symbols).
        
        Return STRICT JSON:
        {
          "entities": [
            {"type": "line", "p1": {"x": float, "y": float}, "p2": {"x": float, "y": float}},
            {"type": "circle", "center": {"x": float, "y": float}, "radius": float},
            {"type": "rect", "p1": {"x": float, "y": float}, "p2": {"x": float, "y": float}},
            {"type": "component", "partType": "string", "pos": {"x": float, "y": float}},
            {"type": "dimension", "p1": {"x": float, "y": float}, "p2": {"x": float, "y": float}, "text": "string"}
          ]
        }`;

        const completion = await websim.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "EngiGraph Vectorization Engine. Focus on industrial precision. Output only JSON."
                },
                {
                    role: "user",
                    content: [
                        { type: "text", text: prompt },
                        { type: "image_url", image_url: { url: dataUrl } }
                    ]
                }
            ],
            json: true
        });

        onProgress(85, "Optimizing geometry...");
        
        const result = JSON.parse(completion.content);
        if (!result || !result.entities) throw new Error("Invalid AI output");

        const viewCenter = paper.view.center;
        const scale = Math.min(paper.view.bounds.width, paper.view.bounds.height) / 1000;
        
        const transformedEntities = result.entities.map(e => {
            const transform = (p) => ({
                x: viewCenter.x + (p.x - 500) * scale,
                y: viewCenter.y + (p.y - 500) * scale
            });

            if (e.p1) e.p1 = transform(e.p1);
            if (e.p2) e.p2 = transform(e.p2);
            if (e.center) e.center = transform(e.center);
            if (e.pos) e.pos = transform(e.pos);
            if (e.radius) e.radius *= scale;
            return e;
        });

        onProgress(100, "Success.");
        return transformedEntities;
    } catch (err) {
        console.error("Vectorization failure:", err);
        throw err;
    }
}
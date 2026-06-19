# ASCADS Engigraph Pro: 3D Code CAD Manual

Welcome to the **Engigraph 3D Code CAD** environment. Engigraph Pro allows you to build complex, 3D-printable robotics and mechanical parts using purely parametric JavaScript code. It utilizes a Constructive Solid Geometry (CSG) engine powered by `three-csg-ts`.

---

## 1. The CSG API

The engine exposes several global functions you can use in your scripts to generate geometry.

### Primitive Shapes
- **`box(w, d, h)`**: Creates a rectangular prism. (width, depth, height)
- **`cylinder(r, h)`**: Creates a cylinder. Oriented along the Z-axis by default.
- **`sphere(r)`**: Creates a sphere with radius `r`.

### Boolean Operations
CSG allows you to combine solid shapes to create complex models.
- **`union(a, b)`**: Fuses two shapes together into a single solid.
- **`subtract(a, b)`**: Cuts shape `b` out of shape `a`. (Essential for making screw holes).
- **`intersect(a, b)`**: Returns only the overlapping volume between `a` and `b`.

### Transformations
- **`translate(obj, x, y, z)`**: Moves an object in 3D space.
- **`rotate(obj, rx, ry, rz)`**: Rotates an object (angles are in radians).
- **`scale(obj, sx, sy, sz)`**: Scales an object uniformly or non-uniformly.
- **`mirror(obj, x, y, z)`**: Mirrors an object across the specified axes.

---

## 2. Tutorials & Code Samples

Below are reference tutorials to help you understand how to design robotics parts using Engigraph 3D.

### Tutorial 1: Basic Bracket with Holes
A standard mounting bracket. We create a large base box, and then `subtract` four corner screw holes and one large center bore.

```javascript
// Basic Bracket
const base = box(100, 100, 10);

// Create corner holes
const h1 = translate(cylinder(5, 30), 30, 30, 0);
const h2 = translate(cylinder(5, 30), -30, 30, 0);
const h3 = translate(cylinder(5, 30), 30, -30, 0);
const h4 = translate(cylinder(5, 30), -30, -30, 0);

// Create large center bore
const centerHole = cylinder(20, 30);

// Group all holes together into one solid object using union
const holes = union(union(h1, h2), union(h3, h4));
const allHoles = union(holes, centerHole);

// Subtract the grouped holes from the base and return the final mesh
return subtract(base, allHoles);
```

### Tutorial 2: NEMA 17 Stepper Motor Faceplate
NEMA 17 stepper motors are the backbone of most desktop 3D printers and CNC machines. This faceplate matches their standard mounting pattern (31mm hole spacing for M3 screws).

```javascript
// NEMA 17 Motor Mount Faceplate
const plate = box(42.3, 42.3, 5);
const centerBore = cylinder(11, 20);

// 31mm hole spacing for M3 screws (15.5mm from center)
const m3_1 = translate(cylinder(1.5, 20), 15.5, 15.5, 0);
const m3_2 = translate(cylinder(1.5, 20), -15.5, 15.5, 0);
const m3_3 = translate(cylinder(1.5, 20), 15.5, -15.5, 0);
const m3_4 = translate(cylinder(1.5, 20), -15.5, -15.5, 0);

const m3_holes = union(union(m3_1, m3_2), union(m3_3, m3_4));
const all_holes = union(centerBore, m3_holes);

return subtract(plate, all_holes);
```

### Tutorial 3: Parametric Wheel Hub
A standard wheel hub used in differentially-driven robots. It features a solid inner core for mounting to a 5mm D-shaft, an outer rim, and weight-reduction cutouts.

```javascript
// Parametric Robot Wheel Hub
const outerCyl = cylinder(30, 15);
const innerCyl = translate(cylinder(20, 25), 0, 0, 5);
const hubBase = union(outerCyl, innerCyl);

// 5mm Motor Shaft Hole
const shaft = cylinder(2.5, 40);

// Weight reduction cutouts
const cut1 = translate(box(10, 15, 30), 0, 20, 0);
const cut2 = translate(box(10, 15, 30), 0, -20, 0);
const cut3 = translate(box(15, 10, 30), 20, 0, 0);
const cut4 = translate(box(15, 10, 30), -20, 0, 0);

const cutouts = union(union(cut1, cut2), union(cut3, cut4));
const subtractions = union(shaft, cutouts);

return subtract(hubBase, subtractions);
```

---

## 3. Best Practices
- **Variables**: Always assign your primitives to variables. This keeps your code clean.
- **Deep Nesting**: Avoid nesting `union` or `subtract` too deeply in one line. `union(union(a,b), union(c,d))` is cleaner than `union(a, union(b, union(c, d)))`.
- **Return Statement**: The script evaluator *must* hit a `return` statement at the end that returns a single CSG object. If you do not return an object, the WebGL viewport will be empty.


<footer class="footer">
  <p>
    Developed by Siyabonga B Phakathi of The Voice & Eye of Bhambatha Inc.
    <br>
    <a href="https://www.bhambathablog.wordpress.com" target="_blank" rel="noopener noreferrer">Blog</a> |
    <a href="https://www.facebook.com/C.Datoxic.P" target="_blank" rel="noopener noreferrer">Facebook</a> |
    <a href="https://www.websim.com/@whisperinggalaxyd" target="_blank" rel="noopener noreferrer">WebSim</a> |
    <a href="https://www.github.com/datoxic0" target="_blank" rel="noopener noreferrer">GitHub</a> |
    <a href="https://discord.com/channels/datoxic0" target="_blank" rel="noopener noreferrer">Discord</a> |
    <a href="https://x.com/Siya_B_Phakathi" target="_blank" rel="noopener noreferrer">X</a>
  </p>
</footer>
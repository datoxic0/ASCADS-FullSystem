const paper = require('paper');
paper.setup(new paper.Size(1000, 1000));
const group = new paper.Group({applyMatrix: false});
const pinVisual = new paper.Path.Circle({center: [-10, 0], radius: 2});
group.addChild(pinVisual);
group.position = new paper.Point(500, 500);

// Global position of pin:
const globalPinPos = group.localToGlobal(new paper.Point(-10, 0));

// Add handle using the three methods:
const handle1 = new paper.Path.Circle({radius: 4});
group.addChild(handle1);
handle1.position = globalPinPos;

const handle2 = new paper.Path.Circle({radius: 4});
group.addChild(handle2);
handle2.position = group.globalToLocal(globalPinPos);

const handle3 = new paper.Path.Circle({radius: 4});
group.addChild(handle3);
handle3.position = new paper.Point(-10, 0);

console.log("Global Pin Pos:", globalPinPos);
console.log("Method 1 (handle.position = globalPinPos):", group.localToGlobal(handle1.position));
console.log("Method 2 (handle.position = globalToLocal):", group.localToGlobal(handle2.position));
console.log("Method 3 (handle.position = local):", group.localToGlobal(handle3.position));
console.log("Wait, what is handle3.position internally?", handle3.position);

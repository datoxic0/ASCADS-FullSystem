import test from 'node:test';
import assert from 'node:assert/strict';
import {
  andBlock, andEdgeBlock, constBlock, flagBlock, nandBlock, nandEdgeBlock,
  norBlock, notBlock, orBlock, xorBlock,
} from '../bitLogic.ts';

test('andBlock: all-high -> 1, any-low -> 0', () => {
  const b = andBlock();
  assert.equal(b.tick([1, 1, 1, 1]), 1);
  assert.equal(b.tick([1, 1, 0, 1]), 0);
  assert.equal(b.tick([1, 1, 1]), 1); // tail defaults to 1 (documented unused=1)
});

test('orBlock: any-high -> 1, all-low -> 0; tail defaults to 0', () => {
  const b = orBlock();
  assert.equal(b.tick([0, 0, 0]), 0); // tail filled with 0
  assert.equal(b.tick([0, 0, 1]), 1);
});

test('nand / nor / xor / not', () => {
  assert.equal(nandBlock().tick([1, 1]), 0);
  assert.equal(nandBlock().tick([1, 0]), 1);
  assert.equal(norBlock().tick([0, 0]), 1);
  assert.equal(norBlock().tick([0, 1]), 0);
  assert.equal(xorBlock().tick([0, 1]), 1);
  assert.equal(xorBlock().tick([1, 1]), 0);
  assert.equal(notBlock().tick([1]), 0);
  assert.equal(notBlock().tick([0]), 1);
});

test('andEdgeBlock: one-cycle pulse on aggregate rising edge, must rearm', () => {
  const b = andEdgeBlock();
  assert.equal(b.tick([1, 1, 1, 1]), 1); // [ASCAD-CHOICE] prev agg initialises to 0
  assert.equal(b.tick([1, 1, 1, 1]), 0); // one cycle only
  assert.equal(b.tick([1, 1, 0, 1]), 0);
  assert.equal(b.tick([1, 1, 1, 1]), 1); // re-trigger after dropping to 0
});

test('nandEdgeBlock: pulses when NAND aggregate rises (leaving all-high)', () => {
  const b = nandEdgeBlock();
  assert.equal(b.tick([1, 1, 1, 1]), 0); // NAND agg = 0, not rising
  assert.equal(b.tick([1, 1, 1, 1]), 0);
  assert.equal(b.tick([1, 1, 0, 1]), 1); // NAND 0 -> 1 transition, one cycle
  assert.equal(b.tick([1, 1, 0, 1]), 0);
});

test('nandEdgeBlock startup: all-low inputs make NAND agg true on first cycle', () => {
  const b = nandEdgeBlock();
  assert.equal(b.tick([0, 0, 0, 0]), 1); // [ASCAD-CHOICE] prev agg initialises to 0
});

test('flagBlock: output carries previous program cycle signal', () => {
  const b = flagBlock();
  assert.equal(b.tick([1]), 0);
  assert.equal(b.tick([1]), 1);
  assert.equal(b.tick([0]), 1);
  assert.equal(b.tick([0]), 0);
});

test('constBlock: permanent Hi / Lo', () => {
  assert.equal(constBlock(1).tick([]), 1);
  assert.equal(constBlock(0).tick([]), 0);
});

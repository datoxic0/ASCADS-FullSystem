/**
 * Bit-logic SFB semantics (fbd-01-bit-logic.md topics 12019148555…12019454347).
 *
 * Documented rules:
 *  AND / NAND / XOR : unused inputs default to 1 / 1 / 0 (per page);
 *  OR  / NOR        : unused inputs default to 0 / 0.
 *  AND-edge / NAND-edge: one-cycle pulse on the rising edge of the aggregate condition
 *    ("Output = 1 only when all inputs = 1 AND at least one input was 0 during the last
 *     cycle"; "output set for one cycle; must drop to 0 before re-trigger").
 *  Flags and digital outputs carry the signal of the *previous* program cycle.
 *  [ASCAD-CHOICE]: the previous aggregate initialises to 0, so a true aggregate on the
 *  very first cycle pulses; the help does not specify power-on edge treatment.
 *
 * Note: the engine cannot observe which terminals a program leaves unwired, so the
 * documented unused-input defaults are applied to *missing tail inputs* up to the
 * documented nominal width (4 inputs on current devices; 3 on 0BA0–0BA3).
 */

import type { Digital } from './types.ts';

export interface BoolBlock {
  /** Evaluate the block for one program cycle. */
  tick(inputs: Digital[]): Digital;
  /** Current output without advancing state. */
  peek(): Digital;
}

function instant(fn: (i: Digital[]) => Digital, unused: Digital, width = 4): BoolBlock {
  let out: Digital = 0;
  return {
    tick(inputs: Digital[]): Digital {
      out = fn(fill(inputs, unused, width));
      return out;
    },
    peek(): Digital {
      return out;
    },
  };
}

function edge(fn: (i: Digital[]) => Digital, unused: Digital, width = 4): BoolBlock {
  let prevAgg: Digital = 0;
  let armed = true;
  let out: Digital = 0;
  return {
    tick(inputs: Digital[]): Digital {
      const agg = fn(fill(inputs, unused, width));
      if (agg === 1 && prevAgg === 0 && armed) {
        out = 1;
        armed = false;
      } else {
        out = 0;
        if (agg === 0) armed = true;
      }
      prevAgg = agg;
      return out;
    },
    peek(): Digital {
      return out;
    },
  };
}

function fill(inputs: Digital[], unused: Digital, width: number): Digital[] {
  if (inputs.length >= width) return inputs;
  const out = inputs.slice();
  while (out.length < width) out.push(unused);
  return out;
}

/** AND — topic 12019148555. */
export const andBlock = (): BoolBlock => instant((i) => (i.every((v) => v === 1) ? 1 : 0), 1);
/** OR — topic 12019415563. */
export const orBlock = (): BoolBlock => instant((i) => (i.some((v) => v === 1) ? 1 : 0), 0);
/** NAND — topic 12019389707. */
export const nandBlock = (): BoolBlock => instant((i) => (i.every((v) => v === 1) ? 0 : 1), 1);
/** NOR — topic 12019428491. */
export const norBlock = (): BoolBlock => instant((i) => (i.every((v) => v === 0) ? 1 : 0), 0);
/** XOR (2-input) — topic 12019441419. */
export const xorBlock = (): BoolBlock =>
  instant((i) => ((i[0] ?? 0) !== (i[1] ?? 0) ? 1 : 0), 0, 2);
/** NOT (1-input) — topic 12019454347. */
export const notBlock = (): BoolBlock =>
  instant((i) => ((i[0] ?? 1) === 1 ? 0 : 1), 1, 1);

/** AND with edge evaluation — topic 12019346955. */
export const andEdgeBlock = (): BoolBlock =>
  edge((i) => (i.every((v) => v === 1) ? 1 : 0), 1);
/** NAND with edge evaluation — topic 12019402635. */
export const nandEdgeBlock = (): BoolBlock =>
  edge((i) => (i.every((v) => v === 1) ? 0 : 1), 1);

/** Permanent logical levels — topic 12020402187 (Hi = 1, Lo = 0). */
export const constBlock = (level: Digital): BoolBlock => ({ tick: () => level, peek: () => level });

/**
 * Digital flag / digital output block: outputs the input signal delayed by one program
 * cycle ("the output always carries the signal of the previous program cycle", topics
 * 12020446475 / 12020383755).
 */
export function flagBlock(): BoolBlock {
  let previous: Digital = 0;
  let current: Digital = 0;
  return {
    tick(inputs: Digital[]): Digital {
      const value = inputs[0] ?? 0;
      previous = current;
      current = value;
      return previous;
    },
    peek(): Digital {
      return previous;
    },
  };
}

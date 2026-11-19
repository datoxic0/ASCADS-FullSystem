/**
 * fbdBlocks core types.
 *
 * Clean-room module. Behavior specified from public documentation — online-help
 * topic ids cited in the sibling `logo-re` workspace specs (`specs/fbd-*.md`).
 * No target-product source, firmware, binaries, assets, trade dress, or code is
 * included. Not affiliated with or endorsed by any target vendor.
 *
 * Engine model: cycle-based evaluation. The caller supplies a monotonic clock
 * (`nowMs`) per evaluation; blocks keep internal state between evaluations.
 * Analog values use the documented internal scaling unless noted:
 *   AI terminals: 0–10 V  -> 0..1000
 *   Internal/AQ range:   -32768..+32767
 *   Physical analog outputs process 0..1000 only (documented).
 * RTC-dependent blocks receive local time explicitly from the caller; the engine
 * never reads the wall clock by itself.
 */

export type Digital = 0 | 1;

/** Milliseconds, monotonic. */
export type Ms = number;

export interface Cycle {
  nowMs: Ms;
}

/** Documented analog internal range (amplifier, math, mux, converters...). */
export const ANALOG_INTERNAL_MIN = -32768;
export const ANALOG_INTERNAL_MAX = 32767;

/** Documented analog input scaling: 0–10 V -> 0..1000. */
export const ANALOG_AI_MIN = 0;
export const ANALOG_AI_MAX = 1000;

export function clampInternal(v: number): number {
  if (Number.isNaN(v)) return 0;
  if (v > ANALOG_INTERNAL_MAX) return ANALOG_INTERNAL_MAX;
  if (v < ANALOG_INTERNAL_MIN) return ANALOG_INTERNAL_MIN;
  return Math.trunc(v);
}

/**
 * Two-case threshold — COUNTER flavor, documented in fbd-03-counters.md:
 *   On >= Off: Q = 1 if Cnt >= On ; Q = 0 if Cnt < Off ; (between Off and On: hold previous)
 *   On <  Off: Q = 1 if On <= Cnt < Off ; otherwise 0.
 * [ASCAD-INTERPRETATION: the help does not document the hysteresis-band region; hold-previous
 *  is the standard reading of the two published rows.]
 */
export function counterOnOff(value: number, on: number, off: number, prev: Digital): Digital {
  if (on >= off) {
    if (value >= on) return 1;
    if (value < off) return 0;
    return prev;
  }
  return value >= on && value < off ? 1 : 0;
}

/**
 * Two-case threshold — FREQUENCY (threshold trigger) flavor, documented in fbd-03-counters.md:
 *   On >= Off: Q = 1 if fa > On ; Q = 0 if fa <= Off ; (band between: hold previous — same
 *   [ASCAD-INTERPRETATION] note as above)
 *   On <  Off: Q = 1 if On <= fa < Off ; otherwise 0.
 * Note the documented operator asymmetry vs the counter: strict `>` / `<=` here.
 */
export function frequencyOnOff(value: number, on: number, off: number, prev: Digital): Digital {
  if (on >= off) {
    if (value > on) return 1;
    if (value <= off) return 0;
    return prev;
  }
  return value >= on && value < off ? 1 : 0;
}

/**
 * Counter & trigger SFB semantics (fbd-03-counters.md, topics 12228750475…12228787339).
 *
 * Documented calculation rules (with the counter's `>=` comparisons):
 *   Counter / hours counter family — On >= Off: Q = 1 if value >= On ; Q = 0 if value < Off.
 *   Threshold trigger (frequency)  — On >= Off: Q = 1 if fa > On ; Q = 0 if fa <= Off.
 *   Either family — On < Off: Q = 1 if On <= value < Off ; otherwise 0.
 * The band region in the On >= Off case is undocumented; previous state is held
 * ([ASCAD-INTERPRETATION], see types.ts).
 *
 * Device-series gates (documented, not enforced here): `Start Value` on the up/down counter is
 * 0BA6+ only; fast inputs I3–I6 (5 kHz) vs other inputs (≈4 Hz) and the cycle-poll caveat
 * (limits polled once per cycle) are device/runtime concerns of the host simulator, not of
 * this pure block model.
 *
 * Retentivity: per-instance, device-persistent for the hours counter and optional for the
 * digital counter — memory only here; persistence is an ASCAD-runtime concern (README).
 */

import type { Digital, Ms } from './types.ts';
import { counterOnOff, frequencyOnOff } from './types.ts';

export interface CounterBlock<I> {
  tick(inputs: I, nowMs: Ms): { q: Digital; value: number };
  state(): Readonly<Record<string, number | string | Digital>>;
}

const MAX_COUNT = 999999; // documented params range 0–999999 for counter inputs

/**
 * Up/Down counter — topic 12228750475. Counts 0→1 transitions only; 1→0 ignored.
 * Dir = 0 → up, Dir = 1 → down (Dir is a parameter here, not an input).
 * R resets output and internal value to `startValue` (documented; Start Value = 0BA6+).
 * [ASCAD-CHOICE]: internal value saturates at 0 (down) and 999999 (up) — overflow behavior
 * is not documented.
 */
export function upDownCounter(options: {
  on: number;
  off: number;
  startValue?: number;
  dir?: 0 | 1;
}): CounterBlock<{ trg: Digital; r?: Digital }> {
  const { on, off, startValue = 0, dir = 0 } = options;
  let value = Math.min(MAX_COUNT, Math.max(0, Math.trunc(startValue)));
  let q: Digital = 0;
  let prevTrg: Digital = 0;
  return {
    tick({ trg, r = 0 }) {
      if (r === 1) {
        value = Math.min(MAX_COUNT, Math.max(0, Math.trunc(startValue)));
        q = counterOnOff(value, on, off, 0);
        prevTrg = trg;
        return { q, value };
      }
      const rising = trg === 1 && prevTrg === 0;
      if (rising) {
        value = dir === 0
          ? Math.min(MAX_COUNT, value + 1)
          : Math.max(0, value - 1);
      }
      q = counterOnOff(value, on, off, q);
      prevTrg = trg;
      return { q, value };
    },
    state: () => ({ q, value, dir }),
  };
}

/**
 * Hours counter — topic 12228768907. Monitors operating time at `En`.
 * OT accumulates only while En = 1; OT saturates at 99999 h (documented "OT limit 99999 h (stops)").
 * MN (time-to-go) counts down from MI; Q = 1 when MN reaches 0.
 * R (positive edge): Q → 0, MN → MI; OT unchanged.
 * Ral (positive edge): OT → 0, Q → 0, MN → MI.
 * Q-reset mode: 'r' resets Q on R/Ral only; 'r+en' also resets Q when En = 0.
 * MI may be actual-value-source (host concern). Retentivity fixed on (device concern).
 * [ASCAD-INTERPRETATION]: MN is implemented as an independent countdown; the documented
 * display formula MN = MI − (OT mod MI) is a sawtooth that cannot itself produce exact 0.
 * ASCAD latches Q on the first lapse and does NOT auto re-arm MN per maintenance interval —
 * the help does not document auto re-arm, so none is invented.
 */
export function hoursCounter(options: {
  /** Maintenance interval, milliseconds. Documented param range: 0000–9999 h + 0–59 min. */
  miMs: Ms;
  /** Offset start value OT, milliseconds (documented: "OT 00000–99999 h … offset start possible"). */
  otStartMs?: Ms;
  /** Q-reset mode, documented: 'R' resets on R or Ral; 'R+En' additionally on En = 0. */
  qResetMode?: 'r' | 'r+en';
}): CounterBlock<{ en: Digital; r?: Digital; ral?: Digital }> {
  const { miMs, otStartMs = 0, qResetMode = 'r' } = options;
  const MAX_OT_MS = 99999 * 3600_000;
  let ot = Math.min(MAX_OT_MS, Math.max(0, otStartMs));
  let mn = miMs;         // time-to-go
  let q: Digital = 0;
  let prevR: Digital = 0;
  let prevRal: Digital = 0;
  let prevEn: Digital = 0;
  let last: Ms | null = null;
  return {
    tick({ en, r = 0, ral = 0 }, nowMs) {
      const enRising = en === 1 && prevEn === 0;
      const effDt = last === null || enRising ? 0 : Math.max(0, nowMs - last); // low tail not attributed
      last = nowMs;
      const rRising = r === 1 && prevR === 0;
      const ralRising = ral === 1 && prevRal === 0;
      const enFalling = en === 0 && prevEn === 1;

      if (ralRising) {
        ot = Math.min(MAX_OT_MS, Math.max(0, otStartMs));
        mn = miMs;
        q = 0;
      }
      if (rRising) { q = 0; mn = miMs; }

      if (en === 1) {
        const add = Math.min(effDt, MAX_OT_MS - ot);
        ot += add;
        if (mn > 0) mn = Math.max(0, mn - add);
        if (mn === 0) q = 1;
      } else if (qResetMode === 'r+en' && enFalling) {
        q = 0;
      }

      prevEn = en;
      prevR = r;
      prevRal = ral;
      return { q, value: ot };
    },
    state: () => ({ q, value: ot, mnMs: mn }),
  };
}

/**
 * Threshold trigger — topic 12228787339. Measures pulse frequency at `Fre` over gate time `G_T`.
 * Frequency is recomputed once per gate window as pulsesCounted / gateTimeSeconds; Q is then
 * set/reset per the documented frequency two-case (`fa > On` / `fa <= Off`).
 * [ASCAD-INTERPRETATION]: the help does not document whether the gate is sliding or
 * back-to-back; ASCAD uses back-to-back (fixed) gate windows. Fast-input limits (I3–I6: 5 kHz)
 * are device/runtime concerns, not enforced here.
 */
export function thresholdTrigger(options: {
  on: number;   // documented range 0–9999
  off: number;  // documented range 0–9999
  gateTimeMs: Ms; // documented: 00:00 s–99:99 s
}): CounterBlock<{ fre: Digital }> {
  const { on, off, gateTimeMs } = options;
  if (!(gateTimeMs > 0)) throw new RangeError('thresholdTrigger: gateTimeMs must be > 0');
  let q: Digital = 0;
  let count = 0;
  let prevFre: Digital = 0;
  let gateStart: Ms | null = null;
  let lastFreqHz = 0;
  return {
    tick({ fre }, nowMs) {
      if (gateStart === null) gateStart = nowMs;
      if (fre === 1 && prevFre === 0) count += 1;
      prevFre = fre;
      const gateElapsed = nowMs - gateStart;
      if (gateElapsed >= gateTimeMs) {
        lastFreqHz = count / (gateElapsed / 1000);
        count = 0;
        gateStart = nowMs;
        q = frequencyOnOff(lastFreqHz, on, off, q);
      }
      return { q, value: lastFreqHz };
    },
    state: () => ({ q, value: lastFreqHz, count }),
  };
}

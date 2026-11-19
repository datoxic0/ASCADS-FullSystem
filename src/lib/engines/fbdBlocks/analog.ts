/**
 * Analog SFB semantics (fbd-04-analog.md, topics 18405506059…86747363723).
 * Analog inputs: 0–10 V → 0..1000. Internal/AQ range: −32768..+32767. p (decimals) is
 * display-only and therefore NOT modelled here (comparison ignores it — documented).
 *
 * The two-case threshold shape of this family matches the frequency flavor (`fa > On`),
 * verified per block page; counter flavor differs — see types.ts.
 * [ASCAD-INTERPRETATION] tags mark readings the docs do not pin down — never target-product claims.
 */

import type { Digital, Ms } from './types.ts';
import { ANALOG_INTERNAL_MAX, ANALOG_INTERNAL_MIN, clampInternal, frequencyOnOff } from './types.ts';

const roundHalfAwayFromZero = (v: number): number =>
  (v >= 0 ? Math.floor(v + 0.5) : -Math.floor(-v + 0.5));

export interface AnalogBlock<I> {
  tick(inputs: I, nowMs: Ms): Record<string, number> & { q?: Digital };
  state(): Readonly<Record<string, number | string | Digital>>;
}

/** Analog threshold trigger — topic 18405506059. */
export function analogThresholdTrigger(options: { gain: number; offset: number; on: number; off: number }):
AnalogBlock<{ ax: number }> {
  const { gain, offset, on, off } = options;
  let q: Digital = 0;
  return {
    tick({ ax }) {
      const actual = ax * gain + offset;
      q = frequencyOnOff(actual, on, off, q);
      return { q, actual };
    },
    state: () => ({ q, on, off }),
  };
}

/** Analog differential (delta) trigger — topic 12228838283. Off := On + Delta. */
export function analogDeltaTrigger(options: { gain: number; offset: number; on: number; delta: number }):
AnalogBlock<{ ax: number }> {
  const { gain, offset, on, delta } = options;
  const off = on + delta; // delta < 0 → switch behavior; delta > 0 → band behavior (documented)
  let q: Digital = 0;
  return {
    tick({ ax }) {
      const actual = ax * gain + offset;
      q = frequencyOnOff(actual, on, off, q);
      return { q, actual };
    },
    state: () => ({ q, on, off, delta }),
  };
}

/** Analog comparator — topic 12228856715 (same Gain/Offset scaling for both inputs). */
export function analogComparator(options: { gain: number; offset: number; on: number; off: number }):
AnalogBlock<{ ax: number; ay: number }> {
  const { gain, offset, on, off } = options;
  let q: Digital = 0;
  return {
    tick({ ax, ay }) {
      const diff = (ax * gain + offset) - (ay * gain + offset);
      q = frequencyOnOff(diff, on, off, q);
      return { q, actual: diff };
    },
    state: () => ({ q, on, off }),
  };
}

/** Analog watchdog — topic 12228875147. En 0→1 stores Aen; Q=1 outside [Aen−T2, Aen+T1]. */
export function analogWatchdog(options: { gain: number; offset: number; threshold1: number; threshold2: number }):
AnalogBlock<{ en: Digital; ax: number }> {
  const { gain, offset, threshold1, threshold2 } = options;
  let q: Digital = 0;
  let aen = 0;
  let prevEn: Digital = 0;
  return {
    tick({ en, ax }) {
      const actual = ax * gain + offset;
      if (en === 1 && prevEn === 0) aen = actual; // store on rising edge
      if (en === 0) q = 0;                          // documented: Q resets on En → 0
      else q = actual > aen + threshold1 || actual < aen - threshold2 ? 1 : 0; // documented: Q=1 while outside band
      prevEn = en;
      return { q, actual, aen };
    },
    state: () => ({ q, aen }),
  };
}

/** Analog amplifier — topic 12228893579. AQ = clamp(round((Ax × Gain) + Offset)) to int16. */
export function analogAmplifier(options: { gain: number; offset: number }):
AnalogBlock<{ ax: number }> {
  const { gain, offset } = options;
  let last = 0;
  return {
    tick({ ax }) {
      last = clampInternal(roundHalfAwayFromZero(ax * gain + offset));
      return { aq: last, actual: last };
    },
    state: () => ({ aq: last }),
  };
}

/** Analog multiplexer — topic 12228912011. En=0 → AQ=0; else V1..V4 by S1,S2. */
export function analogMux(options: { v: [number, number, number, number] }):
AnalogBlock<{ en: Digital; s1: Digital; s2: Digital }> {
  const { v } = options;
  let last = 0;
  return {
    tick({ en, s1, s2 }) {
      last = en === 0 ? 0 : clampInternal(v[(s1 ? 2 : 0) + (s2 ? 1 : 0)]);
      return { aq: last };
    },
    state: () => ({ aq: last }),
  };
}

/** Pulse-width modulator — topic 12228935947 (not on ≤ 0BA5).
 * Q = 1 for (Ax_actual − Min)/(Max − Min) of PT, else 0 (documented).
 * [ASCAD-CHOICE] Min/Max are params here — the installed help shows the formula but does not
 * list them in the parameter table (Min=0, Max=1000 defaults match the documented AI scaling).
 * Duty clamped to [0,1]; PT=0 → output 0.
 */
export function pwm(options: { gain: number; offset: number; min?: number; max?: number; ptMs: Ms }):
AnalogBlock<{ en: Digital; ax: number }> {
  const { gain, offset, min = 0, max = 1000, ptMs } = options;
  if (!(ptMs >= 0)) throw new RangeError('pwm: ptMs must be >= 0');
  let anchor: Ms | null = null;
  let prevEn: Digital = 0;
  return {
    tick({ en, ax }, nowMs) {
      if (en !== 1) { anchor = null; prevEn = en; return { q: 0 }; }
      if (prevEn === 0 || anchor === null) anchor = nowMs;
      prevEn = en;
      const actual = ax * gain + offset;
      const duty = max === min ? (actual >= max ? 1 : 0)
        : Math.min(1, Math.max(0, (actual - min) / (max - min)));
      const elapsed = ptMs === 0 ? 0 : (nowMs - anchor) % ptMs;
      return { q: elapsed < duty * ptMs ? 1 : 0 };
    },
    state: () => ({}),
  };
}

export type MathOp = '+' | '-' | '*' | '/';
export type MathPrio = 'H' | 'M' | 'L';

function applyOp(op: MathOp, a: number, b: number): { value: number; divideByZero: boolean } {
  switch (op) {
    case '+': return { value: a + b, divideByZero: false };
    case '-': return { value: a - b, divideByZero: false };
    case '*': return { value: a * b, divideByZero: false };
    case '/': return b === 0 ? { value: 0, divideByZero: true } : { value: a / b, divideByZero: false };
  }
}

/**
 * Mathematic instruction — topic 12228948875 (not on ≤ 0BA5).
 * V1..V4 operands, three operators with unique priorities H/M/L; H evaluated first, then M,
 * then L (documented). Fewer operands were meant to be padded by the editor (e.g. `+ 0`,
 * `× 1`) — the engine takes all four operands as given (caller pads).
 * Rounding: nearest integer, half away from zero for .5 ([ASCAD-CHOICE] — rounding mode of
 * the device is undocumented). Divide-by-zero or overflow → AQ = 32767; underflow → −32768.
 * En=0: 'zero' (default) or 'hold' — configurable (documented).
 * [ASCAD-INTERPRETATION]: intermediate results are not clamped until an operation exceeds
 * int32-safe float precision — effectively unbounded floats with final clamp; the documented
 * error bits (divide-by-zero, overflow) are not modelled.
 */
export function mathInstruction(options: {
  ops: [MathOp, MathOp, MathOp];
  priorities: [MathPrio, MathPrio, MathPrio]; // priorities[i] is the priority of ops[i]
  enZero?: 'zero' | 'hold';
}): AnalogBlock<{ en: Digital; v1: number; v2: number; v3: number; v4: number }> {
  const { ops, priorities, enZero = 'zero' } = options;
  const prioOrder: MathPrio[] = ['H', 'M', 'L'];
  if (new Set(priorities).size !== 3) throw new RangeError('mathInstruction: priorities must be unique H/M/L');
  let last = 0;
  return {
    tick({ en, v1, v2, v3, v4 }) {
      if (en !== 1) {
        if (enZero === 'zero') last = 0;
        return { aq: last };
      }
      let terms = [v1, v2, v3, v4];
      const localOps: MathOp[] = [...ops];
      const localPrio: MathPrio[] = [...priorities];
      let divideByZero = false;
      for (const prio of prioOrder) {
        const i = localPrio.indexOf(prio);
        if (i < 0) continue;
        const { value, divideByZero: dbz } = applyOp(localOps[i], terms[i], terms[i + 1]);
        if (dbz) divideByZero = true;
        terms = [...terms.slice(0, i), value, ...terms.slice(i + 2)];
        localOps.splice(i, 1);
        localPrio.splice(i, 1);
      }
      const raw = terms[0];
      let aq: number;
      if (divideByZero || raw > ANALOG_INTERNAL_MAX) aq = ANALOG_INTERNAL_MAX;      // documented: +32767
      else if (raw < ANALOG_INTERNAL_MIN) aq = ANALOG_INTERNAL_MIN;                  // documented: −32768
      else aq = roundHalfAwayFromZero(raw);
      last = aq;
      return { aq };
    },
    state: () => ({ aq: last }),
  };
}

/** Analog filter — topic 25633843595 (0BA7+ only). Moving average over last Sn samples. */
export function analogFilter(options: { sn: 8 | 16 | 32 | 64 | 128 | 256 }):
AnalogBlock<{ ax: number }> {
  const { sn } = options;
  if (![8, 16, 32, 64, 128, 256].includes(sn)) throw new RangeError('analogFilter: Sn must be 8/16/32/64/128/256');
  const buf: number[] = [];
  let last = 0;
  return {
    tick({ ax }) {
      buf.push(ax);
      if (buf.length > sn) buf.shift();
      last = clampInternal(roundHalfAwayFromZero(buf.reduce((a, b) => a + b, 0) / buf.length));
      return { aq: last };
    },
    state: () => ({ aq: last, count: buf.length }),
  };
}

/** Max/Min — topic 25633844363 (0BA7+ only). Modes 0-3 as documented. */
export function maxMin(options: {
  mode: 0 | 1 | 2 | 3;
  /** documented checkbox: when En = 0, reset Max/Min (→ AQ = 0); unchecked → hold last AQ */
  resetOnEn0?: boolean;
}): AnalogBlock<{ en: Digital; s1?: Digital; ax: number }> {
  const { mode, resetOnEn0 = false } = options;
  let min = 0, max = 0, aq = 0, prevEn: Digital = 0, prevS1: Digital = 0;
  let sampleSource: 'min' | 'max' = 'min';
  return {
    tick({ en, s1 = 0, ax }) {
      if (en === 1 && prevEn === 0) { min = ax; max = ax; } // fresh run per En rising
      if (en === 1) {
        if (ax < min) min = ax;
        if (ax > max) max = ax;
      }
      if (mode === 2) {
        if (s1 === 1 && prevS1 === 0) sampleSource = 'max'; // documented: S1 0→1 sets AQ = Max
        else if (s1 === 0 && prevS1 === 1) sampleSource = 'min';
      }
      prevS1 = s1;
      if (en === 0) {
        if (resetOnEn0) { aq = 0; }
        // else hold last (documented)
      } else if (mode === 0) aq = min;
      else if (mode === 1) aq = max;
      else if (mode === 2) aq = sampleSource === 'max' ? max : min;
      else aq = ax; // mode 3: AQ = Ax (documented)
      prevEn = en;
      return { aq };
    },
    state: () => ({ aq, min, max, source: sampleSource }),
  };
}

/** Average value — topic 25633845131 (0BA7+ only).
 * En 0→1: start sampling; at end of St, AQ ← average (documented). En 1→0: stop, AQ holds.
 * R 0→1: AQ ← 0 (documented).
 * [ASCAD-INTERPRETATION]: windows are cyclic while En is held (re-armed after each St);
 * sample cadence = St/Sn (configured sample count); anchored at the En rising edge.
 */
export function averageValue(options: { stMs: Ms; sn: number }):
AnalogBlock<{ en: Digital; r?: Digital; ax: number }> {
  const { stMs, sn } = options;
  if (!(stMs > 0)) throw new RangeError('averageValue: stMs must be > 0');
  const sampleEvery = stMs / Math.max(1, Math.trunc(sn));
  let aq = 0, sum = 0, count = 0, windowStart: Ms | null = null, sampleAnchor: Ms | null = null;
  let prevEn: Digital = 0, prevR: Digital = 0;
  return {
    tick({ en, r = 0, ax }, nowMs) {
      if (r === 1 && prevR === 0) { aq = 0; sum = 0; count = 0; windowStart = null; sampleAnchor = null; prevR = r; prevEn = en; return { aq }; }
      prevR = r;
      if (en === 1 && prevEn === 0) { windowStart = nowMs; sampleAnchor = nowMs; sum = 0; count = 0; }
      if (en === 1 && windowStart !== null && sampleAnchor !== null) {
        while (nowMs - sampleAnchor >= sampleEvery) { sum += ax; count += 1; sampleAnchor += sampleEvery; }
        if (nowMs - windowStart >= stMs) {
          aq = count > 0 ? sum / count : 0;
          windowStart = nowMs; sampleAnchor = nowMs; sum = 0; count = 0;
        }
      }
      prevEn = en;
      return { aq };
    },
    state: () => ({ aq, count }),
  };
}

/** Analog flags — topic 12020446475: accept and pass an analog value unchanged. */
export function analogFlag(): AnalogBlock<{ ax: number }> {
  return { tick: ({ ax }) => ({ aq: ax }), state: () => ({}) };
}

export type RampPhase = 'start' | 'run' | 'stop' | 'done' | 'idle';

/**
 * Analog ramp — topic 12229106315.
 * En 0→1: output (Offset + StSp) for 100 ms, then ramp at `rate` (units/s) toward the
 * Sel-selected level (Sel=0 → L1, Sel=1 → L2). Sel change retargets from the current level.
 * En 1→0: level immediately = Offset, AQ = 0 (documented).
 * St 0→1 (while enabled): decelerate at `rate` toward (Offset + StSp); holds for 100 ms,
 * then level = Offset, AQ = 0; restart requires both St and En reset.
 * AQ = (level − Offset) / Gain; AQ range 0..32767 (source table); MaxL caps the level.
 * [ASCAD-CHOICE]: continuous-rate integration of the ramp (the documented 100 ms update
 * cadence is treated as a UI/poll detail; crossing rate limits identically). direction =
 * sign(target − level). Initial "start" phase holds at Offset + StSp for 100 ms.
 */
export function analogRamp(options: {
  l1: number; l2: number; maxL: number; stSp: number;
  rate: number; gain: number; offset: number;
}): {
  tick(inputs: { en: Digital; st?: Digital; sel: Digital }, nowMs: Ms): { aq: number; level: number };
  state(): Readonly<Record<string, number | string | Digital>>;
} {
  const { l1, l2, maxL, stSp, rate, gain, offset } = options;
  if (!(rate > 0)) throw new RangeError('analogRamp: rate must be > 0');
  if (gain <= 0) throw new RangeError('analogRamp: gain must be > 0');
  let level = offset;
  let phase: RampPhase = 'idle';
  let phaseUntil: Ms | null = null;
  let lastNow: Ms | null = null;
  let prevEn: Digital = 0;
  let prevSt: Digital = 0;
  const clampAq = (lvl: number) => {
    const v = Math.round((lvl - offset) / gain);
    return Math.min(32767, Math.max(0, v));
  };
  return {
    tick({ en, st = 0, sel }, nowMs) {
      const dt = lastNow === null ? 0 : Math.max(0, nowMs - lastNow);
      lastNow = nowMs;
      if (st === 1 && prevSt === 0 && en === 1) { phase = 'stop'; phaseUntil = null; }
      if (en === 1 && prevEn === 0) {
        level = offset + stSp; // documented: output (Offset + StSp) for 100 ms
        phase = 'start';
        phaseUntil = nowMs + 100;
      }
      if (en === 0 && prevEn === 1) { level = offset; phase = 'idle'; phaseUntil = null; }
      if (phase === 'start' && phaseUntil !== null && nowMs >= phaseUntil) { phase = 'run'; phaseUntil = null; }
      if (phase === 'run') {
        const target = Math.min(sel === 1 ? l2 : l1, maxL);
        const step = rate * dt / 1000;
        const delta = target - level;
        if (Math.abs(delta) <= step) level = target;
        else level += Math.sign(delta) * step;
        if (level > maxL) level = maxL; // hard ceiling (documented)
      } else if (phase === 'stop') {
        const floor = offset + stSp;
        const step = rate * dt / 1000;
        if (level > floor) level = Math.max(floor, level - step);
        else if (level === floor && phaseUntil === null) phaseUntil = nowMs + 100; // hold 100 ms (documented)
        else if (level === floor && phaseUntil !== null && nowMs >= phaseUntil) {
          level = offset; phase = 'done'; phaseUntil = null;
        }
      }
      prevEn = en; prevSt = st;
      return { aq: phase === 'idle' ? 0 : clampAq(level), level };
    },
    state: () => ({ aq: phase === 'idle' ? 0 : clampAq(level), level, phase }),
  };
}

/**
 * PI controller — topic 12229087883.
 * Manual mode (A/M = 0): AQ = Mq (0…1000). Automatic: PV_updated = (PV × Gain) + Offset,
 * clamped to [Min, Max]; err = SP − PV_updated (Dir = '+') or PV_updated − SP (Dir = '−').
 * AQ = clamp(KC × err + (KC / TI_minutes) × ∫err dt, 0…1000), sampling from caller's clock.
 * If PV_updated = SP: AQ unchanged (documented) — integral does not wind up on exact 0 err.
 * R = 1 forces AQ = 0 (A/M disabled). Dir cannot be flipped while running (documented).
 * [ASCAD-INTERPRETATION]: NO discrete realization is published — this is a textbook positional
 * PI with clamping anti-windup; the device's internal tuning constants are unknown. AQ held at
 * limits against wind-up (integral frozen at clamp). Tsample is 500 ms (documented) — the
 * integrator uses actual dt, which on a slow host degrades gracefully.
 */
export function piController(options: {
  gain: number; offset: number; sp: number; mq?: number; kc: number;
  tiMinutes: number; dir: '+' | '-'; min?: number; max?: number;
}): {
  tick(inputs: { pv: number; r?: Digital; am?: Digital }, nowMs: Ms): { aq: number };
  state(): Readonly<Record<string, number | string | Digital>>;
} {
  const { gain, offset, sp, mq = 0, kc, tiMinutes, dir, min = -10000, max = 20000 } = options;
  if (!(tiMinutes > 0)) throw new RangeError('piController: tiMinutes must be > 0');
  let integ = 0;
  let lastAq = 0;
  let lastNow: Ms | null = null;
  let prevR: Digital = 0;
  return {
    tick({ pv, r = 0, am = 1 }, nowMs) {
      const dtMin = lastNow === null ? 0 : Math.max(0, nowMs - lastNow) / 60000;
      lastNow = nowMs;
      if (r === 1) { integ = 0; lastAq = 0; prevR = r; return { aq: 0 }; }
      prevR = r;
      if (am === 0) { lastAq = Math.min(1000, Math.max(0, mq)); return { aq: lastAq }; }
      const pvUpd = Math.min(max, Math.max(min, pv * gain + offset));
      const err = dir === '+' ? sp - pvUpd : pvUpd - sp;
      if (err === 0) return { aq: lastAq }; // documented: AQ unchanged at SP
      const integNext = integ + err * dtMin;
      const candidate = kc * err + (kc / tiMinutes) * integNext;
      const clamped = Math.min(1000, Math.max(0, candidate));
      if (clamped !== candidate) {
        // freeze integrator at the clamp (simple anti-windup)
        integ = ((clamped - kc * err) * tiMinutes) / kc;
      } else {
        integ = integNext;
      }
      lastAq = roundHalfAwayFromZero(clamped);
      return { aq: lastAq };
    },
    state: () => ({ aq: lastAq, integ }),
  };
}

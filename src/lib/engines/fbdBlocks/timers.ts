/**
 * Timer & clock SFB semantics (fbd-02-timers.md, topics 12228447243…25633787403).
 *
 * Engine model: cycle-based evaluation. Callers pass monotonic `nowMs`; blocks keep
 * internal state between evaluations. Retentivity is per-instance in-memory here —
 * persistence across power failure is an ASCAD-runtime concern (README).
 *
 * [ASCAD-CHOICE] tags mark interpretations the docs do not pin down — they are ASCAD
 * decisions, never target-product claims:
 *  - Asymmetric / symmetrical pulse generator phase order after En 0→1: Q=1 first
 *    (consistent with the documented "sets the output to 1 for the duration of the time T"
 *    for the symmetrical generator; extended symmetrically to the asymmetric one).
 *  - Random generator seed/RNG is injected by the caller (deterministic tests);
 *    no true-RNG constant is invented.
 *  - Stairway/comfort switch prewarning = one blink: Q drops at Ta = T−T! for T!L
 *    (the documented prewarning window; blink repetition rate is not documented).
 *  - Cycle-quantized phase switches drop sub-cycle remainders (no accumulation of
 *    t counter phase residues).
 *  - RTC-dependent blocks (weekly/yearly/astronomical clocks, stopwatch) live in
 *    rtc.ts and take local calendar time explicitly from the caller; the engine never
 *    reads the wall clock by itself.
 */

import type { Digital, Ms } from './types.ts';

export interface TimerBlock<I> {
  tick(inputs: I, nowMs: Ms): { q: Digital; taMs: Ms };
  /** Introspection for tests/diagnostics — string fields carry enum-like phases. */
  state(): Readonly<Record<string, number | string | Digital>>;
}

/** Accumulator with remainder support for phase switches. */
class Acu {
  private last: Ms | null = null;
  private acc = 0;

  /** Accumulate dt while `running`; returns the total. First call only anchors the clock. */
  tick(nowMs: Ms, running: boolean): Ms {
    if (this.last === null) { this.last = nowMs; return this.acc; }
    const dt = Math.max(0, nowMs - this.last);
    this.last = nowMs;
    if (running) this.acc += dt;
    return this.acc;
  }
  reset(): void { this.acc = 0; }
  /** Subtract a consumed interval, keeping the remainder. */
  consume(amount: Ms): void { this.acc = Math.max(0, this.acc - amount); }
  value(): Ms { return this.acc; }
  anchor(nowMs: Ms): void { this.last = nowMs; this.acc = 0; }
  anchorKeep(nowMs: Ms): void { this.last = nowMs; }
}

/** Shared prewarning blink: one drop of Q for `warnLowMs` starting at `T − warnMs`. */
function prewarningQ(taMs: Ms, T: Ms, warnMs: Ms, warnLowMs: Ms): Digital | null {
  if (warnMs <= 0 || warnMs >= T) return null; // disabled / nonsensical window
  const windowStart = T - warnMs;
  if (taMs >= windowStart && taMs < windowStart + warnLowMs) return 0;
  if (taMs >= T) return 0;
  if (taMs >= windowStart) return 1;
  return null; // not in prewarning window — caller keeps steady-state Q=1
}

/** On-delay — topic 12228447243. Ta counts from the 0→1 edge. */
export function onDelay(T: Ms): TimerBlock<{ trg: Digital }> {
  const acu = new Acu();
  let q: Digital = 0;
  let prevTrg: Digital = 0;
  return {
    tick({ trg }, nowMs) {
      if (trg === 1 && prevTrg === 0) acu.anchor(nowMs); // don't attribute the low tail
      if (trg === 1) acu.tick(nowMs, true);
      else { acu.reset(); acu.anchorKeep(nowMs); }
      q = acu.value() >= T ? 1 : 0;
      prevTrg = trg;
      return { q, taMs: acu.value() };
    },
    state: () => ({ q, taMs: acu.value() }),
  };
}

/** Off-delay — topic 12228465675. `R` resets Ta and Q. */
export function offDelay(T: Ms): TimerBlock<{ trg: Digital; r?: Digital }> {
  const acu = new Acu();
  let q: Digital = 0;
  let prevTrg: Digital = 0;
  let counting = false;
  return {
    tick({ trg, r = 0 }, nowMs) {
      if (r === 1) {
        acu.anchor(nowMs); q = 0; counting = false; prevTrg = trg;
        return { q, taMs: 0 };
      }
      if (trg === 1) {
        // Trg high: Q forced 1, off-delay not counting (retriggered inputs re-arm it).
        q = 1;
        counting = false;
        acu.anchor(nowMs);
        prevTrg = trg;
        return { q, taMs: 0 };
      }
      if (prevTrg === 1 && trg === 0) { counting = true; acu.anchor(nowMs); }
      if (counting) {
        acu.tick(nowMs, true);
        if (acu.value() >= T) { q = 0; counting = false; }
      } else {
        acu.anchorKeep(nowMs);
      }
      prevTrg = trg;
      return { q, taMs: acu.value() };
    },
    state: () => ({ q, taMs: acu.value(), counting: counting ? 1 : 0 }),
  };
}

/** On/off-delay — topic 12228484107. TH = on-delay, TL = off-delay. */
export function onOffDelay(TH: Ms, TL: Ms): TimerBlock<{ trg: Digital }> {
  const acuH = new Acu();
  const acuL = new Acu();
  let q: Digital = 0;
  let prevTrg: Digital = 0;
  let lastTa = 0;
  return {
    tick({ trg }, nowMs) {
      const rising = trg === 1 && prevTrg === 0;
      const falling = trg === 0 && prevTrg === 1;
      if (rising) acuH.anchor(nowMs);
      if (falling) acuL.anchor(nowMs);
      if (trg === 1) {
        acuL.anchor(nowMs);
        acuH.tick(nowMs, true);
        if (acuH.value() >= TH) q = 1;
        lastTa = acuH.value();
      } else {
        acuH.anchor(nowMs);
        acuL.tick(nowMs, true);
        if (acuL.value() >= TL) q = 0;
        lastTa = acuL.value();
      }
      prevTrg = trg;
      return { q, taMs: lastTa };
    },
    state: () => ({ q, taMs: lastTa }),
  };
}

/**
 * Retentive on-delay — topic 12228502539.
 * Ta accumulates only while Trg = 1 (input-gated). Extra Trg pulses do NOT reset Ta
 * (documented: "Further pulses at Trg do not affect Ta"). Ta and Q reset ONLY via `R`.
 * Power-failure persistence is the caller's concern ([ASCAD-CHOICE] in-memory here).
 */
export function retentiveOnDelay(T: Ms): TimerBlock<{ trg: Digital; r: Digital }> {
  const acu = new Acu();
  let q: Digital = 0;
  let prevTrg: Digital = 0;
  return {
    tick({ trg, r }, nowMs) {
      if (r === 1) {
        acu.anchor(nowMs); q = 0; prevTrg = trg;
        return { q, taMs: 0 };
      }
      if (trg === 1 && prevTrg === 0) acu.anchorKeep(nowMs); // don't attribute the low tail
      acu.tick(nowMs, trg === 1);
      prevTrg = trg;
      if (acu.value() >= T) q = 1;
      return { q, taMs: acu.value() };
    },
    state: () => ({ q, taMs: acu.value() }),
  };
}

/** Wiping relay (pulse output) — topic 12228520971. One pulse per Trg 0→1 episode. */
export function wipingRelay(T: Ms): TimerBlock<{ trg: Digital }> {
  const acu = new Acu();
  let q: Digital = 0;
  let prevTrg: Digital = 0;
  let fired = false; // pulse consumed for this Trg=1 episode
  return {
    tick({ trg }, nowMs) {
      if (trg === 0) {
        q = 0; fired = false; acu.anchor(nowMs); prevTrg = trg;
        return { q, taMs: acu.value() };
      }
      if (prevTrg === 0 && !fired) { acu.anchor(nowMs); fired = true; }
      acu.tick(nowMs, true);
      q = acu.value() < T ? 1 : 0;
      prevTrg = trg;
      return { q, taMs: acu.value() };
    },
    state: () => ({ q, taMs: acu.value(), fired: fired ? 1 : 0 }),
  };
}

/** Edge-triggered wiping relay — topic 12228539403. TL first, then TH; N cycles (1–9). */
export function edgeWipingRelay(TH: Ms, TL: Ms, N = 1): TimerBlock<{ trg: Digital }> {
  const cycles = Math.min(9, Math.max(1, Math.trunc(N)));
  const acu = new Acu();
  let prevTrg: Digital = 0;
  let phase: 'idle' | 'tl' | 'th' = 'idle';
  let done = 0;
  let q: Digital = 0;
  return {
    tick({ trg }, nowMs) {
      const rising = trg === 1 && prevTrg === 0;
      if (rising) { phase = 'tl'; done = 0; q = 0; acu.anchor(nowMs); }
      else if (phase === 'tl') {
        acu.tick(nowMs, true);
        if (acu.value() >= TL) { phase = 'th'; acu.consume(TL); q = 1; }
      } else if (phase === 'th') {
        acu.tick(nowMs, true);
        if (acu.value() >= TH) {
          done += 1; q = 0; acu.consume(TH);
          phase = done < cycles ? 'tl' : 'idle';
        }
      } else {
        acu.anchorKeep(nowMs);
      }
      prevTrg = trg;
      return { q, taMs: acu.value() };
    },
    state: () => ({ q, taMs: acu.value(), phase, done }),
  };
}

/** Symmetrical pulse generator — topic 12228557835. 0BA3 and earlier only. T ≥ 0.1 s. */
export function symPulse(T: Ms): TimerBlock<{ en: Digital }> {
  // Documented: "Always specify a time T of 0.1 s. A time T is not defined for 0.05/0.00."
  if (T < 100) throw new RangeError('symPulse: documented minimum T is 100 ms (T = 50 ms / 0 ms not defined)');
  const acu = new Acu();
  let q: Digital = 0;
  let phase: 'on' | 'off' = 'on';
  let started = false;
  return {
    tick({ en }, nowMs) {
      if (en !== 1) {
        started = false; q = 0; phase = 'on'; acu.anchor(nowMs);
        return { q, taMs: 0 };
      }
      if (!started) { started = true; phase = 'on'; q = 1; acu.anchor(nowMs); return { q, taMs: 0 }; }
      acu.tick(nowMs, true);
      if (acu.value() >= T) {
        acu.consume(T);
        phase = phase === 'on' ? 'off' : 'on';
        q = phase === 'on' ? 1 : 0;
      }
      return { q, taMs: acu.value() };
    },
    state: () => ({ q, taMs: acu.value(), phase }),
  };
}

/** Asynchronous pulse generator — topic 12228576267. [ASCAD-CHOICE: TH phase first]. */
export function asymPulse(TH: Ms, TL: Ms): TimerBlock<{ en: Digital; inv?: Digital }> {
  const acu = new Acu();
  let q: Digital = 0;
  let phase: 'th' | 'tl' = 'th';
  let started = false;
  return {
    tick({ en, inv = 0 }, nowMs) {
      if (en !== 1) {
        started = false; q = 0; phase = 'th'; acu.anchor(nowMs);
        return { q, taMs: 0 };
      }
      if (!started) { started = true; phase = 'th'; q = 1; if (inv === 1) q = 0; acu.anchor(nowMs); return { q, taMs: 0 }; }
      acu.tick(nowMs, true);
      const limit = phase === 'th' ? TH : TL;
      if (acu.value() >= limit) {
        acu.consume(limit);
        phase = phase === 'th' ? 'tl' : 'th';
      }
      q = phase === 'th' ? 1 : 0;
      if (inv === 1) q = q === 1 ? 0 : 1; // documented: Inv active only while En = 1
      return { q, taMs: acu.value() };
    },
    state: () => ({ q, taMs: acu.value(), phase }),
  };
}

/**
 * Random generator — topic 12228594699.
 * 0→1 at En: random on-delay in [0, TH]; Q → 1 when it expires *while En is still 1*.
 * 1→0 at En: random off-delay in [0, TL]; Q → 0 when it expires while En is still 0.
 * En dropping early resets the pending on-delay (equivalent for off-delay) — documented.
 * RNG injectable for determinism ([ASCAD-CHOICE]).
 */
export function randomGenerator(
  TH: Ms,
  TL: Ms,
  rng: () => number = Math.random,
): TimerBlock<{ en: Digital }> {
  const acu = new Acu();
  let q: Digital = 0;
  let prevEn: Digital = 0;
  let pending: 'on' | 'off' | null = null;
  let delay: Ms = 0;
  return {
    tick({ en }, nowMs) {
      const rising = en === 1 && prevEn === 0;
      const falling = en === 0 && prevEn === 1;

      if (rising) { pending = 'on'; delay = Math.floor(rng() * (TH + 1)); acu.anchor(nowMs); }
      else if (falling) { pending = 'off'; delay = Math.floor(rng() * (TL + 1)); acu.anchor(nowMs); }
      else if (pending === 'on' && en === 0) { pending = null; acu.anchor(nowMs); }
      else if (pending === 'off' && en === 1) { pending = null; acu.anchor(nowMs); }

      if (pending !== null) {
        acu.tick(nowMs, true);
        if (acu.value() >= delay) {
          if (pending === 'on' && en === 1) q = 1;
          if (pending === 'off' && en === 0) q = 0;
          pending = null;
        }
      } else {
        acu.anchorKeep(nowMs);
      }
      prevEn = en;
      return { q, taMs: acu.value() };
    },
    state: () => ({ q, taMs: acu.value(), pending: pending ?? 'none' }),
  };
}

/**
 * Stairway lighting switch — topic 12228618635.
 * 0→1 sets Q = 1; the 1→0 transition starts the effective off-delay countdown; Q resets
 * when Ta reaches T.
 * Prewarning: one blink — Q drops at Ta = T−T! for T!L once.
 * [ASCAD-CHOICE]: any 0→1 re-press restarts the full countdown ("retriggers near expiry"
 * timing is not specified in the help; always-retrigger is the standard stairway behavior).
 */
export function stairwaySwitch(T: Ms, warn: Ms, warnLow: Ms): TimerBlock<{ trg: Digital }> {
  const acu = new Acu();
  let q: Digital = 0;
  let prevTrg: Digital = 0;
  let counting = false;
  return {
    tick({ trg }, nowMs) {
      const rising = trg === 1 && prevTrg === 0;
      if (rising) {
        q = 1;
        counting = false;
        acu.anchor(nowMs); // held press: countdown only after release
        prevTrg = trg;
        return { q, taMs: 0 };
      }
      if (trg === 1) { // held: keep timer anchored, no countdown
        acu.anchorKeep(nowMs);
        prevTrg = trg;
        return { q, taMs: 0 };
      }
      if (prevTrg === 1 && trg === 0) { counting = true; acu.anchor(nowMs); }
      if (counting) {
        acu.tick(nowMs, true);
        const ta = acu.value();
        const warned = prewarningQ(ta, T, warn, warnLow);
        q = warned ?? (ta >= T ? 0 : 1);
        if (ta >= T) { counting = false; acu.anchor(nowMs); }
      } else {
        acu.anchorKeep(nowMs);
      }
      prevTrg = trg;
      return { q, taMs: acu.value() };
    },
    state: () => ({ q, taMs: acu.value(), counting: counting ? 1 : 0 }),
  };
}

/**
 * Multiple function (comfort) switch — topic 12228642571.
 * (a) short press: off-delay pulse switch (countdown starts at 1→0, Q resets at Ta = T);
 * (b) Trg held ≥ TL: continuous-light mode enabled — Q stays 1 after release;
 * R or a later 0→1 signal resets T, Ta and Q (documented "a later Trg signal resets T and Q").
 * Prewarning blink available via (T!, T!L).
 * [ASCAD-CHOICE]: toggle-off press only while the light is ON; pressing with Q = 0 starts it.
 * Caution (documented): T, T! and T!L must share a time base.
 */
export function comfortSwitch(
  T: Ms,
  TL: Ms,
  warn: Ms = 0,
  warnLow: Ms = 0,
): TimerBlock<{ trg: Digital; r?: Digital }> {
  const acu = new Acu();
  const holdAcu = new Acu();
  let q: Digital = 0;
  let prevTrg: Digital = 0;
  let counting = false;   // off-delay countdown active
  let permLight = false;  // continuous-light mode latched
  let holding = false;    // currently held
  let holdMs = 0;
  let justToggledOff = false; // press that switched the light off must not re-arm off-delay
  return {
    tick({ trg, r = 0 }, nowMs) {
      if (r === 1) {
        q = 0; permLight = false; counting = false; holding = false; holdMs = 0;
        acu.anchor(nowMs); holdAcu.anchor(nowMs); prevTrg = trg;
        return { q, taMs: 0 };
      }
      const rising = trg === 1 && prevTrg === 0;
      if (rising) {
        if (q === 1) {
          // documented: a later Trg signal resets T and Q
          q = 0; permLight = false; counting = false; holding = false; holdMs = 0;
          justToggledOff = true;
          acu.anchor(nowMs); holdAcu.anchor(nowMs);
          prevTrg = trg;
          return { q, taMs: 0 };
        }
        q = 1; counting = false; holding = true; holdMs = 0;
        acu.anchor(nowMs); holdAcu.anchor(nowMs);
        prevTrg = trg;
        return { q, taMs: 0 };
      }
      if (trg === 1 && holding) {
        holdAcu.tick(nowMs, true);
        holdMs = holdAcu.value();
        if (holdMs >= TL) permLight = true; // continuous-light enabled (documented)
        acu.anchorKeep(nowMs);
        prevTrg = trg;
        return { q, taMs: acu.value() };
      }
      if (trg === 0 && prevTrg === 1) { // release
        holding = false;
        if (justToggledOff) { justToggledOff = false; }
        else if (!permLight) { counting = true; acu.anchor(nowMs); }
        // continuous-light mode: Q stays 1, no countdown
      }
      if (trg === 0) holding = false;
      if (counting) {
        acu.tick(nowMs, true);
        const ta = acu.value();
        const warned = prewarningQ(ta, T, warn, warnLow);
        q = warned ?? (ta >= T ? 0 : 1);
        if (ta >= T) { counting = false; acu.anchor(nowMs); }
      } else {
        acu.anchorKeep(nowMs);
      }
      prevTrg = trg;
      return { q, taMs: acu.value() };
    },
    state: () => ({ q, taMs: acu.value(), counting: counting ? 1 : 0, permLight: permLight ? 1 : 0 }),
  };
}

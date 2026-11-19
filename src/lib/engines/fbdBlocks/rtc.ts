/**
 * RTC-dependent timer semantics (fbd-02-timers.md, topics 12228666507…25633787403).
 *
 * The engine never reads the wall clock. Callers supply local calendar time per tick:
 *   LocalTime = { year, month (1–12), day (1–31), minuteOfDay (0–1439),
 *                 secondOfDay (0–86399), dayOfWeek (0 = Monday … 6 = Sunday), nowMs }
 * nowMs is the same monotonic clock used by all other blocks (used for stopwatch).
 *
 * [ASCAD-CHOICE] / [ASCAD-INTERPRETATION] tags mark interpretations the docs do not pin down.
 * Documented facts: weekly timer has three cams (No1..No3), shortest cycle 1 minute, and
 * identical on/off times resolve cam3 > cam2 > cam1. Yearly timer executes set/reset at 00:00;
 * date range 2000–2099; pulse mode only for yearly (≥ 0BA6). Stopwatch time base is hours /
 * minutes / seconds / 1/100 s. Astronomical clock needs solar geometry (NOAA approximation).
 */

import type { Digital, Ms } from './types.ts';

export interface LocalTime {
  year: number;
  month: number;       // 1–12
  day: number;         // 1–31
  minuteOfDay: number; // 0–1439
  secondOfDay: number; // 0–86399
  dayOfWeek: number;   // 0 = Monday … 6 = Sunday
  nowMs: Ms;
}

export interface WeeklyCam {
  /** 0 = Monday … 6 = Sunday */
  day: number;
  onMinutes: number;   // minutes since midnight (ON time), 0–1439
  offMinutes?: number; // optional OFF time; omitted → this cam never turns Q off
  disabled?: boolean;
}

/**
 * Weekly timer — topic 12228666507.
 * A minute carries at most one event per cam (ON at onMinutes, OFF at offMinutes).
 * Resolution ([ASCAD-INTERPRETATION] — same-minute multi-cam precedence is underdocumented):
 * events this minute are processed in cam order 3 > 2 > 1; the highest cam with an event
 * decides the minute's output edge (ON → q = 1, OFF → q = 0). Cycles spanning multiple days
 * work by pairing an ON cam with an OFF cam on a later weekday (documented feature).
 * Pulse mode (≥ 0BA6): Q = 1 for exactly one evaluation at the ON minute (first evaluation of
 * that minute), else 0 — [ASCAD-INTERPRETATION] of "one-cycle" at 1-minute granularity.
 * Level mode: Q holds its last value between events.
 */
export function weeklyTimer(
  cams: WeeklyCam[],
  options: { pulse?: boolean } = {},
): { tick(inputs: { lt: LocalTime }): { q: Digital }; state(): Readonly<Record<string, number | string | Digital>> } {
  if (cams.length > 3) throw new RangeError('weeklyTimer: at most 3 cams documented');
  const { pulse = false } = options;
  let q: Digital = 0;
  let lastMinuteKey = -1;
  return {
    tick({ lt }) {
      const minuteKey = lt.dayOfWeek * 1440 + lt.minuteOfDay;
      if (minuteKey === lastMinuteKey) return { q: pulse ? 0 : q };
      lastMinuteKey = minuteKey;
      let decision = 0; // 0 = no event, 1 = ON, 2 = OFF
      for (let i = cams.length - 1; i >= 0; i--) {
        const cam = cams[i];
        if (cam.disabled) continue;
        if (cam.day === lt.dayOfWeek && cam.onMinutes === lt.minuteOfDay) { decision = 1; break; }
        if (cam.offMinutes !== undefined && cam.day === lt.dayOfWeek && cam.offMinutes === lt.minuteOfDay) { decision = 2; break; }
      }
      if (decision === 1) q = 1;
      else if (decision === 2) q = 0;
      return { q: pulse ? (decision === 1 ? 1 : 0) : q };
    },
    state: () => ({ q, lastMinuteKey }),
  };
}

export type YearlyMode = 'date' | 'yearly' | 'monthly' | 'pulse';

const dayOfYear = (y: number, m: number, d: number): number =>
  Math.floor((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 1)) / 86400000) + 1;
const utcMs = (y: number, m: number, d: number): number => Date.UTC(y, m - 1, d);

/**
 * Yearly timer — topic 12228728971. Modes:
 *  - 'date'   : single date range ON 00:00 … OFF 00:00 (inclusive ON, exclusive OFF).
 *  - 'yearly' : the same month/day range repeats every year; ranges may wrap the new year.
 *  - 'monthly': the same day(s) repeat every month, ON.day … OFF.day (OFF day exclusive).
 *               OFF ≤ ON within the month activates only the ON day (wrap not supported —
 *               underdocumented).
 *  - 'pulse'  : one Q = 1 evaluation at ON date 00:00, else 0 (yearly pulse ≥ 0BA6).
 * OFF omitted → only the ON day is active. Set/reset executed at 00:00 (documented).
 */
export function yearlyTimer(options: {
  on: { year?: number; month: number; day: number };
  off?: { year?: number; month: number; day: number };
  mode: YearlyMode;
}): { tick(inputs: { lt: LocalTime }): { q: Digital }; state(): Readonly<Record<string, number | string | Digital>> } {
  const { on, off, mode } = options;
  let q: Digital = 0;
  let lastPulseKey = -1;
  return {
    tick({ lt }) {
      if (mode === 'pulse') {
        const match = lt.minuteOfDay === 0 && lt.month === on.month && lt.day === on.day &&
          (on.year === undefined || lt.year === on.year);
        const key = lt.year * 10000 + lt.month * 100 + lt.day;
        q = match && key !== lastPulseKey ? 1 : 0;
        lastPulseKey = match ? key : lastPulseKey;
        return { q };
      }
      let inBand: boolean;
      if (mode === 'monthly') {
        const offDay = off?.day;
        if (offDay === undefined || offDay <= on.day) inBand = lt.day === on.day;
        else inBand = lt.day >= on.day && lt.day < offDay;
      } else if (mode === 'yearly') {
        const onDoy = dayOfYear(lt.year, on.month, on.day);
        const offDoy = off ? dayOfYear(lt.year, off.month, off.day) : onDoy;
        const today = dayOfYear(lt.year, lt.month, lt.day);
        if (offDoy <= onDoy) {
          inBand = off ? (today >= onDoy || today < offDoy) : today === onDoy;
        } else {
          inBand = today >= onDoy && today < offDoy;
        }
      } else { // 'date'
        const t = utcMs(lt.year, lt.month, lt.day);
        const a = utcMs(on.year ?? lt.year, on.month, on.day);
        if (!off) {
          inBand = t === a;
        } else {
          const b = utcMs(off.year ?? lt.year, off.month, off.day);
          inBand = t >= a && t < b;
        }
      }
      q = inBand ? 1 : 0;
      return { q };
    },
    state: () => ({ q }),
  };
}

/** Stopwatch — topic 25633787403 (AQ output, no boolean Q).
 * En 0→1: zero & start. En 1→0: freeze. Lap 0→1: latch lap time (AQ = lap). 1→0: resume.
 * R 0→1: clear elapsed & lap, AQ = 0.
 * Behavior matrix (En,Lap): (1,0)→AQ=elapsed · (1,1)→AQ=lap · (0,1)→AQ=lap · (0,0)→AQ=last.
 * Time base selects the AQ unit: hours / minutes / seconds / 10 ms ("hundredths").
 * [ASCAD-INTERPRETATION]: AQ unit scaling (the target displays AQ in the selected base with
 * impl-specific integer scaling; ASCAD emits the float value in that unit).
 * 10 ms resolution documented; sub-10ms remainder is floored at 10 ms counting.
 */
export type StopwatchTimeBase = 'hours' | 'minutes' | 'seconds' | 'hundredths';

export function stopwatch(options: { timeBase?: StopwatchTimeBase } = {}): {
  tick(inputs: { en: Digital; lap: Digital; r?: Digital }, nowMs: Ms): { aq: number; elapsedMs: Ms; lapMs: Ms };
  state(): Readonly<Record<string, number | string | Digital>>;
} {
  const { timeBase = 'seconds' } = options;
  let elapsed = 0;   // ms accumulated while (en=1 and lap=0) at freeze points
  let running = false;
  let anchor: Ms | null = null;
  let lapMs = 0;
  let lastAq = 0;
  let prevEn: Digital = 0;
  let prevLap: Digital = 0;
  let prevR: Digital = 0;
  const unit = (ms: number): number =>
    timeBase === 'hours' ? ms / 3600000
    : timeBase === 'minutes' ? ms / 60000
    : timeBase === 'seconds' ? ms / 1000
    : ms / 10;
  const live = (now: Ms): number => elapsed + (running && anchor !== null ? now - anchor : 0);
  return {
    tick({ en, lap, r = 0 }, nowMs) {
      const rRising = r === 1 && prevR === 0;
      const enRising = en === 1 && prevEn === 0;
      const enFalling = en === 0 && prevEn === 1;
      const lapRising = lap === 1 && prevLap === 0;
      const lapFalling = lap === 0 && prevLap === 1;

      if (rRising) {
        elapsed = 0; lapMs = 0; running = false; anchor = null; lastAq = 0;
        prevEn = en; prevLap = lap; prevR = r;
        return { aq: 0, elapsedMs: 0, lapMs: 0 };
      }
      if (enRising) { // zero & start (documented)
        elapsed = 0; lapMs = 0; running = lap === 0; anchor = lap === 0 ? nowMs : null; lastAq = 0;
      } else if (enFalling) {
        elapsed = live(nowMs); running = false; anchor = null;
      }
      if (lapRising && en === 1) { // pause: latch lap = current live elapsed
        lapMs = live(nowMs); elapsed = lapMs; running = false; anchor = null;
      } else if (lapFalling && en === 1) { // resume
        running = true; anchor = nowMs;
      }
      prevEn = en; prevLap = lap; prevR = r;

      const e = live(nowMs);
      let aq: number;
      if (en === 0 && lap === 0) aq = lastAq;          // documented: hold last current time
      else if (lap === 1) aq = unit(lapMs);            // (x,1) → lap
      else aq = unit(e);                               // (1,0) → elapsed
      lastAq = aq;
      return { aq, elapsedMs: e, lapMs };
    },
    state: () => ({ aq: lastAq, elapsedMs: elapsed, lapMs, running: running ? 1 : 0 }),
  };
}

/**
 * Astronomical clock — topic 25633774731 (0BA7+ only).
 * Q = 1 from sunrise to sunset at a configured location; sunrise/sunset computed with the
 * NOAA solar-position approximation (public standard equations); no vendor artifact of any kind is used.
 * `utcOffsetMinutes` is the *current* effective UTC offset incl. DST (the documented "OS
 * daylight-saving toggle"), supplied by the caller each tick (or once per day).
 * Polar day (sun never sets) → Q = 1 all day; polar night (sun never rises) → Q = 0
 * ([ASCAD-CHOICE] — polar behavior is undocumented).
 * Recomputed once per local date. Zenith 90.833° (official sunrise/sunset definition).
 */
export function astronomicalClock(options: {
  latDeg: number;         // +north
  lonDeg: number;         // +east
  utcOffsetMinutes: number;
}): { tick(inputs: { lt: LocalTime }): { q: Digital }; state(): Readonly<Record<string, number | string | Digital>> } {
  const { latDeg, lonDeg, utcOffsetMinutes } = options;
  const rad = Math.PI / 180;
  let q: Digital = 0;
  let cachedDate = '';
  let sunriseMin = 0;
  let sunsetMin = 1440;
  let polar: 'none' | 'day' | 'night' = 'none';

  function compute(y: number, m: number, d: number) {
    const n = dayOfYear(y, m, d);
    const gamma = (2 * Math.PI / 365) * (n - 1);
    const eqtime = 229.18 * (0.000075 + 0.001868 * Math.cos(gamma) - 0.032077 * Math.sin(gamma)
      - 0.014615 * Math.cos(2 * gamma) - 0.040849 * Math.sin(2 * gamma));
    const decl = 0.006918 - 0.399912 * Math.cos(gamma) + 0.070257 * Math.sin(gamma)
      - 0.006758 * Math.cos(2 * gamma) + 0.000907 * Math.sin(2 * gamma)
      - 0.002697 * Math.cos(3 * gamma) + 0.00148 * Math.sin(3 * gamma);
    const lat = latDeg * rad;
    const cosH = (Math.cos(90.833 * rad) / (Math.cos(lat) * Math.cos(decl))) - Math.tan(lat) * Math.tan(decl);
    if (cosH > 1) { polar = 'night'; return; }
    if (cosH < -1) { polar = 'day'; return; }
    polar = 'none';
    const ha = Math.acos(cosH) / rad; // degrees
    // NOAA: sunrise/sunset in UTC minutes
    sunriseMin = Math.floor(720 - 4 * (lonDeg + ha) - eqtime + utcOffsetMinutes);
    sunsetMin = Math.floor(720 - 4 * (lonDeg - ha) - eqtime + utcOffsetMinutes);
  }

  return {
    tick({ lt }) {
      const dateKey = `${lt.year}-${lt.month}-${lt.day}`;
      if (dateKey !== cachedDate) { cachedDate = dateKey; compute(lt.year, lt.month, lt.day); }
      if (polar === 'day') q = 1;
      else if (polar === 'night') q = 0;
      else q = lt.minuteOfDay >= sunriseMin && lt.minuteOfDay < sunsetMin ? 1 : 0;
      return { q };
    },
    state: () => ({ q, sunriseMin, sunsetMin, polar }),
  };
}

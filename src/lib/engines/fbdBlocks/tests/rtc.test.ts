import test from 'node:test';
import assert from 'node:assert/strict';
import { astronomicalClock, stopwatch, weeklyTimer, yearlyTimer } from '../rtc.ts';
import type { LocalTime } from '../rtc.ts';

const lt = (dayOfWeek: number, minuteOfDay: number, extra: Partial<LocalTime> = {}): LocalTime => ({
  year: 2026, month: 6, day: 21,
  minuteOfDay,
  secondOfDay: minuteOfDay * 60,
  dayOfWeek,
  nowMs: 0,
  ...extra,
});

test('weeklyTimer level mode: window opens at On, closes at Off; off-exclusive', () => {
  const b = weeklyTimer([{ day: 0, onMinutes: 7 * 60, offMinutes: 18 * 60 }]); // Monday
  assert.equal(b.tick({ lt: lt(0, 6 * 60 + 59) }).q, 0);
  assert.equal(b.tick({ lt: lt(0, 7 * 60) }).q, 1);
  assert.equal(b.tick({ lt: lt(0, 12 * 60) }).q, 1);   // holds between events
  assert.equal(b.tick({ lt: lt(0, 18 * 60) }).q, 0);
  assert.equal(b.tick({ lt: lt(6, 12 * 60) }).q, 0);   // Sunday: never fires
});

test('weeklyTimer cam priority: highest cam wins for identical times (cam3 > cam2 > cam1)', () => {
  const onWins = weeklyTimer([
    { day: 2, onMinutes: 600 },          // cam1 ON
    { day: 2, offMinutes: 600, onMinutes: 700 }, // cam2 (unused on)
    { day: 2, offMinutes: 600 },         // cam3 OFF — wins the minute
  ]);
  assert.equal(onWins.tick({ lt: lt(2, 600) }).q, 0);
  const onBeatsOff = weeklyTimer([
    { day: 2, offMinutes: 600 },          // cam1 OFF
    { day: 2, onMinutes: 600 },           // cam2 ON — wins over cam1 OFF
  ]);
  assert.equal(onBeatsOff.tick({ lt: lt(2, 600) }).q, 1);
});

test('weeklyTimer pulse mode: exactly one true evaluation at the ON minute', () => {
  const b = weeklyTimer([{ day: 4, onMinutes: 480 }], { pulse: true });
  assert.equal(b.tick({ lt: lt(4, 480) }).q, 1);
  assert.equal(b.tick({ lt: lt(4, 480) }).q, 0);  // same minute, once only
  assert.equal(b.tick({ lt: lt(4, 481) }).q, 0);
});

test('yearlyTimer monthly: ON.day … OFF.day window per month', () => {
  const b = yearlyTimer({ on: { month: 1, day: 5 }, off: { month: 1, day: 10 }, mode: 'monthly' });
  assert.equal(b.tick({ lt: lt(0, 0, { year: 2026, month: 3, day: 5 }) }).q, 1);
  assert.equal(b.tick({ lt: lt(0, 0, { year: 2026, month: 3, day: 9 }) }).q, 1);
  assert.equal(b.tick({ lt: lt(0, 0, { year: 2026, month: 3, day: 10 }) }).q, 0);
});

test('yearlyTimer yearly wrap: Dec → Jan range', () => {
  const b = yearlyTimer({ on: { month: 12, day: 1 }, off: { month: 1, day: 15 }, mode: 'yearly' });
  assert.equal(b.tick({ lt: lt(0, 0, { year: 2026, month: 12, day: 10 }) }).q, 1);
  assert.equal(b.tick({ lt: lt(0, 0, { year: 2027, month: 1, day: 10 }) }).q, 1);
  assert.equal(b.tick({ lt: lt(0, 0, { year: 2027, month: 1, day: 16 }) }).q, 0);
  assert.equal(b.tick({ lt: lt(0, 0, { year: 2027, month: 6, day: 1 }) }).q, 0);
});

test('yearlyTimer date mode: single range, ON inclusive / OFF exclusive', () => {
  const b = yearlyTimer({ on: { year: 2026, month: 7, day: 1 }, off: { year: 2026, month: 7, day: 3 }, mode: 'date' });
  assert.equal(b.tick({ lt: lt(0, 0, { year: 2026, month: 7, day: 1 }) }).q, 1);
  assert.equal(b.tick({ lt: lt(0, 0, { year: 2026, month: 7, day: 2 }) }).q, 1);
  assert.equal(b.tick({ lt: lt(0, 0, { year: 2026, month: 7, day: 3 }) }).q, 0);
});

test('yearlyTimer pulse: single true evaluation at ON date 00:00', () => {
  const b = yearlyTimer({ on: { year: 2026, month: 7, day: 1 }, mode: 'pulse' });
  assert.equal(b.tick({ lt: lt(0, 0, { year: 2026, month: 7, day: 1 }) }).q, 1);
  assert.equal(b.tick({ lt: lt(0, 1, { year: 2026, month: 7, day: 1 }) }).q, 0);
});

test('stopwatch: start/freeze/lap/resume/reset matrix and hundredths base', () => {
  const b = stopwatch({ timeBase: 'hundredths' });
  assert.equal(b.tick({ en: 1, lap: 0 }, 0).elapsedMs, 0);
  assert.equal(b.tick({ en: 1, lap: 0 }, 1000).elapsedMs, 1000);
  const l1 = b.tick({ en: 1, lap: 1 }, 1500);
  assert.equal(l1.elapsedMs, 1500);
  assert.equal(l1.lapMs, 1500);
  assert.equal(b.tick({ en: 1, lap: 1 }, 1800).aq, 150);  // (1,1) → lap, 1500ms / 10 = 150
  assert.equal(b.tick({ en: 1, lap: 0 }, 2000).elapsedMs, 1500); // resume anchors fresh
  assert.equal(b.tick({ en: 1, lap: 0 }, 3000).elapsedMs, 2500);
  assert.equal(b.tick({ en: 0, lap: 0 }, 4000).aq, 250);  // (0,0) → last
  assert.equal(b.tick({ en: 0, lap: 0, r: 1 }, 4500).aq, 0);
  assert.equal(b.tick({ en: 0, lap: 1 }, 5000).aq, 0);    // (0,1) → lap (0 after reset)
});

test('astronomicalClock: day arc at Berlin in summer; polar night/day at Tromsø in December/June', () => {
  const berlin = astronomicalClock({ latDeg: 52.5, lonDeg: 13.4, utcOffsetMinutes: 120 });
  assert.equal(berlin.tick({ lt: lt(0, 12 * 60, { year: 2026, month: 6, day: 21 }) }).q, 1);
  assert.equal(berlin.tick({ lt: lt(0, 3 * 60, { year: 2026, month: 6, day: 21 }) }).q, 0);
  // 21 June Berlin: sunrise ~5:14, sunset ~21:14 local
  const st = berlin.state();
  assert.ok(st.sunriseMin > 4 * 60 && st.sunriseMin < 7 * 60, `sunrise sane (${st.sunriseMin})`);
  assert.ok(st.sunsetMin > 19 * 60 && st.sunsetMin < 23 * 60, `sunset sane (${st.sunsetMin})`);

  const tromsoDec = astronomicalClock({ latDeg: 69.65, lonDeg: 18.96, utcOffsetMinutes: 60 });
  assert.equal(tromsoDec.tick({ lt: lt(0, 12 * 60, { year: 2026, month: 12, day: 15 }) }).q, 0);
  const tromsoJun = astronomicalClock({ latDeg: 69.65, lonDeg: 18.96, utcOffsetMinutes: 120 });
  assert.equal(tromsoJun.tick({ lt: lt(0, 0, { year: 2026, month: 6, day: 21 }) }).q, 1);
});

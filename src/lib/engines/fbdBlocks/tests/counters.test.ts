import test from 'node:test';
import assert from 'node:assert/strict';
import { hoursCounter, thresholdTrigger, upDownCounter } from '../counters.ts';

test('upDownCounter: counts 0->1 only; ignores 1->0 and steady high', () => {
  const b = upDownCounter({ on: 10, off: 10, dir: 0 });
  b.tick({ trg: 1, r: 0 });   // 1
  b.tick({ trg: 1, r: 0 });   // steady high — no count
  b.tick({ trg: 0, r: 0 });
  b.tick({ trg: 1, r: 0 });   // 2
  assert.equal(b.state().value, 2);
});

test('upDownCounter hysteresis (On >= Off): Q=1 at cnt>=On, Q=0 below Off, holds in between', () => {
  const b = upDownCounter({ on: 3, off: 1, dir: 1, startValue: 4 });
  assert.equal(b.tick({ trg: 1 }).q, 1); // 4 -> 3 : >= On -> 1
  assert.equal(b.tick({ trg: 0 }).q, 1);
  assert.equal(b.tick({ trg: 1 }).q, 1); // 3 -> 2 : in [Off, On) -> holds previous (1)
  assert.equal(b.tick({ trg: 0 }).q, 1);
  assert.equal(b.tick({ trg: 1 }).q, 1); // 2 -> 1 : still >= Off -> holds (1)
  assert.equal(b.tick({ trg: 0 }).q, 1);
  assert.equal(b.tick({ trg: 1 }).q, 0); // 1 -> 0 : < Off -> 0
});

test('upDownCounter windowed band (On < Off): Q=1 only in [On, Off)', () => {
  const b = upDownCounter({ on: 2, off: 5, dir: 0 });
  b.tick({ trg: 1 }); assert.equal(b.state().q, 0);  // cnt=1
  b.tick({ trg: 0 });
  b.tick({ trg: 1 }); assert.equal(b.state().q, 1);  // cnt=2
  b.tick({ trg: 0 });
  b.tick({ trg: 1 }); assert.equal(b.state().q, 1);  // cnt=3
  b.tick({ trg: 0 });
  b.tick({ trg: 1 }); assert.equal(b.state().q, 1);  // cnt=4
  b.tick({ trg: 0 });
  b.tick({ trg: 1 }); assert.equal(b.state().q, 0);  // cnt=5: out of band
});

test('upDownCounter: R resets value to Start Value', () => {
  const b = upDownCounter({ on: 100, off: 0, dir: 0, startValue: 7 });
  for (let i = 0; i < 3; i++) { b.tick({ trg: 1 }); b.tick({ trg: 0 }); }
  assert.equal(b.state().value, 10);
  b.tick({ trg: 0, r: 1 });
  assert.equal(b.state().value, 7);
});

test('hoursCounter: OT accumulates while En=1; MN countdown; Q at MN=0; Ral resets all', () => {
  const b = hoursCounter({ miMs: 10_000 });
  b.tick({ en: 1 }, 0);
  b.tick({ en: 1 }, 5000);
  assert.equal(b.state().mnMs, 5000);
  assert.equal(b.tick({ en: 1 }, 10000).q, 1); // MN reached 0
  assert.equal(b.state().value, 10000);        // OT accumulated
  b.tick({ en: 0, ral: 1 }, 12000);            // Ral: OT -> 0, MN -> MI, Q -> 0
  assert.equal(b.state().value, 0);
  assert.equal(b.state().mnMs, 10_000);
  assert.equal(b.state().q, 0);
});

test('hoursCounter: R resets Q and MN only, OT unchanged; r+en mode resets Q on En=0', () => {
  const b = hoursCounter({ miMs: 10_000 });
  b.tick({ en: 1 }, 0);
  b.tick({ en: 1 }, 10000); // MN -> 0, Q = 1
  assert.equal(b.state().q, 1);
  b.tick({ en: 0, r: 1 }, 11000); // R edge (En low so no OT accumulation during this tick)
  assert.equal(b.state().q, 0);
  assert.equal(b.state().mnMs, 10_000);
  assert.equal(b.state().value, 10000); // OT unchanged by R

  const c = hoursCounter({ miMs: 10_000, qResetMode: 'r+en' });
  c.tick({ en: 1 }, 0);
  c.tick({ en: 1 }, 10000);
  assert.equal(c.state().q, 1);
  assert.equal(c.tick({ en: 0 }, 11000).q, 0); // En falling resets Q in r+en mode
});

test('thresholdTrigger: gate window computes fa; Q per fa > On hysteresis, resets below Off', () => {
  const b = thresholdTrigger({ on: 10, off: 5, gateTimeMs: 1000 });
  // 20 pulses per second for the first gate
  for (let t = 0; t <= 1000; t += 50) {
    b.tick({ fre: 1 }, t);
    b.tick({ fre: 0 }, t + 25);
  }
  assert.equal(b.state().q, 1); // fa ~20 Hz > On
  // silence: next gate computes fa = 0 <= Off
  b.tick({ fre: 0 }, 2100);
  assert.equal(b.state().q, 0);
});

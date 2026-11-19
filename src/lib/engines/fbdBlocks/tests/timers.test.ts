import test from 'node:test';
import assert from 'node:assert/strict';
import {
  asymPulse, comfortSwitch, edgeWipingRelay, offDelay, onDelay, onOffDelay,
  randomGenerator, retentiveOnDelay, stairwaySwitch, symPulse, wipingRelay,
} from '../timers.ts';

test('onDelay: Q high only after Ta >= T; dropping Trg resets', () => {
  const b = onDelay(1000);
  assert.deepEqual(b.tick({ trg: 1 }, 0), { q: 0, taMs: 0 });
  assert.deepEqual(b.tick({ trg: 1 }, 999), { q: 0, taMs: 999 });
  assert.deepEqual(b.tick({ trg: 1 }, 1000), { q: 1, taMs: 1000 });
  assert.equal(b.tick({ trg: 0 }, 1500).q, 0);
  assert.equal(b.tick({ trg: 1 }, 1600).taMs, 0); // reset and restart
});

test('offDelay: Q while Trg high, countdown from 1->0 edge, R resets', () => {
  const b = offDelay(500);
  assert.equal(b.tick({ trg: 1 }, 0).q, 1);
  assert.equal(b.tick({ trg: 1 }, 400).q, 1);
  assert.equal(b.tick({ trg: 0 }, 1000).q, 1);  // TL starts at the falling edge
  assert.equal(b.tick({ trg: 0 }, 1499).q, 1);
  assert.equal(b.tick({ trg: 0 }, 1500).q, 0);
  assert.equal(b.tick({ trg: 0, r: 1 }, 1600).q, 0);
});

test('onOffDelay: TH on rising edge, TL on falling edge', () => {
  const b = onOffDelay(1000, 500);
  assert.equal(b.tick({ trg: 1 }, 0).q, 0);
  assert.equal(b.tick({ trg: 1 }, 1000).q, 1);
  assert.equal(b.tick({ trg: 0 }, 2000).q, 1);
  assert.equal(b.tick({ trg: 0 }, 2499).q, 1);
  assert.equal(b.tick({ trg: 0 }, 2500).q, 0);
});

test('retentiveOnDelay: Ta pauses when Trg low; only R resets', () => {
  const b = retentiveOnDelay(1000);
  assert.equal(b.tick({ trg: 1, r: 0 }, 0).q, 0);
  assert.equal(b.tick({ trg: 1, r: 0 }, 600).taMs, 600);
  assert.equal(b.tick({ trg: 0, r: 0 }, 5000).taMs, 600); // paused, not reset
  assert.equal(b.tick({ trg: 1, r: 0 }, 6000).taMs, 600);
  assert.equal(b.tick({ trg: 1, r: 0 }, 6400).q, 1);     // 600 + 400 = 1000
  const after = b.tick({ trg: 0, r: 0 }, 99999);
  assert.equal(after.q, 1);                              // not reset by Trg low
  assert.equal(b.tick({ trg: 0, r: 1 }, 100000).q, 0);   // R resets
});

test('wipingRelay: one pulse per Trg episode; early drop resets Q', () => {
  const b = wipingRelay(500);
  assert.equal(b.tick({ trg: 1 }, 0).q, 1);
  assert.equal(b.tick({ trg: 1 }, 499).q, 1);
  assert.equal(b.tick({ trg: 1 }, 500).q, 0);
  assert.equal(b.tick({ trg: 1 }, 900).q, 0);   // held high: no re-trigger
  assert.equal(b.tick({ trg: 0 }, 1000).q, 0);
  assert.equal(b.tick({ trg: 1 }, 1500).q, 1);  // new episode pulses again

  const c = wipingRelay(500);
  assert.equal(c.tick({ trg: 1 }, 0).q, 1);
  assert.equal(c.tick({ trg: 0 }, 200).q, 0);   // early 1->0 drops Q immediately
});

test('edgeWipingRelay: TL then N pulse/pause cycles of TH', () => {
  const b = edgeWipingRelay(200, 100, 2);
  assert.equal(b.tick({ trg: 1 }, 0).q, 0);    // TL phase
  assert.equal(b.tick({ trg: 1 }, 100).q, 1);  // TL expired -> TH starts
  assert.equal(b.tick({ trg: 1 }, 300).q, 0);  // first TH done; back to TL
  assert.equal(b.tick({ trg: 1 }, 400).q, 1);  // second TH starts
  assert.equal(b.tick({ trg: 1 }, 600).q, 0);  // N=2 cycles complete
});

test('symPulse: on T, off T, alternating; T < 100 ms throws (documented)', () => {
  const b = symPulse(1000);
  assert.equal(b.tick({ en: 1 }, 0).q, 1);
  assert.equal(b.tick({ en: 1 }, 1000).q, 0);
  assert.equal(b.tick({ en: 1 }, 2000).q, 1);
  assert.equal(b.tick({ en: 0 }, 2500).q, 0);
  assert.throws(() => symPulse(50), RangeError);
});

test('asymPulse: TH phase first (ASCAD-CHOICE), Inv inverts while En=1 only', () => {
  const b = asymPulse(300, 100);
  assert.equal(b.tick({ en: 1 }, 0).q, 1);
  assert.equal(b.tick({ en: 1 }, 300).q, 0);
  assert.equal(b.tick({ en: 1 }, 400).q, 1);
  const c = asymPulse(300, 100);
  assert.equal(c.tick({ en: 1, inv: 1 }, 0).q, 0); // inverted while enabled
  assert.equal(c.tick({ en: 0, inv: 1 }, 50).q, 0); // disabled: Inv inert, Q = 0
});

test('randomGenerator: on-delay then off-delay, seeded RNG', () => {
  const b = randomGenerator(1000, 200, () => 0.999); // delay = TH / TL
  assert.equal(b.tick({ en: 1 }, 0).q, 0);
  assert.equal(b.tick({ en: 1 }, 1000).q, 1);
  assert.equal(b.tick({ en: 0 }, 1100).q, 1);
  assert.equal(b.tick({ en: 0 }, 1100 + 200).q, 0);
});

test('randomGenerator: En drop before on-delay expires resets it', () => {
  let calls = 0;
  const rng = () => (calls++ === 0 ? 0.5 : 0); // first delay = 500, re-pick = 0
  const b = randomGenerator(1000, 100, rng);
  assert.equal(b.tick({ en: 1 }, 0).q, 0);
  assert.equal(b.tick({ en: 1 }, 250).q, 0);
  assert.equal(b.tick({ en: 0 }, 300).q, 0); // early drop resets pending on-delay
  assert.equal(b.tick({ en: 1 }, 400).q, 1);  // re-rise: new pick = 0 -> expires this tick
});

test('stairwaySwitch: countdown starts at 1->0; single prewarning blink at T−warn', () => {
  const b = stairwaySwitch(5000, 1000, 100);
  assert.equal(b.tick({ trg: 1 }, 0).q, 1);
  assert.equal(b.tick({ trg: 0 }, 100).q, 1);        // countdown starts at falling edge
  assert.equal(b.tick({ trg: 0 }, 4099).q, 1);       // Ta ~ 3999 (< T−T! = 4000)
  assert.equal(b.tick({ trg: 0 }, 4100).q, 0);       // prewarning window [4000, 4100)
  assert.equal(b.tick({ trg: 0 }, 4200).q, 1);       // blink over
  assert.equal(b.tick({ trg: 0 }, 100 + 5000).q, 0); // Ta = T -> Q off
});

test('stairwaySwitch: re-press during countdown re-triggers (documented)', () => {
  const b = stairwaySwitch(5000, 1000, 100);
  assert.equal(b.tick({ trg: 1 }, 0).q, 1);
  assert.equal(b.tick({ trg: 0 }, 100).q, 1);
  assert.equal(b.tick({ trg: 1 }, 1000).q, 1);       // re-trigger: Ta resets
  assert.equal(b.tick({ trg: 0 }, 2000).q, 1);       // Ta = 1000 again, not expired
  assert.equal(b.tick({ trg: 0 }, 2000 + 5000).q, 0);
});

test('comfortSwitch: short press = off-delay pulse; long hold = continuous light; re-press toggles off', () => {
  const b = comfortSwitch(3000, 1000);
  assert.equal(b.tick({ trg: 1 }, 0).q, 1);
  assert.equal(b.tick({ trg: 0 }, 300).q, 1);        // short press (hold 300 < TL)
  assert.equal(b.tick({ trg: 0 }, 300 + 2999).q, 1);
  assert.equal(b.tick({ trg: 0 }, 300 + 3000).q, 0); // Ta = T -> off

  assert.equal(b.tick({ trg: 1 }, 10000).q, 1);
  assert.equal(b.tick({ trg: 1 }, 11000).q, 1);      // held 1000 ms >= TL
  assert.equal(b.tick({ trg: 0 }, 12000).q, 1);      // continuous light: stays on
  assert.equal(b.tick({ trg: 1 }, 20000).q, 0);      // later Trg signal resets T and Q
  assert.equal(b.tick({ trg: 0 }, 20100).q, 0);
});

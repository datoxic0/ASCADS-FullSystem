import test from 'node:test';
import assert from 'node:assert/strict';
import {
  analogThresholdTrigger, analogDeltaTrigger, analogComparator, analogWatchdog,
  analogAmplifier, analogMux, pwm, mathInstruction, analogFilter, maxMin,
  averageValue, analogRamp, piController, analogFlag,
} from '../analog.ts';

test('analogThresholdTrigger (On>=Off): fa > On -> 1; fa <= Off -> 0; band holds', () => {
  const b = analogThresholdTrigger({ gain: 1, offset: 0, on: 800, off: 200 });
  assert.equal(b.tick({ ax: 900 }).q, 1);
  assert.equal(b.tick({ ax: 500 }).q, 1);   // band: holds previous (1)
  assert.equal(b.tick({ ax: 100 }).q, 0);
  assert.equal(b.tick({ ax: 500 }).q, 0);   // band: holds previous (0)
  assert.equal(b.tick({ ax: 800 }).q, 0);   // fa == On -> NOT > On -> holds previous (0)
});

test('analogThresholdTrigger (On<Off): window [On, Off)', () => {
  const b = analogThresholdTrigger({ gain: 1, offset: 0, on: 200, off: 800 });
  assert.equal(b.tick({ ax: 100 }).q, 0);
  assert.equal(b.tick({ ax: 200 }).q, 1);
  assert.equal(b.tick({ ax: 500 }).q, 1);
  assert.equal(b.tick({ ax: 800 }).q, 0);
});

test('analogDeltaTrigger: delta>0 band; delta<0 switch; off = on + delta', () => {
  const band = analogDeltaTrigger({ gain: 1, offset: 0, on: 500, delta: 200 });
  assert.equal(band.tick({ ax: 600 }).q, 1);
  assert.equal(band.tick({ ax: 800 }).q, 0);
  const sw = analogDeltaTrigger({ gain: 1, offset: 0, on: 500, delta: -200 });
  assert.equal(sw.tick({ ax: 600 }).q, 1);  // > On(500)
  assert.equal(sw.tick({ ax: 400 }).q, 1);  // band (On>=Off): holds
  assert.equal(sw.tick({ ax: 250 }).q, 0);  // <= Off(300)
});

test('analogComparator: same gain/offset scaling both inputs; offset cancels', () => {
  const b = analogComparator({ gain: 2, offset: 100, on: 300, off: 100 });
  assert.equal(b.tick({ ax: 600, ay: 400 }).q, 1);   // diff (600-400)*2 = 400 > On(300)
  assert.equal(b.tick({ ax: 450, ay: 400 }).q, 0);   // diff = 100 <= Off(100)
  assert.equal(b.tick({ ax: 500, ay: 400 }).q, 0);   // diff = 200 -> band: holds previous (0)
  assert.equal(b.tick({ ax: 700, ay: 400 }).q, 1);   // diff = 600 > 300
});

test('analogWatchdog: En rising stores Aen; Q=1 outside [Aen-T2, Aen+T1]; En=0 resets Q', () => {
  const b = analogWatchdog({ gain: 1, offset: 0, threshold1: 100, threshold2: 100 });
  assert.equal(b.tick({ en: 1, ax: 500 }).q, 0);     // store Aen=500, inside
  assert.equal(b.tick({ en: 1, ax: 700 }).q, 1);     // 700 > 600
  assert.equal(b.tick({ en: 1, ax: 500 }).q, 0);     // back inside
  assert.equal(b.tick({ en: 1, ax: 300 }).q, 1);     // 300 < 400
  assert.equal(b.tick({ en: 0, ax: 900 }).q, 0);     // En=0 -> Q=0
  assert.equal(b.tick({ en: 1, ax: 900 }).q, 0);     // rising edge re-stores Aen=900
  assert.equal(b.tick({ en: 1, ax: 850 }).q, 0);     // inside new window
});

test('analogAmplifier: AQ = clamp16(round(Ax*Gain + Offset)), half away from zero', () => {
  const b = analogAmplifier({ gain: 1, offset: 0 });
  assert.equal(b.tick({ ax: 123.4 }).aq, 123);
  assert.equal(b.tick({ ax: 2.5 }).aq, 3);           // .5 rounds half away from zero
  assert.equal(b.tick({ ax: -2.5 }).aq, -3);
  const g2 = analogAmplifier({ gain: 2, offset: 100 });
  assert.equal(g2.tick({ ax: 1000 }).aq, 2100);
  assert.equal(g2.tick({ ax: 20000 }).aq, 32767);    // clamp int16 max
  assert.equal(g2.tick({ ax: -20000 }).aq, -32768);  // clamp int16 min
});

test('analogMux: En=0 -> AQ=0; V1..V4 select by S1,S2; values clamped to int16', () => {
  const b = analogMux({ v: [10, 20, 30, 40] });
  assert.equal(b.tick({ en: 0, s1: 1, s2: 1 }).aq, 0);
  assert.equal(b.tick({ en: 1, s1: 0, s2: 0 }).aq, 10);
  assert.equal(b.tick({ en: 1, s1: 0, s2: 1 }).aq, 20);
  assert.equal(b.tick({ en: 1, s1: 1, s2: 0 }).aq, 30);
  assert.equal(b.tick({ en: 1, s1: 1, s2: 1 }).aq, 40);
  const big = analogMux({ v: [40000, 0, 0, 0] });
  assert.equal(big.tick({ en: 1, s1: 0, s2: 0 }).aq, 32767);
});

test('pwm: duty = (Ax-Min)/(Max-Min) clamped [0,1]; periodic PT window', () => {
  const b = pwm({ gain: 1, offset: 0, min: 0, max: 1000, ptMs: 1000 });
  assert.equal(b.tick({ en: 1, ax: 500 }, 0).q, 1);     // elapsed 0 < duty .5 * 1000
  assert.equal(b.tick({ en: 1, ax: 500 }, 600).q, 0);   // elapsed 600 >= 500
  assert.equal(b.tick({ en: 1, ax: 500 }, 1100).q, 1);  // elapsed 100 (wrap)
  assert.equal(b.tick({ en: 1, ax: 2000 }, 999).q, 1);  // duty clamp 1
  assert.equal(b.tick({ en: 1, ax: -500 }, 0).q, 0);    // duty clamp 0
  assert.equal(b.tick({ en: 0, ax: 500 }, 1200).q, 0);  // disabled
  const dead = pwm({ gain: 1, offset: 0, ptMs: 0 });
  assert.equal(dead.tick({ en: 1, ax: 500 }, 0).q, 0);  // PT=0 -> always 0
  assert.throws(() => pwm({ gain: 1, offset: 0, ptMs: -1 }), RangeError);
});

test('mathInstruction: H evaluated before M before L', () => {
  const b = mathInstruction({
    ops: ['+', '*', '-'],
    priorities: ['L', 'H', 'M'],   // (v2*v3) first, then M ('-'), then L ('+')
  });
  // 10 + 3*4 - 2 = 10 + (12 - 2) = 20
  assert.equal(b.tick({ en: 1, v1: 10, v2: 3, v3: 4, v4: 2 }).aq, 20);
  assert.throws(() => mathInstruction({ ops: ['+', '+', '+'], priorities: ['H', 'H', 'M'] }), RangeError);
});

test('mathInstruction: divide-by-zero -> +32767; overflow -> +32767; underflow -> -32768', () => {
  const dbz = mathInstruction({ ops: ['/', '+', '*'], priorities: ['H', 'M', 'L'] });
  assert.equal(dbz.tick({ en: 1, v1: 1, v2: 0, v3: 7, v4: 9 }).aq, 32767);
  const ovf = mathInstruction({ ops: ['*', '+', '+'], priorities: ['H', 'M', 'L'] });
  assert.equal(ovf.tick({ en: 1, v1: 1000, v2: 1000, v3: 1, v4: 1 }).aq, 32767);
  const unf = mathInstruction({ ops: ['*', '+', '+'], priorities: ['H', 'M', 'L'] });
  assert.equal(unf.tick({ en: 1, v1: -20000, v2: 2, v3: 0, v4: 0 }).aq, -32768);
  const half = mathInstruction({ ops: ['/', '+', '+'], priorities: ['H', 'M', 'L'] });
  assert.equal(half.tick({ en: 1, v1: 5, v2: 2, v3: 0, v4: 0 }).aq, 3);   // 2.5 half away from zero
  assert.equal(half.tick({ en: 1, v1: -5, v2: 2, v3: 0, v4: 0 }).aq, -3);
});

test('mathInstruction: En=0 zero mode resets; hold mode keeps last AQ', () => {
  const zero = mathInstruction({ ops: ['+', '+', '+'], priorities: ['H', 'M', 'L'] });
  assert.equal(zero.tick({ en: 1, v1: 5, v2: 6, v3: 7, v4: 8 }).aq, 26);
  assert.equal(zero.tick({ en: 0, v1: 0, v2: 0, v3: 0, v4: 0 }).aq, 0);
  const hold = mathInstruction({ ops: ['+', '+', '+'], priorities: ['H', 'M', 'L'], enZero: 'hold' });
  hold.tick({ en: 1, v1: 5, v2: 6, v3: 7, v4: 8 });
  assert.equal(hold.tick({ en: 0, v1: 0, v2: 0, v3: 0, v4: 0 }).aq, 26);
});

test('analogFilter: moving average over Sn samples; .5 rounds half away from zero', () => {
  const b = analogFilter({ sn: 8 });
  for (let i = 0; i < 8; i++) b.tick({ ax: 0 });
  assert.equal(b.tick({ ax: 0 }).aq, 0);
  for (let i = 0; i < 8; i++) b.tick({ ax: 100 });
  assert.equal(b.tick({ ax: 100 }).aq, 100);
  const c = analogFilter({ sn: 8 });
  [1, 2, 3, 4, 5, 6, 7, 8].forEach(v => c.tick({ ax: v }));
  assert.equal(c.tick({ ax: 9 }).aq, 6);   // window [2..9], avg 5.5 -> 6 (half away from zero)
  assert.throws(() => analogFilter({ sn: 10 as 8 }), RangeError);
});

test('maxMin: mode 0 -> Min; mode 1 -> Max; mode 2 -> S1 toggles source; mode 3 -> Ax', () => {
  const m0 = maxMin({ mode: 0 });
  [5, 3, 8, 1, 4].forEach(ax => m0.tick({ en: 1, s1: 0, ax }));
  assert.equal(m0.state().min, 1);
  assert.equal(m0.tick({ en: 1, s1: 0, ax: 4 }).aq, 1);
  const m1 = maxMin({ mode: 1 });
  [5, 3, 8, 1, 4].forEach(ax => m1.tick({ en: 1, s1: 0, ax }));
  assert.equal(m1.tick({ en: 1, s1: 0, ax: 4 }).aq, 8);
  const m2 = maxMin({ mode: 2 });
  [5, 3, 8, 1, 4].forEach(ax => m2.tick({ en: 1, s1: 0, ax }));
  assert.equal(m2.tick({ en: 1, s1: 1, ax: 4 }).aq, 8);   // S1 0->1: sample Max
  assert.equal(m2.tick({ en: 1, s1: 0, ax: 4 }).aq, 1);   // S1 1->0: sample Min
  const m3 = maxMin({ mode: 3 });
  assert.equal(m3.tick({ en: 1, s1: 0, ax: 42 }).aq, 42);
});

test('maxMin: resetOnEn0 checkbox; unchecked En=0 holds last AQ', () => {
  const fresh = maxMin({ mode: 0, resetOnEn0: true });
  [5, 1].forEach(ax => fresh.tick({ en: 1, s1: 0, ax }));
  assert.equal(fresh.tick({ en: 0, s1: 0, ax: 9 }).aq, 0);
  const hold = maxMin({ mode: 0 });
  [5, 1].forEach(ax => hold.tick({ en: 1, s1: 0, ax }));
  assert.equal(hold.tick({ en: 0, s1: 0, ax: 9 }).aq, 1);
});

test('maxMin: re-arming on En rising starts a fresh run', () => {
  const b = maxMin({ mode: 0 });
  [9, 9].forEach(ax => b.tick({ en: 1, s1: 0, ax }));    // min becomes 9
  b.tick({ en: 0, s1: 0, ax: 0 });                       // drop En
  b.tick({ en: 1, s1: 0, ax: 5 });                       // rising edge: fresh run, min=5
  assert.equal(b.state().min, 5);
});

test('averageValue: samples at St/Sn cadence; window average; R zeroes', () => {
  const b = averageValue({ stMs: 1000, sn: 10 });          // sampleEvery = 100 ms
  assert.equal(b.tick({ en: 1, ax: 0 }, 0).aq, 0);
  for (let t = 100; t <= 1000; t += 100) b.tick({ en: 1, ax: t / 100 }, t);
  assert.equal(b.tick({ en: 1, ax: 10 }, 1000).aq, 5.5);   // samples 1..10
  assert.equal(b.tick({ en: 0, ax: 10 }, 1100).aq, 5.5);   // En=0 -> holds
  assert.equal(b.tick({ en: 0, r: 1, ax: 10 }, 1200).aq, 0);
  assert.throws(() => averageValue({ stMs: 0, sn: 10 }), RangeError);
});

test('analogRamp: 100 ms start phase; ramps at rate; Sel retargets; MaxL caps; En=0 -> AQ=0', () => {
  const b = analogRamp({ l1: 500, l2: 800, maxL: 1000, stSp: 100, rate: 1000, gain: 10, offset: 0 });
  assert.equal(b.tick({ en: 1, st: 0, sel: 0 }, 0).aq, 10);    // 100 ms hold at Offset+StSp
  assert.equal(b.tick({ en: 1, st: 0, sel: 0 }, 100).aq, 20);  // phase->run, dt=100, level=200
  assert.equal(b.tick({ en: 1, st: 0, sel: 0 }, 200).aq, 30);  // level=300
  assert.equal(b.tick({ en: 1, st: 0, sel: 0 }, 300).aq, 40);  // level=400
  assert.equal(b.tick({ en: 1, st: 0, sel: 0 }, 400).aq, 50);  // level=500 (target)
  assert.equal(b.tick({ en: 1, st: 0, sel: 0 }, 500).aq, 50);  // saturated at target
  assert.equal(b.tick({ en: 1, st: 0, sel: 1 }, 600).aq, 60);  // retargeted to L2=800
  assert.equal(b.tick({ en: 0, st: 0, sel: 1 }, 700).aq, 0);   // En=0 -> AQ=0
  assert.throws(() => analogRamp({ l1: 1, l2: 2, maxL: 3, stSp: 0, rate: 0, gain: 10, offset: 0 }), RangeError);
  assert.throws(() => analogRamp({ l1: 1, l2: 2, maxL: 3, stSp: 0, rate: 1, gain: 0, offset: 0 }), RangeError);
});

test('analogRamp: MaxL caps the rising ramp', () => {
  const b = analogRamp({ l1: 500, l2: 800, maxL: 300, stSp: 100, rate: 1000, gain: 10, offset: 0 });
  b.tick({ en: 1, st: 0, sel: 0 }, 0);
  assert.equal(b.tick({ en: 1, st: 0, sel: 0 }, 100).aq, 20);  // level=200
  assert.equal(b.tick({ en: 1, st: 0, sel: 0 }, 200).aq, 30);  // level=300=maxL
  assert.equal(b.tick({ en: 1, st: 0, sel: 0 }, 300).aq, 30);  // capped
});

test('analogRamp: St decelerates to Offset+StSp, holds 100 ms, then zero; restart needs St and En reset', () => {
  const b = analogRamp({ l1: 500, l2: 800, maxL: 1000, stSp: 100, rate: 1000, gain: 10, offset: 0 });
  [0, 100, 200, 300, 400].forEach(t => b.tick({ en: 1, st: 0, sel: 0 }, t));   // level=500
  b.tick({ en: 1, st: 1, sel: 0 }, 400);                                        // St 0->1: stop phase
  assert.equal(b.tick({ en: 1, st: 1, sel: 0 }, 500).aq, 40);   // level=400
  assert.equal(b.tick({ en: 1, st: 1, sel: 0 }, 800).aq, 10);   // level=100 (floor)
  assert.equal(b.tick({ en: 1, st: 1, sel: 0 }, 900).aq, 10);   // floor held (100 ms)
  assert.equal(b.tick({ en: 1, st: 1, sel: 0 }, 1001).aq, 0);   // floor pulse elapsed -> zero
});

test('piController: manual mode AQ=Mq (clamped); R forces 0', () => {
  const b = piController({ gain: 1, offset: 0, sp: 600, mq: 1500, kc: 2, tiMinutes: 1, dir: '+' });
  assert.equal(b.tick({ pv: 400, am: 0 }, 0).aq, 1000);         // clamp to 1000
  assert.equal(b.tick({ pv: 400, am: 0, r: 1 }, 1000).aq, 0);   // R -> 0
  const n = piController({ gain: 1, offset: 0, sp: 600, mq: -5, kc: 2, tiMinutes: 1, dir: '+' });
  assert.equal(n.tick({ pv: 400, am: 0 }, 0).aq, 0);
  assert.throws(() => piController({ gain: 1, offset: 0, sp: 1, kc: 1, tiMinutes: 0, dir: '+' }), RangeError);
});

test('piController: automatic positional PI; anti-windup freeze at the clamp; dir sign', () => {
  const b = piController({ gain: 1, offset: 0, sp: 600, kc: 2, tiMinutes: 1, dir: '+' });
  assert.equal(b.tick({ pv: 400 }, 0).aq, 400);        // P only: 2*200
  assert.equal(b.tick({ pv: 400 }, 60000).aq, 800);    // + 2*200 (I over 1 min)
  assert.equal(b.tick({ pv: 400 }, 120000).aq, 1000);  // clamped
  assert.equal(b.tick({ pv: 400 }, 180000).aq, 1000);  // integrator frozen at clamp
  const neg = piController({ gain: 1, offset: 0, sp: 600, kc: 2, tiMinutes: 1, dir: '-' });
  assert.equal(neg.tick({ pv: 800 }, 0).aq, 400);      // err = pvUpd - sp = 200
  const atSp = piController({ gain: 1, offset: 0, sp: 600, kc: 2, tiMinutes: 1, dir: '+' });
  atSp.tick({ pv: 400 }, 0);
  assert.equal(atSp.tick({ pv: 600 }, 60000).aq, 400); // err = 0 -> AQ unchanged (documented)
});

test('analogFlag: pass-through', () => {
  assert.equal(analogFlag().tick({ ax: 123 }).aq, 123);
});

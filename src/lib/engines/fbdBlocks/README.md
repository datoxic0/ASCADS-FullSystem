# fbdBlocks — FBD/SFB engine semantics for ASCAD (clean-room)

**Clean room.** Specified exclusively from public documentation — online-help topic
ids cited in the sibling `logo-re/specs/fbd-*.md` spec files. No target-product
source, firmware, binaries, assets, or trade dress are used or redistributed.
Not affiliated with, endorsed by, or certified by any target vendor. No
compatibility claim is made for real target hardware behavior.

## Status

Additive port — now live in the app. `src/lib/engines/index.ts` re-exports this module
(`export * from './fbdBlocks'`), and the **FBD Blocks** bench page
(`src/pages/FbdBlocksPage.tsx`) exercises the engine interactively; it is registered as the
`fbd` mode in `src/pages/UnifiedShell.tsx`. `ladderEngine.ts` is untouched. The module's
feature flag `VITE_FBD_BLOCKS` gates only `isFbdBlocksEnabled()` — no app wiring depends on
it today. Nothing is wired into the PLC/FBD editor or `plc-simulator.ts` yet.

## Engine model

Cycle-based evaluation. The host drives one `tick()` per program scan and supplies a
monotonic `nowMs`. Blocks hold per-instance state in memory; persistence across power
failure (retentivity) is an ASCAD-runtime concern and is **not** implemented here.
RTC-dependent blocks take explicit local calendar time from the caller
(`LocalTime` in `rtc.ts`) — the engine never reads the wall clock. All timing is
wall-clock `Ms`; the host decides scan frequency.

## Implemented (spec → module)

- `fbd-01` bit logic → `bitLogic.ts`: AND/NAND/OR/NOR/XOR/NOT, AND-edge & NAND-edge
  (one-cycle pulse on rising edge, must-rearm semantics), permanent Hi/Lo, digital flag
  (previous-cycle output).
- `fbd-02` timers → `timers.ts`: on-delay, off-delay, on/off-delay, retentive on-delay,
  wiping relay (one pulse per Trg episode; Q drops immediately on 1→0), edge-triggered
  wiping relay (TL→TH, N = 1–9), symmetrical pulse (series-limited, T ≥ 0.1 s),
  asymmetric pulse ([ASCAD-CHOICE] TH first), random generator (injected RNG),
  stairway lighting switch & comfort switch (dual behavior, single-blink prewarning),
  `Ta` exposed on timer blocks.
- `fbd-02` RTC-dependent timers → `rtc.ts`: weekly timer (3 cams, cam3 > cam2 > cam1
  documented conflict rule, pulse/level mode), yearly timer (date/yearly/monthly/pulse
  modes), stopwatch (En/Lap/R, hours/minutes/seconds/hundredths bases), astronomical
  clock (NOAA solar-position approximation; polar day/night handled). These blocks
  receive local time explicitly; no timezone/DST model is embedded.
- `fbd-03` counters → `counters.ts`: up/down counter (rising-edge counting, R → Start
  Value, Dir parameter), hours counter (En-gated OT, MN countdown, R/Ral/R+En semantics,
  always-retentive note), threshold trigger (frequency over back-to-back gate windows).
- `fbd-04` analog family → `analog.ts`: threshold trigger, delta trigger, comparator,
  watchdog, amplifier, multiplexer, PWM, math instruction (H/M/L priority, int16 clamp,
  divide-by-zero → +32767), filter (moving average), max/min (modes 0–3), average
  (cyclic St windows), ramp (En/St/Sel, MaxL ceiling), PI controller (positional with
  clamping anti-windup). Analog scaling follows the documented internal model:
  AI 0–10 V → 0..1000; internal/AQ −32768..+32767.
- Counter- vs frequency-flavor two-case threshold rules live in `types.ts`
  (`counterOnOff` / `frequencyOnOff`) — the documented operator asymmetry (`>=`/`<`
  vs `>`/`<=`).

## Documented choices & interpretations

- `[ASCAD-CHOICE]` tags in sources mark every interpretation the help does not pin
  down (phase orders, prewarning blink shape, RNG injection, monotonic clamping,
  cycle-quantized phase remainders, solstice/polar handling, PWM duty semantics,
  continuous-rate ramp integration, rounding mode).
- `[ASCAD-INTERPRETATION]` tags mark readings of ambiguous documented rules (band
  regions of the two-case thresholds; hours-counter `MN` latched on first lapse
  rather than the sawtooth formula it cannot literally evaluate; weekly/yearly same-
  minute/overlap conflict resolution; pulse mode as a single one-cycle evaluation at
  the configured minute/date; stopwatch AQ unit scaling; average-window re-arm cadence;
  watchdog stored-value semantics).
- Hours counter: the documented display formula `MN = MI − (OT mod MI)` is recorded in
  `fbd-03`; ASCAD does not derive `MN` that way (see counters.ts notes).
- Counter `Start Value` = series-limited only (documented); not enforced by the
  module — series gating belongs to the host.

## Not yet ported (honest list)

- `fbd-05` specials: message texts, shift register, latching/pulse relay variants,
  analog value scaling block, Data Log, analog flags are partly landed (plain
  pass-through flag only); retentivity persistence for the hours counter is an
  ASCAD-runtime concern.
- `fbd-06` editor semantics (UDF limits, reference parameters, protection bits):
  editor-level, not engine.
- Analog flags with scaling, analog watch-dog persistence, PI-controller series
  gating (0BA7+), filter/max-min/average series gates (0BA7+) — documented gates are
  NOT enforced by the modules; the host owns series gating.
- Cycle-poll caveat (limits polled once per cycle) and fast-input limits: host concern.
- Time-base accuracy/tolerances: NOT documented in the help; not invented here.

## Validation

`node --test` over `tests/` (Node 24, native type stripping). `tsc --noEmit` is
**not available** in this tree (no `typescript` dependency anywhere reachable — see the
phase addendum). Type stripping does not type-check; passing tests are behavioral
evidence only. Every behavior asserted in tests traces to a spec line or carries an
`[ASCAD-CHOICE]`/`[ASCAD-INTERPRETATION]` tag.

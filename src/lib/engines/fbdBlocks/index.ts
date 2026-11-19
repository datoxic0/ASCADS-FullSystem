/**
 * FBD block library — clean-room, cycle-based FBD/SFB engine blocks.
 * Re-exported for convenient single-entry consumption:
 *   import { andBlock } from '../engines/fbdBlocks';
 * NOTE: the parent engines/index.ts re-exports this module
 * (`export * from './fbdBlocks'`) so app code can import blocks from '../engines'.
 */
export * from './types.ts';
export * from './bitLogic.ts';
export * from './timers.ts';
export * from './counters.ts';
export * from './analog.ts';
export * from './rtc.ts';
export * from './config.ts';
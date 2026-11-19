/**
 * Feature gate for the FBD blocks feature.
 * Phase 3 ships behind VITE_FBD_BLOCKS; nothing here is wired into the ASCAD app until
 * a conscious integration task sets the flag AND reviews the README.
 */

export function isFbdBlocksEnabled(): boolean {
  // import.meta.env is Vite-specific; guarded so the module never crashes outside Vite.
  const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
  return env?.VITE_FBD_BLOCKS === 'true';
}

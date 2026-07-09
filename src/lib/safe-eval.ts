/**
 * Safe expression evaluator — replaces `new Function()` in robot code interpreter.
 * Only allows: numbers, +, -, *, /, (, ), decimal points, spaces.
 * Any illegal character causes an error (returns fallback).
 */
export function safeEvalMath(expr: string, fallback = 0): number {
  const trimmed = expr.trim();
  if (!trimmed) return fallback;
  // Only allow digits, operators, parens, decimal point, space
  if (!/^[\d\+\-\*\/\(\)\.\s]+$/.test(trimmed)) {
    console.warn('[safe-eval] Rejected math expression:', trimmed);
    return fallback;
  }
  // Prevent empty parens, consecutive operators, or dangling operators
  const normalized = trimmed.replace(/\s+/g, '');
  if (/[\+\-\*\/]{2,}/.test(normalized)) return fallback;
  if (/[\+\-\*\/]$/.test(normalized) || /^[\+\*\/]/.test(normalized)) return fallback;
  if (/\(\)/.test(normalized)) return fallback;
  try {
    // eslint-disable-next-line no-new-func
    return parseFloat(new Function(`return (${trimmed})`)());
  } catch {
    return fallback;
  }
}

/**
 * Safe boolean condition evaluator.
 * Only allows: numbers, comparison ops (== === <= >= < > != !==),
 * logical ops (&& ||), parens, spaces.
 */
export function safeEvalCondition(expr: string, fallback = true): boolean {
  const trimmed = expr.trim();
  if (!trimmed) return fallback;
  // Must not contain any letters (prevents arbitrary code)
  if (/[a-zA-Z]/.test(trimmed)) {
    console.warn('[safe-eval] Rejected condition (contains letters):', trimmed);
    return fallback;
  }
  // Whitelist chars
  if (!/^[\d\+\-\*\/\(\)\.\s=<>!&|]+$/.test(trimmed)) {
    console.warn('[safe-eval] Rejected condition (illegal chars):', trimmed);
    return fallback;
  }
  try {
    // eslint-disable-next-line no-new-func
    return !!(new Function(`return (${trimmed})`)());
  } catch {
    return fallback;
  }
}

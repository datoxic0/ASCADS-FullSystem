/**
 * Binary Lab Library — ported & expanded from Bit-Architect-Pro-Lab
 * Covers: arithmetic ops, boolean synthesis, IEEE 754, Gray code, BCD,
 *         Excess-3, Hamming (7,4), signed representations, ASCII reference
 */

export type Bit = 0 | 1;

export interface ArithmeticStep {
  label: string;
  value: string;
  description?: string;
  type: 'carry' | 'operand' | 'result' | 'note';
}

export interface CalculationResult {
  binary: string;
  decimal: number;
  hex: string;
  octal: string;
  steps: ArithmeticStep[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function pad(s: string, len: number): string {
  return s.padStart(len, '0');
}

export function decToBin(n: number, width = 8): string {
  if (n < 0) {
    const twos = (Math.pow(2, width) + n) % Math.pow(2, width);
    return pad(twos.toString(2), width);
  }
  return pad(n.toString(2), width);
}

// ─── Binary Arithmetic ────────────────────────────────────────────────────────

export function addBinary(a: string, b: string): CalculationResult {
  const maxLen = Math.max(a.length, b.length) + 1;
  const pa = pad(a, maxLen);
  const pb = pad(b, maxLen);
  const steps: ArithmeticStep[] = [
    { label: 'Operand A', value: pa, type: 'operand' },
    { label: 'Operand B', value: pb, type: 'operand' },
  ];

  let carry = 0;
  let result = '';
  const carries: string[] = Array(maxLen).fill('0');

  for (let i = maxLen - 1; i >= 0; i--) {
    const sum = parseInt(pa[i]) + parseInt(pb[i]) + carry;
    result = (sum % 2).toString() + result;
    carry = Math.floor(sum / 2);
    if (carry) carries[i - 1] = '1';
  }
  if (carry) result = '1' + result;

  steps.push({ label: 'Carry Row', value: carries.join(''), type: 'carry', description: 'Carry propagation' });
  steps.push({ label: 'Sum Result', value: result, type: 'result' });

  const dec = parseInt(result, 2);
  return { binary: result, decimal: dec, hex: dec.toString(16).toUpperCase(), octal: dec.toString(8), steps };
}

export function subBinary(a: string, b: string): CalculationResult {
  const decA = parseInt(a, 2);
  const decB = parseInt(b, 2);
  const diff = decA - decB;
  const isNeg = diff < 0;
  const absDiff = Math.abs(diff);
  const binaryResult = absDiff.toString(2) || '0';

  const maxLen = Math.max(a.length, b.length);
  const pa = pad(a, maxLen);
  const pb = pad(b, maxLen);

  const bComplementDec = Math.pow(2, maxLen) - parseInt(pb, 2);
  const bComplement = pad((bComplementDec % Math.pow(2, maxLen)).toString(2), maxLen);
  const sumResult = (parseInt(pa, 2) + bComplementDec).toString(2);

  const steps: ArithmeticStep[] = [
    { label: 'Operand A', value: pa, type: 'operand' },
    { label: 'Operand B', value: pb, type: 'operand' },
    { label: "B Two's Complement", value: bComplement, type: 'note', description: 'Invert B + 1' },
    { label: 'A + twos(B)', value: sumResult, type: 'note' },
    { label: 'Result', value: (isNeg ? '-' : '') + binaryResult, type: 'result', description: isNeg ? 'Negative (borrowed)' : 'Positive' },
  ];

  return { binary: (isNeg ? '-' : '') + binaryResult, decimal: diff, hex: absDiff.toString(16).toUpperCase(), octal: absDiff.toString(8), steps };
}

export function multiplyBinary(a: string, b: string): CalculationResult {
  const decA = parseInt(a, 2);
  const decB = parseInt(b, 2);
  const product = decA * decB;
  const steps: ArithmeticStep[] = [
    { label: 'Multiplicand', value: pad(a, Math.max(a.length, b.length)), type: 'operand' },
    { label: 'Multiplier', value: pad(b, Math.max(a.length, b.length)), type: 'operand' },
  ];

  let partials: string[] = [];
  let shift = 0;
  for (let i = b.length - 1; i >= 0; i--) {
    if (b[i] === '1') {
      const partial = a + '0'.repeat(shift);
      partials.push(partial);
      steps.push({ label: `Partial ${b.length - i}`, value: partial, type: 'note', description: `Shift ${shift}` });
    }
    shift++;
  }

  const binary = product.toString(2) || '0';
  steps.push({ label: 'Product', value: binary, type: 'result' });
  return { binary, decimal: product, hex: product.toString(16).toUpperCase(), octal: product.toString(8), steps };
}

export function divideBinary(a: string, b: string): CalculationResult {
  const decA = parseInt(a, 2);
  const decB = parseInt(b, 2);
  if (decB === 0) return { binary: 'DIV/0', decimal: 0, hex: '0', octal: '0', steps: [{ label: 'Error', value: 'Division by zero', type: 'result' }] };

  const quotient = Math.floor(decA / decB);
  const remainder = decA % decB;
  const binary = quotient.toString(2) || '0';

  return {
    binary,
    decimal: quotient,
    hex: quotient.toString(16).toUpperCase(),
    octal: quotient.toString(8),
    steps: [
      { label: 'Dividend', value: pad(a, Math.max(a.length, b.length)), type: 'operand' },
      { label: 'Divisor', value: pad(b, Math.max(a.length, b.length)), type: 'operand' },
      { label: 'Quotient', value: binary, type: 'result' },
      { label: 'Remainder', value: remainder.toString(2) || '0', type: 'note', description: `Dec remainder: ${remainder}` },
    ]
  };
}

function bitwiseOp(a: string, b: string, op: (x: number, y: number) => number, label: string): CalculationResult {
  const maxLen = Math.max(a.length, b.length);
  const pa = pad(a, maxLen);
  const pb = pad(b, maxLen);
  let result = '';
  for (let i = 0; i < maxLen; i++) result += op(parseInt(pa[i]), parseInt(pb[i])).toString();
  const dec = parseInt(result, 2);
  return {
    binary: result,
    decimal: dec,
    hex: dec.toString(16).toUpperCase(),
    octal: dec.toString(8),
    steps: [
      { label: 'A', value: pa, type: 'operand' },
      { label: 'B', value: pb, type: 'operand' },
      { label, value: result, type: 'result' },
    ]
  };
}

export const andBinary  = (a: string, b: string) => bitwiseOp(a, b, (x, y) => x & y, 'AND Result');
export const orBinary   = (a: string, b: string) => bitwiseOp(a, b, (x, y) => x | y, 'OR Result');
export const xorBinary  = (a: string, b: string) => bitwiseOp(a, b, (x, y) => x ^ y, 'XOR Result');
export const nandBinary = (a: string, b: string) => bitwiseOp(a, b, (x, y) => (x & y) ^ 1, 'NAND Result');
export const norBinary  = (a: string, b: string) => bitwiseOp(a, b, (x, y) => (x | y) ^ 1, 'NOR Result');
export const xnorBinary = (a: string, b: string) => bitwiseOp(a, b, (x, y) => (x ^ y) ^ 1, 'XNOR Result');

// ─── Boolean Logic / Quine-McCluskey ─────────────────────────────────────────

export interface LogicTableRow {
  inputs: number[];
  output: number;
  minterm: number;
}

export interface LogicSynthesisResult {
  table: LogicTableRow[];
  variables: string[];
  sop: string;
  pos: string;
  minimized: string;
}

function padBin(n: number, len: number) { return n.toString(2).padStart(len, '0'); }

export class LogicSolver {
  static minimize(minterms: number[], varCount: number): string {
    if (minterms.length === 0) return '0';
    if (minterms.length === Math.pow(2, varCount)) return '1';

    const variables = Array.from({ length: varCount }, (_, i) => String.fromCharCode(65 + i));
    const allMins = new Set(minterms);
    type Implicant = { bits: number; mask: number; mins: number[] };

    function combine(a: Implicant, b: Implicant): Implicant | null {
      const diff = a.bits ^ b.bits;
      if (a.mask !== b.mask || (diff & (diff - 1)) !== 0) return null;
      return { bits: a.bits & b.bits, mask: a.mask | diff, mins: [...a.mins, ...b.mins].filter((v, i, arr) => arr.indexOf(v) === i) };
    }

    let current: Implicant[] = minterms.map(m => ({ bits: m, mask: 0, mins: [m] }));
    const primes: Implicant[] = [];

    while (current.length > 0) {
      const used = new Set<number>();
      const next: Implicant[] = [];

      for (let i = 0; i < current.length; i++) {
        for (let j = i + 1; j < current.length; j++) {
          const c = combine(current[i], current[j]);
          if (c && !next.some(n => n.bits === c.bits && n.mask === c.mask)) {
            next.push(c);
            used.add(i); used.add(j);
          }
        }
      }
      for (let i = 0; i < current.length; i++) {
        if (!used.has(i)) primes.push(current[i]);
      }
      current = next.filter((n, i, arr) => arr.findIndex(a => a.bits === n.bits && a.mask === n.mask) === i);
    }

    const covered = new Set<number>();
    const chosen: Implicant[] = [];

    for (const m of allMins) {
      const covers = primes.filter(p => p.mins.includes(m));
      if (covers.length === 1) {
        const p = covers[0];
        if (!chosen.includes(p)) { chosen.push(p); p.mins.forEach(x => covered.add(x)); }
      }
    }

    for (const p of primes) {
      let hasNew = false;
      for (const m of p.mins) if (allMins.has(m) && !covered.has(m)) { hasNew = true; break; }
      if (hasNew) { chosen.push(p); p.mins.forEach(x => covered.add(x)); }
    }

    return chosen.map(p => {
      const lits: string[] = [];
      for (let i = 0; i < varCount; i++) {
        const bit = varCount - 1 - i;
        if (!(p.mask & (1 << bit))) {
          lits.push((p.bits & (1 << bit)) ? variables[i] : `!${variables[i]}`);
        }
      }
      return lits.join(' · ') || '1';
    }).join(' + ');
  }
}

export function synthesizeLogic(numVars: number, outputs: string[]): LogicSynthesisResult {
  const rows = Math.pow(2, numVars);
  const variables = Array.from({ length: numVars }, (_, i) => String.fromCharCode(65 + i));
  const table: LogicTableRow[] = [];
  const minterms: number[] = [];
  const maxterms: number[] = [];
  const sopTerms: string[] = [];
  const posTerms: string[] = [];

  for (let i = 0; i < rows; i++) {
    const bits = padBin(i, numVars).split('').map(Number);
    const out = parseInt(outputs[i] ?? '0') || 0;
    table.push({ inputs: bits, output: out, minterm: i });

    const sopLits = bits.map((b, idx) => b === 1 ? variables[idx] : `!${variables[idx]}`);
    const posLits = bits.map((b, idx) => b === 0 ? variables[idx] : `!${variables[idx]}`);

    if (out === 1) { minterms.push(i); sopTerms.push(`(${sopLits.join(' · ')})`); }
    if (out === 0) { maxterms.push(i); posTerms.push(`(${posLits.join(' + ')})`); }
  }

  let minimized = '';
  try { minimized = LogicSolver.minimize(minterms, numVars); } catch { minimized = sopTerms.join(' + ') || '0'; }

  return {
    table,
    variables,
    sop: sopTerms.join(' + ') || '0',
    pos: posTerms.join(' · ') || '1',
    minimized,
  };
}

// ─── IEEE 754 ─────────────────────────────────────────────────────────────────

export interface IEEE754Result {
  sign: string;
  exponent: string;
  mantissa: string;
  hex: string;
  bits: string;
  biasedExp: number;
  trueExp: number;
  steps: ArithmeticStep[];
}

export function floatToIEEE754(val: number): IEEE754Result {
  const buf = new ArrayBuffer(4);
  const fv = new Float32Array(buf);
  const iv = new Uint32Array(buf);
  fv[0] = val;
  const bits = iv[0].toString(2).padStart(32, '0');
  const sign = bits[0];
  const exponent = bits.slice(1, 9);
  const mantissa = bits.slice(9);
  const hex = iv[0].toString(16).toUpperCase().padStart(8, '0');
  const biasedExp = parseInt(exponent, 2);
  const trueExp = biasedExp - 127;

  return {
    sign, exponent, mantissa, hex, bits, biasedExp, trueExp,
    steps: [
      { label: 'Value', value: val.toString(), type: 'operand' },
      { label: 'Sign Bit', value: sign, description: sign === '0' ? 'Positive (+)' : 'Negative (−)', type: 'note' },
      { label: 'Exponent (biased)', value: exponent, description: `Biased: ${biasedExp} → True: ${trueExp} (bias=127)`, type: 'note' },
      { label: 'Mantissa (fraction)', value: mantissa, description: 'Implicit leading 1.mantissa', type: 'note' },
      { label: 'Full IEEE-754 (32-bit)', value: bits, type: 'result' },
      { label: 'Hex', value: `0x${hex}`, type: 'result' },
    ]
  };
}

// ─── Gray Code ────────────────────────────────────────────────────────────────

export function decToGray(n: number, width: number): string {
  return (n ^ (n >> 1)).toString(2).padStart(width, '0');
}

export function grayToDec(grayStr: string): number {
  let gray = parseInt(grayStr, 2);
  let n = 0;
  for (; gray; gray >>= 1) n ^= gray;
  return n;
}

export function generateGrayTable(bits: number) {
  return Array.from({ length: Math.pow(2, bits) }, (_, i) => ({
    decimal: i,
    binary: padBin(i, bits),
    gray: decToGray(i, bits),
  }));
}

// ─── BCD & Excess-3 ───────────────────────────────────────────────────────────

export function decToBCD(n: number): string {
  return String(Math.abs(n)).split('').map(d => padBin(parseInt(d), 4)).join(' ');
}

export function decToExcess3(n: number): string {
  return String(Math.abs(n)).split('').map(d => padBin(parseInt(d) + 3, 4)).join(' ');
}

// ─── Hamming (7,4) ────────────────────────────────────────────────────────────

export interface Hamming74Result {
  encoded: string;
  data: string;
  p1: number; p2: number; p3: number;
  steps: ArithmeticStep[];
}

export function encodeHamming74(data: string): Hamming74Result {
  const d = data.padEnd(4, '0').slice(0, 4).split('').map(Number) as [number, number, number, number];
  const p1 = (d[0] + d[1] + d[3]) % 2;
  const p2 = (d[0] + d[2] + d[3]) % 2;
  const p3 = (d[1] + d[2] + d[3]) % 2;
  const encoded = `${p1}${p2}${d[0]}${p3}${d[1]}${d[2]}${d[3]}`;

  return {
    encoded, data: data.slice(0, 4), p1, p2, p3,
    steps: [
      { label: 'Data Bits (D1-D4)', value: d.join(''), description: 'Input 4-bit word', type: 'operand' },
      { label: 'P1 (pos 1,3,5,7)', value: String(p1), description: 'D1 ⊕ D2 ⊕ D4', type: 'note' },
      { label: 'P2 (pos 2,3,6,7)', value: String(p2), description: 'D1 ⊕ D3 ⊕ D4', type: 'note' },
      { label: 'P3 (pos 4,5,6,7)', value: String(p3), description: 'D2 ⊕ D3 ⊕ D4', type: 'note' },
      { label: 'Encoded Word [P1 P2 D1 P3 D2 D3 D4]', value: encoded, type: 'result' },
    ]
  };
}

export function decodeHamming74(received: string): { corrected: string; errorBit: number; data: string } {
  const r = received.padEnd(7, '0').slice(0, 7).split('').map(Number);
  const s1 = (r[0] + r[2] + r[4] + r[6]) % 2;
  const s2 = (r[1] + r[2] + r[5] + r[6]) % 2;
  const s3 = (r[3] + r[4] + r[5] + r[6]) % 2;
  const errorBit = s1 + 2 * s2 + 4 * s3;
  const corrected = [...r];
  if (errorBit > 0) corrected[errorBit - 1] ^= 1;
  const data = `${corrected[2]}${corrected[4]}${corrected[5]}${corrected[6]}`;
  return { corrected: corrected.join(''), errorBit, data };
}

// ─── Signed Representations ───────────────────────────────────────────────────

export interface SignedInfo {
  signMagnitude: number;
  onesComplement: number;
  twosComplement: number;
  smBinary: string;
  onesBinary: string;
  twosBinary: string;
  range: string;
}

export function getSignedInfo(val: string, width: number): SignedInfo {
  const num = parseInt(val, 2);
  const isNeg = val.length === width && val[0] === '1';

  const smDec = isNeg ? -parseInt(val.slice(1), 2) : num;
  const twosVal = isNeg ? num - Math.pow(2, width) : num;
  const onesVal = isNeg ? -(Math.pow(2, width - 1) - 1 - (num & (Math.pow(2, width - 1) - 1))) : num;

  const smBinary = smDec < 0 ? '1' + Math.abs(smDec).toString(2).padStart(width - 1, '0') : smDec.toString(2).padStart(width, '0');
  const onesNum = onesVal < 0 ? (Math.pow(2, width) - 1 + onesVal) : onesVal;
  const onesBinary = onesNum.toString(2).padStart(width, '0');
  const twosNum = twosVal < 0 ? (Math.pow(2, width) + twosVal) : twosVal;
  const twosBinary = twosNum.toString(2).padStart(width, '0');

  return {
    signMagnitude: smDec,
    onesComplement: onesVal,
    twosComplement: twosVal,
    smBinary, onesBinary, twosBinary,
    range: `[${-Math.pow(2, width - 1)}, ${Math.pow(2, width - 1) - 1}]`,
  };
}

// ─── ASCII Reference ──────────────────────────────────────────────────────────

export interface ReferenceRow {
  dec: number;
  bin: string;
  hex: string;
  oct: string;
  char: string;
  parity: number;
}

export function generateReferenceData(start: number, end: number, width = 8): ReferenceRow[] {
  return Array.from({ length: end - start + 1 }, (_, i) => {
    const n = start + i;
    const bin = n.toString(2).padStart(width, '0');
    const parity = bin.split('1').length - 1;
    return {
      dec: n,
      bin,
      hex: n.toString(16).toUpperCase().padStart(Math.ceil(width / 4), '0'),
      oct: n.toString(8).padStart(Math.ceil(width / 3), '0'),
      char: n >= 32 && n <= 126 ? String.fromCharCode(n) : n < 32 ? 'CTRL' : 'EXT',
      parity,
    };
  });
}

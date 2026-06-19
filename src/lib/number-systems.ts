/**
 * Number Systems Library — Base conversion logic ported & expanded from OctalPro
 * Supports: Dec, Bin, Oct, Hex with full step-by-step traces and KaTeX expressions
 */

export type ConversionStep = {
  label: string;
  expression: string;
  result: string;
  variables: Record<string, string>;
};

export type ConversionResult = {
  finalValue: string;
  steps: ConversionStep[];
  binaryCrossCheck?: string;
};

export type BaseConvertMode =
  | 'dec2oct' | 'oct2dec'
  | 'dec2bin' | 'bin2dec'
  | 'dec2hex' | 'hex2dec'
  | 'bin2oct' | 'oct2bin'
  | 'bin2hex' | 'hex2bin'
  | 'hex2oct' | 'oct2hex'
  | 'twos'    | 'ones';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function octalToBinary(octal: string): string {
  return octal.split('').map(c => {
    if (c === '.' || c === '-') return c;
    return parseInt(c, 8).toString(2).padStart(3, '0');
  }).join(' ');
}

function binaryToOctalStr(binary: string): string {
  const clean = binary.replace(/\s/g, '');
  if (!/^[01.]+$/.test(clean)) return 'Invalid Binary';
  const [intPart = '', fracPart] = clean.split('.');
  let padInt = intPart;
  while (padInt.length % 3) padInt = '0' + padInt;
  let result = '';
  for (let i = 0; i < padInt.length; i += 3) result += parseInt(padInt.slice(i, i + 3), 2).toString(8);
  if (fracPart) {
    let padFrac = fracPart;
    while (padFrac.length % 3) padFrac += '0';
    result += '.';
    for (let i = 0; i < padFrac.length; i += 3) result += parseInt(padFrac.slice(i, i + 3), 2).toString(8);
  }
  return result;
}

function binaryToHexStr(binary: string): string {
  const clean = binary.replace(/\s/g, '');
  if (!/^[01.]+$/.test(clean)) return 'Invalid Binary';
  const [intPart = '', fracPart] = clean.split('.');
  let padInt = intPart;
  while (padInt.length % 4) padInt = '0' + padInt;
  let result = '';
  for (let i = 0; i < padInt.length; i += 4) result += parseInt(padInt.slice(i, i + 4), 2).toString(16).toUpperCase();
  if (fracPart) {
    let padFrac = fracPart;
    while (padFrac.length % 4) padFrac += '0';
    result += '.';
    for (let i = 0; i < padFrac.length; i += 4) result += parseInt(padFrac.slice(i, i + 4), 2).toString(16).toUpperCase();
  }
  return result;
}

// ─── Dec → Oct ────────────────────────────────────────────────────────────────

export function decToOctSteps(n: number, precision = 8): ConversionResult {
  const steps: ConversionStep[] = [];
  const isNeg = n < 0;
  const abs = Math.abs(n);
  const intPart = Math.floor(abs);
  const fracPart = abs - intPart;

  let q = intPart;
  const digits: number[] = [];

  if (q === 0) {
    steps.push({ label: 'Integer Part', expression: '0 \\div 8 = 0 \\text{ r } 0', result: '0', variables: { q: '0', r: '0' } });
    digits.push(0);
  } else {
    while (q > 0) {
      const r = q % 8;
      const nq = Math.floor(q / 8);
      steps.push({ label: 'Integer Division', expression: `${q} \\div 8 = ${nq} \\text{ r } ${r}`, result: r.toString(), variables: { q: q.toString(), r: r.toString(), next_q: nq.toString() } });
      digits.push(r);
      q = nq;
    }
  }

  const intOct = digits.reverse().join('');
  let finalOct = intOct;

  if (fracPart > 0) {
    finalOct += '.';
    let f = fracPart;
    const fracDigits: number[] = [];
    const seen = new Map<number, number>();
    for (let i = 0; i < precision; i++) {
      if (seen.has(f)) {
        steps.push({ label: 'Repeating Fraction', expression: `\\text{Sequence repeats from index } ${seen.get(f)}`, result: '...', variables: { f: f.toFixed(6) } });
        break;
      }
      seen.set(f, i);
      const prod = f * 8;
      const digit = Math.floor(prod);
      const nextF = prod - digit;
      steps.push({ label: 'Fractional ×8', expression: `${f.toFixed(8)} \\times 8 = ${prod.toFixed(8)} \\Rightarrow \\text{digit } ${digit}`, result: digit.toString(), variables: { f: f.toFixed(8), prod: prod.toFixed(8), next_f: nextF.toFixed(8) } });
      fracDigits.push(digit);
      f = nextF;
      if (f === 0) break;
    }
    finalOct += fracDigits.join('');
  }

  return { finalValue: (isNeg ? '-' : '') + finalOct, steps, binaryCrossCheck: octalToBinary(finalOct) };
}

// ─── Oct → Dec ────────────────────────────────────────────────────────────────

export function octToDecSteps(octal: string): ConversionResult {
  const steps: ConversionStep[] = [];
  const [intPart = '0', fracPart] = octal.split('.');
  let total = 0;

  for (let i = 0; i < intPart.length; i++) {
    const d = parseInt(intPart[intPart.length - 1 - i], 8);
    const val = d * Math.pow(8, i);
    total += val;
    steps.push({ label: `Integer Pos ${i}`, expression: `${d} \\times 8^{${i}} = ${val}`, result: val.toString(), variables: { digit: d.toString(), power: i.toString(), value: val.toString() } });
  }
  if (fracPart) {
    for (let i = 0; i < fracPart.length; i++) {
      const d = parseInt(fracPart[i], 8);
      const val = d * Math.pow(8, -(i + 1));
      total += val;
      steps.push({ label: `Fractional Pos -${i + 1}`, expression: `${d} \\times 8^{${-(i + 1)}} = ${val.toFixed(10)}`, result: val.toFixed(10), variables: { digit: d.toString(), power: (-(i + 1)).toString() } });
    }
  }

  return { finalValue: total.toString(), steps, binaryCrossCheck: octalToBinary(octal) };
}

// ─── Dec → Bin ────────────────────────────────────────────────────────────────

export function decToBinSteps(n: number, precision = 8): ConversionResult {
  const steps: ConversionStep[] = [];
  const isNeg = n < 0;
  const abs = Math.abs(n);
  const intPart = Math.floor(abs);
  const fracPart = abs - intPart;

  let q = intPart;
  const digits: number[] = [];
  if (q === 0) {
    steps.push({ label: 'Integer Part', expression: '0 \\div 2 = 0 \\text{ r } 0', result: '0', variables: { q: '0', r: '0' } });
    digits.push(0);
  } else {
    while (q > 0) {
      const r = q % 2;
      const nq = Math.floor(q / 2);
      steps.push({ label: 'Division by 2', expression: `${q} \\div 2 = ${nq} \\text{ r } ${r}`, result: r.toString(), variables: { q: q.toString(), r: r.toString(), next_q: nq.toString() } });
      digits.push(r);
      q = nq;
    }
  }
  const intBin = digits.reverse().join('');
  let finalBin = intBin;

  if (fracPart > 0) {
    finalBin += '.';
    let f = fracPart;
    const fracDigits: number[] = [];
    for (let i = 0; i < precision; i++) {
      const prod = f * 2;
      const digit = Math.floor(prod);
      const nextF = prod - digit;
      steps.push({ label: `Fractional ×2`, expression: `${f.toFixed(8)} \\times 2 = ${prod.toFixed(8)} \\Rightarrow \\text{digit } ${digit}`, result: digit.toString(), variables: { f: f.toFixed(8), next_f: nextF.toFixed(8) } });
      fracDigits.push(digit);
      f = nextF;
      if (f === 0) break;
    }
    finalBin += fracDigits.join('');
  }

  return { finalValue: (isNeg ? '-' : '') + finalBin, steps };
}

// ─── Bin → Dec ────────────────────────────────────────────────────────────────

export function binToDecSteps(binary: string): ConversionResult {
  const steps: ConversionStep[] = [];
  const [intPart = '0', fracPart] = binary.split('.');
  let total = 0;

  for (let i = 0; i < intPart.length; i++) {
    const d = parseInt(intPart[intPart.length - 1 - i]);
    const val = d * Math.pow(2, i);
    total += val;
    steps.push({ label: `Bit ${i}`, expression: `${d} \\times 2^{${i}} = ${val}`, result: val.toString(), variables: { bit: d.toString(), power: i.toString() } });
  }
  if (fracPart) {
    for (let i = 0; i < fracPart.length; i++) {
      const d = parseInt(fracPart[i]);
      const val = d * Math.pow(2, -(i + 1));
      total += val;
      steps.push({ label: `Frac Bit -${i + 1}`, expression: `${d} \\times 2^{${-(i + 1)}} = ${val.toFixed(10)}`, result: val.toFixed(10), variables: { bit: d.toString() } });
    }
  }

  return { finalValue: total.toString(), steps };
}

// ─── Dec → Hex ────────────────────────────────────────────────────────────────

export function decToHexSteps(n: number): ConversionResult {
  const steps: ConversionStep[] = [];
  const isNeg = n < 0;
  let q = Math.abs(Math.floor(n));
  const hexChars = '0123456789ABCDEF';
  const digits: string[] = [];

  if (q === 0) {
    steps.push({ label: 'Integer Part', expression: '0 \\div 16 = 0 \\text{ r } 0', result: '0', variables: {} });
    digits.push('0');
  } else {
    while (q > 0) {
      const r = q % 16;
      const nq = Math.floor(q / 16);
      steps.push({ label: 'Division by 16', expression: `${q} \\div 16 = ${nq} \\text{ r } ${r} \\,(${hexChars[r]})`, result: hexChars[r], variables: { q: q.toString(), r: r.toString(), hex_digit: hexChars[r] } });
      digits.push(hexChars[r]);
      q = nq;
    }
  }
  const result = digits.reverse().join('');
  return { finalValue: (isNeg ? '-' : '') + result, steps, binaryCrossCheck: parseInt(result, 16).toString(2) };
}

// ─── Hex → Dec ────────────────────────────────────────────────────────────────

export function hexToDecSteps(hex: string): ConversionResult {
  const steps: ConversionStep[] = [];
  const upper = hex.toUpperCase();
  let total = 0;

  for (let i = 0; i < upper.length; i++) {
    const d = parseInt(upper[upper.length - 1 - i], 16);
    const val = d * Math.pow(16, i);
    total += val;
    steps.push({ label: `Hex Pos ${i}`, expression: `${upper[upper.length - 1 - i]}_{16} \\times 16^{${i}} = ${d} \\times ${Math.pow(16, i)} = ${val}`, result: val.toString(), variables: { digit: upper[upper.length - 1 - i], dec_digit: d.toString() } });
  }

  return { finalValue: total.toString(), steps };
}

// ─── Bin → Oct ────────────────────────────────────────────────────────────────

export function binToOctSteps(binary: string): ConversionResult {
  const result = binaryToOctalStr(binary);
  const clean = binary.replace(/\s/g, '');
  const [intPart = ''] = clean.split('.');
  let padded = intPart;
  while (padded.length % 3) padded = '0' + padded;

  const steps: ConversionStep[] = [];
  for (let i = 0; i < padded.length; i += 3) {
    const group = padded.slice(i, i + 3);
    const oct = parseInt(group, 2).toString(8);
    steps.push({ label: `Group ${i / 3 + 1}`, expression: `${group}_2 = ${parseInt(group, 2)}_{10} = ${oct}_8`, result: oct, variables: { group, decimal: parseInt(group, 2).toString() } });
  }

  return { finalValue: result, steps };
}

// ─── Oct → Bin ────────────────────────────────────────────────────────────────

export function octToBinSteps(octal: string): ConversionResult {
  const steps: ConversionStep[] = [];
  let result = '';

  for (const c of octal) {
    if (c === '.') { result += '.'; continue; }
    const d = parseInt(c, 8);
    const b = d.toString(2).padStart(3, '0');
    steps.push({ label: `Octal digit ${c}`, expression: `${c}_8 = ${d}_{10} = ${b}_2`, result: b, variables: { octal_digit: c, decimal: d.toString(), binary: b } });
    result += b;
  }

  return { finalValue: result, steps };
}

// ─── Bin → Hex ────────────────────────────────────────────────────────────────

export function binToHexSteps(binary: string): ConversionResult {
  const result = binaryToHexStr(binary);
  const clean = binary.replace(/\s/g, '');
  const [intPart = ''] = clean.split('.');
  let padded = intPart;
  while (padded.length % 4) padded = '0' + padded;

  const steps: ConversionStep[] = [];
  for (let i = 0; i < padded.length; i += 4) {
    const group = padded.slice(i, i + 4);
    const hex = parseInt(group, 2).toString(16).toUpperCase();
    steps.push({ label: `Group ${i / 4 + 1}`, expression: `${group}_2 = ${parseInt(group, 2)}_{10} = ${hex}_{16}`, result: hex, variables: { group, decimal: parseInt(group, 2).toString() } });
  }

  return { finalValue: result, steps };
}

// ─── Hex → Bin ────────────────────────────────────────────────────────────────

export function hexToBinSteps(hex: string): ConversionResult {
  const steps: ConversionStep[] = [];
  let result = '';

  for (const c of hex.toUpperCase()) {
    if (c === '.') { result += '.'; continue; }
    const d = parseInt(c, 16);
    const b = d.toString(2).padStart(4, '0');
    steps.push({ label: `Hex digit ${c}`, expression: `${c}_{16} = ${d}_{10} = ${b}_2`, result: b, variables: { hex_digit: c, decimal: d.toString(), binary: b } });
    result += b;
  }

  return { finalValue: result, steps };
}

// ─── Hex → Oct ────────────────────────────────────────────────────────────────

export function hexToOctSteps(hex: string): ConversionResult {
  const dec = parseInt(hex, 16);
  const bin = dec.toString(2);
  const oct = dec.toString(8);
  return {
    finalValue: oct,
    steps: [
      { label: 'Hex → Decimal', expression: `${hex.toUpperCase()}_{16} = ${dec}_{10}`, result: dec.toString(), variables: { hex, decimal: dec.toString() } },
      { label: 'Decimal → Binary', expression: `${dec}_{10} = ${bin}_2`, result: bin, variables: {} },
      { label: 'Binary → Octal', expression: `${bin}_2 = ${oct}_8`, result: oct, variables: {} },
    ]
  };
}

// ─── Oct → Hex ────────────────────────────────────────────────────────────────

export function octToHexSteps(octal: string): ConversionResult {
  const dec = parseInt(octal, 8);
  const bin = dec.toString(2);
  const hex = dec.toString(16).toUpperCase();
  return {
    finalValue: hex,
    steps: [
      { label: 'Octal → Decimal', expression: `${octal}_8 = ${dec}_{10}`, result: dec.toString(), variables: { octal, decimal: dec.toString() } },
      { label: 'Decimal → Binary', expression: `${dec}_{10} = ${bin}_2`, result: bin, variables: {} },
      { label: 'Binary → Hex', expression: `${bin}_2 = ${hex}_{16}`, result: hex, variables: {} },
    ]
  };
}

// ─── Two's Complement ─────────────────────────────────────────────────────────

export function getTwosComplementSteps(n: number, bits = 16): ConversionResult {
  const mag = Math.abs(n);
  const binMag = mag.toString(2).padStart(bits, '0');
  const inverted = binMag.split('').map(b => b === '0' ? '1' : '0').join('');

  let carry = 1;
  const arr = inverted.split('').reverse();
  const added: string[] = [];
  for (const b of arr) {
    const sum = parseInt(b) + carry;
    added.push((sum % 2).toString());
    carry = sum > 1 ? 1 : 0;
  }
  const finalBin = added.reverse().join('');
  const oct = binaryToOctalStr(finalBin);

  return {
    finalValue: finalBin,
    steps: [
      { label: 'Magnitude Binary', expression: `|${n}| \\rightarrow ${binMag}`, result: binMag, variables: { mag: mag.toString() } },
      { label: 'Bitwise Inversion (NOT)', expression: `\\overline{${binMag}} = ${inverted}`, result: inverted, variables: {} },
      { label: 'Add 1', expression: `${inverted} + 1 = ${finalBin}`, result: finalBin, variables: {} },
      { label: 'Octal representation', expression: `${finalBin}_2 = ${oct}_8`, result: oct, variables: {} },
    ],
    binaryCrossCheck: finalBin
  };
}

// ─── One's Complement ─────────────────────────────────────────────────────────

export function getOnesComplementSteps(n: number, bits = 16): ConversionResult {
  const mag = Math.abs(n);
  const binMag = mag.toString(2).padStart(bits, '0');
  const inverted = binMag.split('').map(b => b === '0' ? '1' : '0').join('');

  return {
    finalValue: inverted,
    steps: [
      { label: 'Magnitude Binary', expression: `|${n}| \\rightarrow ${binMag}`, result: binMag, variables: { mag: mag.toString() } },
      { label: 'Bitwise Inversion (NOT)', expression: `\\overline{${binMag}} = ${inverted}`, result: inverted, variables: { note: 'One\'s complement: flip all bits' } },
    ],
    binaryCrossCheck: inverted
  };
}

// ─── Dispatcher ───────────────────────────────────────────────────────────────

export function runConversion(mode: BaseConvertMode, input: string, precision = 8): ConversionResult {
  const trimmed = input.trim();
  switch (mode) {
    case 'dec2oct': return decToOctSteps(parseFloat(trimmed), precision);
    case 'oct2dec': return octToDecSteps(trimmed);
    case 'dec2bin': return decToBinSteps(parseFloat(trimmed), precision);
    case 'bin2dec': return binToDecSteps(trimmed);
    case 'dec2hex': return decToHexSteps(parseFloat(trimmed));
    case 'hex2dec': return hexToDecSteps(trimmed);
    case 'bin2oct': return binToOctSteps(trimmed);
    case 'oct2bin': return octToBinSteps(trimmed);
    case 'bin2hex': return binToHexSteps(trimmed);
    case 'hex2bin': return hexToBinSteps(trimmed);
    case 'hex2oct': return hexToOctSteps(trimmed);
    case 'oct2hex': return octToHexSteps(trimmed);
    case 'twos':    return getTwosComplementSteps(parseInt(trimmed));
    case 'ones':    return getOnesComplementSteps(parseInt(trimmed));
    default: return { finalValue: '', steps: [] };
  }
}

export const CONVERSION_MODES: { id: BaseConvertMode; label: string; group: string; placeholder: string }[] = [
  { id: 'dec2bin', label: 'Dec → Bin',  group: 'Decimal',     placeholder: '255' },
  { id: 'dec2oct', label: 'Dec → Oct',  group: 'Decimal',     placeholder: '123.375' },
  { id: 'dec2hex', label: 'Dec → Hex',  group: 'Decimal',     placeholder: '255' },
  { id: 'bin2dec', label: 'Bin → Dec',  group: 'Binary',      placeholder: '11001010' },
  { id: 'bin2oct', label: 'Bin → Oct',  group: 'Binary',      placeholder: '11001010' },
  { id: 'bin2hex', label: 'Bin → Hex',  group: 'Binary',      placeholder: '11001010' },
  { id: 'oct2dec', label: 'Oct → Dec',  group: 'Octal',       placeholder: '177.3' },
  { id: 'oct2bin', label: 'Oct → Bin',  group: 'Octal',       placeholder: '177' },
  { id: 'oct2hex', label: 'Oct → Hex',  group: 'Octal',       placeholder: '177' },
  { id: 'hex2dec', label: 'Hex → Dec',  group: 'Hexadecimal', placeholder: 'FF' },
  { id: 'hex2bin', label: 'Hex → Bin',  group: 'Hexadecimal', placeholder: 'FF' },
  { id: 'hex2oct', label: 'Hex → Oct',  group: 'Hexadecimal', placeholder: 'FF' },
  { id: 'twos',    label: "Two's Comp", group: 'Signed',      placeholder: '-45' },
  { id: 'ones',    label: "One's Comp", group: 'Signed',      placeholder: '-45' },
];

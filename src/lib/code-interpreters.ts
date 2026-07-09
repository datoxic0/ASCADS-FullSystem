/**
 * ASCADS Code Interpreters
 * Real language parsers/transpilers for Python and Arduino/C++
 * Execution via JS generator functions — each yield is one interpreter step
 */

export type StepResult =
  | { cmd: 'log';   level: 'info' | 'warn' | 'error' | 'success'; text: string }
  | { cmd: 'move';  x: number; y: number; z: number; speed?: number }
  | { cmd: 'joint'; id: string; angle: number }
  | { cmd: 'delay'; ms: number }
  | { cmd: 'io';    pin: string | number; value: number; mode?: 'digital' | 'pwm' | 'analog' }
  | { cmd: 'conveyor'; running: boolean }
  | { cmd: 'gripper';  active: boolean }
  | { cmd: 'done' }
  | { cmd: 'error'; message: string };

export type InterpreterGen = Generator<StepResult, void, void>;

/* ─── Shared robot/hardware API injected into both runtimes ─── */
const SHARED_API = `
function* _log(level, text) { yield { cmd:'log', level, text:String(text) }; }
function* print(...args)     { yield { cmd:'log', level:'info', text: args.map(String).join(' ') }; }
function* delay(ms)          { yield { cmd:'delay', ms:Math.max(0,+ms) }; }
function* sleep_ms(ms)       { yield { cmd:'delay', ms:Math.max(0,+ms) }; }
function* Serial_println(x)  { yield { cmd:'log', level:'info', text:'> ' + String(x) }; }
function* Serial_print(x)    { yield { cmd:'log', level:'info', text:String(x) }; }

const robot = {
  *move(x=0,y=0,z=0,speed=1000){ yield { cmd:'move',  x:+x,y:+y,z:+z, speed:+speed }; },
  *joint(id,angle)              { yield { cmd:'joint', id:String(id), angle:+angle }; },
  *home()                       { yield { cmd:'move',  x:0,y:0,z:0 }; },
};

function* digital_write(pin,val){ yield { cmd:'io', pin, value:val?1:0,  mode:'digital' }; }
function* analog_write(pin,val) { yield { cmd:'io', pin, value:+val,     mode:'pwm'     }; }
function* digitalWrite(pin,val) { yield { cmd:'io', pin, value:val?1:0,  mode:'digital' }; }
function* analogWrite(pin,val)  { yield { cmd:'io', pin, value:+val,     mode:'pwm'     }; }
function* gripper(active)       { yield { cmd:'gripper', active:!!active }; }
function* conveyor(run)         { yield { cmd:'conveyor', running:!!run }; }
function  digitalRead()         { return 0; }
function  analogRead()          { return 512; }
function  pinMode()             {}
function  millis()              { return Date.now(); }
function  micros()              { return Date.now()*1000; }
function  constrain(v,lo,hi)    { return Math.max(lo,Math.min(hi,v)); }
function  map(v,iL,iH,oL,oH)   { return (v-iL)*(oH-oL)/(iH-iL)+oL; }
function  abs(x)   { return Math.abs(x); }
function  min(a,b) { return Math.min(a,b); }
function  max(a,b) { return Math.max(a,b); }
function  sqrt(x)  { return Math.sqrt(x); }
function  pow(b,e) { return Math.pow(b,e); }
function  sin(x)   { return Math.sin(x); }
function  cos(x)   { return Math.cos(x); }
function  tan(x)   { return Math.tan(x); }
function  radians(d){ return d*Math.PI/180; }
function  degrees(r){ return r*180/Math.PI; }
const PI=Math.PI, TWO_PI=2*Math.PI, HALF_PI=Math.PI/2;
const HIGH=1,LOW=0,INPUT=0,OUTPUT=1,INPUT_PULLUP=2;
const math={
  sin:Math.sin,cos:Math.cos,tan:Math.tan,sqrt:Math.sqrt,pow:Math.pow,
  abs:Math.abs,floor:Math.floor,ceil:Math.ceil,round:Math.round,
  log:Math.log,log10:Math.log10,exp:Math.exp,
  pi:Math.PI, e:Math.E,
  degrees:(r)=>r*180/Math.PI, radians:(d)=>d*Math.PI/180,
  asin:Math.asin,acos:Math.acos,atan:Math.atan,atan2:Math.atan2,
  hypot:Math.hypot,sign:Math.sign,trunc:Math.trunc,
};
`;

/* ─── Python Compiler ─────────────────────────────────────────── */

export function compilePython(code: string): { gen?: () => InterpreterGen; error?: string } {
  try {
    const js = pyToJs(code);
    const src = `
${SHARED_API}
function _range(a,b,step){
  if(b===undefined){b=a;a=0;} if(step===undefined)step=1;
  const r=[]; for(let i=a;step>0?i<b:i>b;i+=step)r.push(i); return r;
}
function _len(x){return typeof x==='string'||Array.isArray(x)?x.length:0;}
function _int(x){return Math.trunc(+x);}
function _float(x){return parseFloat(String(x));}
function _str(x){return String(x);}
function _bool(x){return !!x;}
function _list(x){return Array.isArray(x)?x:[...x];}
function* _userProgram(){
${js}
  yield {cmd:'done'};
}
return _userProgram;
`;
    const factory = new Function(src)() as () => InterpreterGen;
    return { gen: factory };
  } catch (e: any) {
    return { error: `Python compile error: ${e.message ?? String(e)}` };
  }
}

/* Python → JS transpiler */
function pyToJs(code: string): string {
  const lines = code.split('\n');
  const out: string[] = [];
  const indentStack: number[] = [0];
  const declared = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trimStart();
    if (!trimmed) { out.push(''); continue; }
    if (trimmed.startsWith('#')) { out.push('// ' + trimmed.slice(1)); continue; }

    const lineIndent = raw.length - trimmed.length;

    // Close indented blocks
    while (indentStack.length > 1 && lineIndent < indentStack[indentStack.length - 1]) {
      indentStack.pop();
      out.push('}');
    }

    const jsLine = pyLineToJs(trimmed, declared);
    out.push(jsLine);

    if (isBlockOpener(trimmed)) {
      let nextIndent = lineIndent + 4;
      for (let j = i + 1; j < lines.length; j++) {
        const nl = lines[j];
        if (!nl.trim()) continue;
        nextIndent = nl.length - nl.trimStart().length;
        break;
      }
      indentStack.push(nextIndent);
    }
  }

  while (indentStack.length > 1) {
    indentStack.pop();
    out.push('}');
  }
  if (declared.size > 0) {
    out.unshift(`let ${Array.from(declared).join(', ')};`);
  }
  return out.join('\n');
}

function isBlockOpener(line: string): boolean {
  const s = line.replace(/#.*$/, '').trimEnd();
  return s.endsWith(':') && /^(if|elif|else|for|while|def|class|try|except|finally|with)\b/.test(s);
}

function pyLineToJs(line: string, vars: Set<string>): string {
  let code = line;
  const ci = pyCommentIdx(code);
  let trail = '';
  if (ci >= 0) { trail = ' //' + code.slice(ci + 1); code = code.slice(0, ci).trimEnd(); }
  if (!code.trim()) return trail.trim();

  // imports
  if (/^import\s+math/.test(code) || /^from\s+math\s+import/.test(code))
    return `/* ${code} — math already available */${trail}`;
  if (/^import\s+|^from\s+/.test(code)) return `// ${code}${trail}`;

  // simple keywords
  if (code === 'pass')     return `;${trail}`;
  if (code === 'break')    return `break;${trail}`;
  if (code === 'continue') return `continue;${trail}`;
  if (code === 'return')   return `return;${trail}`;
  if (/^return\s+/.test(code)) return `return ${pyExpr(code.slice(7))};${trail}`;

  // try / except / finally
  if (code === 'try:')               return `try {${trail}`;
  if (/^except/.test(code))          return `} catch (_pyErr) {${trail}`;
  if (code === 'finally:')           return `} finally {${trail}`;

  // else
  if (code === 'else:') return `} else {${trail}`;

  // if / elif
  const ifM   = code.match(/^if\s+(.+):$/);   if (ifM)   return `if (${pyExpr(ifM[1])}) {${trail}`;
  const elifM = code.match(/^elif\s+(.+):$/); if (elifM) return `} else if (${pyExpr(elifM[1])}) {${trail}`;

  // for ... in range(...)
  const forRangeM = code.match(/^for\s+(\w+)\s+in\s+range\((.+)\):$/);
  if (forRangeM) {
    const [, v, args] = forRangeM;
    const parts = splitArgs(args);
    vars.add(v);
    if (parts.length === 1)
      return `for (${v}=0; ${v}<${pyExpr(parts[0])}; ${v}++) {${trail}`;
    if (parts.length === 2)
      return `for (${v}=${pyExpr(parts[0])}; ${v}<${pyExpr(parts[1])}; ${v}++) {${trail}`;
    const [a, b, s] = parts;
    return `for (${v}=${pyExpr(a)}; +${pyExpr(s)}>0?${v}<${pyExpr(b)}:${v}>${pyExpr(b)}; ${v}+=${pyExpr(s)}) {${trail}`;
  }
  // for ... in list/tuple
  const forInM = code.match(/^for\s+(\w+)\s+in\s+(.+):$/);
  if (forInM) {
    const [, v, it] = forInM;
    vars.add(v);
    return `for (${v} of ${pyExpr(it)}) {${trail}`;
  }

  // while
  const whileM = code.match(/^while\s+(.+):$/);
  if (whileM) {
    const c = whileM[1].trim();
    return `while (${c==='True'||c==='1'?'true':pyExpr(c)}) {${trail}`;
  }

  // def
  const defM = code.match(/^def\s+(\w+)\s*\(([^)]*)\)\s*:$/);
  if (defM) return `function* ${defM[1]}(${defM[2].trim()}) {${trail}`;

  // class
  const classM = code.match(/^class\s+(\w+)(?:\([^)]*\))?\s*:$/);
  if (classM) return `class ${classM[1]} {${trail}`;

  // print → yield* print(...)
  const printM = code.match(/^print\s*\((.+)\)$/s);
  if (printM) return `yield* print(${pyExpr(printM[1])});${trail}`;
  if (/^print\s*\(\s*\)$/.test(code)) return `yield* print('');${trail}`;

  // delay / sleep_ms
  const delayM = code.match(/^(?:delay|sleep_ms)\s*\((.+)\)$/);
  if (delayM) return `yield* delay(${pyExpr(delayM[1])});${trail}`;

  // robot API
  if (/^robot\.move\s*\(/.test(code))  return `yield* robot.move(${pyExpr(code.replace(/^robot\.move\s*\(/, '').replace(/\)$/, ''))});${trail}`;
  if (/^robot\.joint\s*\(/.test(code)) return `yield* robot.joint(${pyExpr(code.replace(/^robot\.joint\s*\(/, '').replace(/\)$/, ''))});${trail}`;
  if (/^robot\.home\s*\(\s*\)$/.test(code)) return `yield* robot.home();${trail}`;

  // GPIO
  const dwM = code.match(/^digital_write\s*\((.+)\)$/);
  if (dwM) return `yield* digital_write(${pyExpr(dwM[1])});${trail}`;
  const awM = code.match(/^analog_write\s*\((.+)\)$/);
  if (awM) return `yield* analog_write(${pyExpr(awM[1])});${trail}`;

  // gripper / conveyor helpers
  const grM = code.match(/^gripper\s*\((.+)\)$/);
  if (grM) return `yield* gripper(${pyExpr(grM[1])});${trail}`;
  const cvM = code.match(/^conveyor\s*\((.+)\)$/);
  if (cvM) return `yield* conveyor(${pyExpr(cvM[1])});${trail}`;

  // augmented assignment
  const augM = code.match(/^([a-zA-Z_]\w*(?:\[.*\])*)\s*(\+=|-=|\*=|\/=|%=|\/\/=|\*\*=)\s*(.+)$/);
  if (augM) {
    const [, v, op, val] = augM;
    if (op === '**=') return `${v} = Math.pow(${v}, ${pyExpr(val)});${trail}`;
    if (op === '//=') return `${v} = Math.floor(${v} / ${pyExpr(val)});${trail}`;
    return `${v} ${op} ${pyExpr(val)};${trail}`;
  }

  // simple assignment
  const assignM = code.match(/^([a-zA-Z_]\w*(?:\[.*\])?)\s*=\s*(.+)$/);
  if (assignM && !/^(if|while|for|elif)\s/.test(code)) {
    const [, v, val] = assignM;
    if (/^[a-zA-Z_]\w*$/.test(v) && !['self', 'robot', 'math'].includes(v)) {
      vars.add(v);
    }
    return `${v} = ${pyExpr(val)};${trail}`;
  }

  // yield pass-through
  if (/^yield\s+/.test(code)) return `yield ${pyExpr(code.slice(6))};${trail}`;
  if (/^yield\*\s+/.test(code)) return `yield* ${pyExpr(code.slice(7))};${trail}`;

  // standalone expression / call
  return `${pyExpr(code)};${trail}`;
}

function pyExpr(e: string): string {
  e = e.trim();
  // Boolean / None
  e = e.replace(/\bTrue\b/g, 'true').replace(/\bFalse\b/g, 'false').replace(/\bNone\b/g, 'null');
  // Logical operators
  e = e.replace(/\band\b/g, '&&').replace(/\bor\b/g, '||').replace(/\bnot\s+/g, '!');
  // Exponentiation / integer division
  e = e.replace(/\*\*/g, '**').replace(/\/\//g, (m, ofs, src) => {
    // Only replace // that's not inside a string — simplistic but ok
    return '/ /* floor */ ';
  });
  // math module
  e = e.replace(/\bmath\.(sin|cos|tan|asin|acos|atan2?|sqrt|pow|abs|floor|ceil|round|log(?:10)?|exp|hypot|sign|trunc)\b/g,
    (_, f) => `Math.${f}`);
  e = e.replace(/\bmath\.pi\b/g, 'Math.PI').replace(/\bmath\.e\b/g, 'Math.E')
    .replace(/\bmath\.degrees\b/g, 'degrees').replace(/\bmath\.radians\b/g, 'radians');
  // Built-ins
  e = e.replace(/\blen\s*\(/g, '_len(').replace(/\brange\s*\(/g, '_range(')
    .replace(/\bint\s*\(/g, '_int(').replace(/\bfloat\s*\(/g, '_float(')
    .replace(/\bstr\s*\(/g, '_str(').replace(/\bbool\s*\(/g, '_bool(')
    .replace(/\blist\s*\(/g, '_list(').replace(/\babs\s*\(/g, 'Math.abs(')
    .replace(/\bmin\s*\(/g, 'Math.min(').replace(/\bmax\s*\(/g, 'Math.max(')
    .replace(/\bround\s*\(/g, 'Math.round(').replace(/\bprint\s*\(/g, 'print(');
  // f-strings
  e = e.replace(/f"([^"]*)"/g, (_, t) => '`' + t.replace(/\{([^}]+)\}/g, '${$1}') + '`');
  e = e.replace(/f'([^']*)'/g, (_, t) => '`' + t.replace(/\{([^}]+)\}/g, '${$1}') + '`');
  return e;
}

function pyCommentIdx(line: string): number {
  let inStr = false; let q = '';
  for (let i = 0; i < line.length; i++) {
    if (inStr) { if (line[i] === q && line[i-1] !== '\\') inStr = false; }
    else if (line[i] === '"' || line[i] === "'") { inStr = true; q = line[i]; }
    else if (line[i] === '#') return i;
  }
  return -1;
}

function splitArgs(args: string): string[] {
  const res: string[] = []; let depth = 0; let cur = '';
  for (const c of args) {
    if ('([{'.includes(c)) depth++;
    else if (')]}'.includes(c)) depth--;
    else if (c === ',' && depth === 0) { res.push(cur.trim()); cur = ''; continue; }
    cur += c;
  }
  if (cur.trim()) res.push(cur.trim());
  return res;
}

/* ─── Arduino / C++ Compiler ─────────────────────────────────── */

export function compileArduino(code: string): { gen?: () => InterpreterGen; error?: string } {
  try {
    const js = arduinoToJs(code);
    const src = `
${SHARED_API}
${js}
function* _userProgram(){
  if(typeof setup==='function') yield* setup();
  let _lc=0;
  while(_lc++<99999){
    if(typeof loop==='function') yield* loop();
    yield {cmd:'delay',ms:50};
  }
  yield {cmd:'done'};
}
return _userProgram;
`;
    const factory = new Function(src)() as () => InterpreterGen;
    return { gen: factory };
  } catch (e: any) {
    return { error: `Arduino compile error: ${e.message ?? String(e)}` };
  }
}

function arduinoToJs(src: string): string {
  // #include → comment
  src = src.replace(/^#include\s+.*/gm, '// $&');
  // #define NAME VALUE → const NAME = VALUE;
  src = src.replace(/^#define\s+(\w+)\s+(.+)$/gm, 'const $1 = $2;');
  // #define NAME (no value)
  src = src.replace(/^#define\s+(\w+)\s*$/gm, 'const $1 = 1;');

  // Function declarations: type funcName(...) → function* funcName(...)
  // Match: void/int/float/etc followed by name and parens
  src = src.replace(
    /\b(?:void|int|float|double|long|unsigned|byte|bool|boolean|char|String|uint8_t|uint16_t|uint32_t|int8_t|int16_t|int32_t)\s+(\w+)\s*\(([^)]*)\)\s*\{/g,
    'function* $1($2) {'
  );

  // Variable declarations (not in function sigs)
  const typePattern = /\b(?:int|float|double|long|unsigned|byte|bool|boolean|char|uint8_t|uint16_t|uint32_t|int8_t|int16_t|int32_t)\s+(\w+)(?=\s*[=;,\[])/g;
  src = src.replace(typePattern, 'let $1');
  src = src.replace(/\bString\s+(\w+)(?=\s*[=;,\[])/g, 'let $1');
  // const type declarations
  src = src.replace(/\bconst\s+(?:int|float|double|long|byte|bool|char|String|uint8_t)\s+(\w+)/g, 'const $1');

  // Serial API → generator yields
  src = src.replace(/\bSerial\.begin\s*\([^)]*\)\s*;/g, '');
  src = src.replace(/\bSerial\.println\s*\(/g, 'yield* Serial_println(');
  src = src.replace(/\bSerial\.print\s*\(/g,   'yield* Serial_print(');
  src = src.replace(/\bSerial\.flush\s*\([^)]*\)\s*;/g, '');

  // Motion API → generator yields
  src = src.replace(/\brobot\.move\s*\(/g,  'yield* robot.move(');
  src = src.replace(/\brobot\.joint\s*\(/, 'yield* robot.joint(');
  src = src.replace(/\brobot\.home\s*\(\s*\)/g, 'yield* robot.home()');

  // GPIO API → generator yields
  src = src.replace(/\bdigitalWrite\s*\(/g, 'yield* digitalWrite(');
  src = src.replace(/\banalogWrite\s*\(/g,  'yield* analogWrite(');
  src = src.replace(/\bdelay\s*\(/g,        'yield* delay(');
  src = src.replace(/\bgripper\s*\(/g,      'yield* gripper(');
  src = src.replace(/\bconveyor\s*\(/g,     'yield* conveyor(');

  // C-style casts
  src = src.replace(/\(int\)\s*/g,   'Math.trunc(');
  src = src.replace(/\(float\)\s*/g, 'parseFloat(String(');
  // Fix unmatched parens from cast conversion (approximate)
  // This is a known limitation of text-substitution compiling

  // String concatenation: "text" + intVar → "text" + String(intVar) handled by JS naturally

  return src;
}

/* ─── Starter programs ───────────────────────────────────────── */

export const PYTHON_STARTER = `# ASCADS Python — Robot Controller
# API: robot.move(x,y,z), robot.joint(id, angle), robot.home()
#      digital_write(pin, val), analog_write(pin, val)
#      gripper(True/False), conveyor(True/False), delay(ms), print(msg)

import math

SPEED   = 1000   # movement speed (sim units)
CYCLES  = 4

print("System initialising...")
robot.home()
delay(400)
conveyor(True)
print("Conveyor started. Beginning pick-and-place sequence.")

for cycle in range(CYCLES):
    print(f"Cycle {cycle + 1} / {CYCLES}")

    # Wait and pick
    delay(600)
    robot.move(120, 0, -30, SPEED)
    delay(200)
    gripper(True)
    delay(150)

    # Lift
    robot.move(120, 0, 60, SPEED)
    delay(200)

    # Place
    robot.move(-80, 0, -20, SPEED)
    delay(200)
    gripper(False)
    delay(150)

    # Home
    robot.home()
    delay(300)

conveyor(False)
print("Run complete — all cycles finished.")
`;

export const ARDUINO_STARTER = `// ASCADS Arduino — Robot Controller
// API: robot.move(x,y,z), robot.joint(id, angle), robot.home()
//      digitalWrite(pin, val), analogWrite(pin, val)
//      gripper(active), conveyor(run), delay(ms), Serial.println(msg)

#include <Robot.h>

const int LED_PIN   = 13;
const int SPEED     = 1000;
int       cycleCount = 0;

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  Serial.println("ASCADS Robot online.");
  robot.home();
  delay(500);
  conveyor(true);
  Serial.println("Conveyor started.");
}

void loop() {
  cycleCount++;
  Serial.println("Cycle: " + String(cycleCount));

  digitalWrite(LED_PIN, HIGH);
  delay(600);

  // Pick
  robot.move(120, 0, -30);
  delay(200);
  gripper(true);
  delay(150);

  // Lift and place
  robot.move(120, 0, 60);
  delay(200);
  robot.move(-80, 0, -20);
  delay(200);
  gripper(false);
  delay(150);

  // Return home
  robot.home();
  digitalWrite(LED_PIN, LOW);
  delay(300);

  if (cycleCount >= 4) {
    conveyor(false);
    Serial.println("Production run complete.");
    while (1) { delay(1000); }
  }
}
`;

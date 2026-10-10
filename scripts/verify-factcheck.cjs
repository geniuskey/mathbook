// Run: node scripts/verify-factcheck.cjs
// Regressions for MATH-14; evaluates the chapter's actual FFT/optics calculation.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const common = fs.readFileSync(path.join(root, 'js/common.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'chapters/fourier.html'), 'utf8');
const context = vm.createContext({ MB: { stat() {} } });
for (const name of ['fft', 'fft2', 'fftshift']) {
  const source = common.match(new RegExp(`MB\\.${name} = function[\\s\\S]*?\\n  };`));
  assert.ok(source, name);
  vm.runInContext(source[0], context);
}
const section = html.slice(html.indexOf('/* ---------------------------------------------------------------- 7. 동공'));
const calculation = section.slice(section.indexOf('  const N ='), section.indexOf('  compute();'));
vm.runInContext(`${calculation}\nglobalThis.optics = (s, e, w) => { shape=s; eps=e; W20=w; compute(); return {otf, mtf, strehl}; };`, context);
function direct(s, e, w, shift) {
  const R = 12;
  let norm = 0, real = 0, imag = 0;
  function pupil(x, y) {
    const rho = Math.hypot(x, y) / R;
    const inside = s === 'square' ? Math.abs(x) < R && Math.abs(y) < R : rho < 1 && (s !== 'annulus' || rho >= e);
    return inside ? 2 * Math.PI * w * rho * rho : null;
  }
  for (let y = -R; y <= R; y++) for (let x = -R; x <= R; x++) {
    const a = pupil(x, y), b = pupil(x + shift, y);
    if (a !== null) norm++;
    if (a !== null && b !== null) { real += Math.cos(a - b); imag += Math.sin(a - b); }
  }
  return { real: real / norm, magnitude: Math.hypot(real, imag) / norm };
}
let cases = 0, maxError = 0;
for (const shape of ['circle', 'square', 'annulus']) for (const eps of shape === 'annulus' ? [0, 0.4, 0.8] : [0.4]) for (const w of [0, 0.25, 0.5, 1, 2]) {
  const result = context.optics(shape, eps, w);
  assert.ok(Math.abs(result.mtf[0][1] - 1) < 1e-12);
  for (let k = 0; k < result.mtf.length; k++) {
    const value = result.mtf[k][1], reference = direct(shape, eps, w, k);
    assert.ok(value >= 0 && value <= 1 + 1e-12 && Number.isFinite(value));
    maxError = Math.max(maxError, Math.abs(value - reference.magnitude));
    assert.ok(Math.abs(value - reference.magnitude) < 1e-11);
    assert.ok(Math.abs(result.otf[k][1] - reference.real) < 1e-11);
    cases++;
  }
}
const inversion = context.optics('circle', 0.4, 1);
assert.ok(inversion.otf[7][1] < 0);
assert.ok(inversion.mtf[7][1] > 0);
assert.ok(html.includes('data: otf') && html.includes('data: mtf'));
assert.ok(html.includes('Math.hypot(or[k], oi[k]) / or[0]'));
// MATH-01/32: distinguish detection from automatic single-error correction.
const info = fs.readFileSync(path.join(root, 'chapters/information.html'), 'utf8');
const coding = info.slice(info.indexOf('  const enc = (d)'), info.indexOf('  const hit = [];', info.indexOf('  const enc = (d)')));
const hm = vm.createContext({});
vm.runInContext(`let data=[], err=[]; ${coding}\nglobalThis.decode=(d,e)=>{ data=d; err=e; return state(); };`, hm);
let hammingCases = 0;
for (let word = 0; word < 16; word++) {
  const data = Array.from({length:4}, (_, i) => (word >> i) & 1);
  for (let a = 0; a < 7; a++) {
    let errors = Array(7).fill(0); errors[a] = 1;
    assert.ok(hm.decode(data, errors).ok); hammingCases++;
    for (let b = a + 1; b < 7; b++) {
      errors = Array(7).fill(0); errors[a] = errors[b] = 1;
      const st = hm.decode(data, errors);
      assert.notEqual(st.syn, 0); assert.equal(st.resid, 3); hammingCases++;
    }
  }
  assert.equal(hm.decode(data, [1,1,1,0,0,0,0]).syn, 0);
}
// MATH-12: use the actual SIR run to verify initial-only vs internal peak.
const rk = common.match(/MB\.rk4 = function[\s\S]*?\n  };/);
vm.runInContext(rk[0], context);
const ode = fs.readFileSync(path.join(root, 'chapters/ode.html'), 'utf8');
const sirSection = ode.slice(ode.indexOf('/* ============================================================ 6. SIR */'));
const sirCalc = sirSection.slice(sirSection.indexOf('  let R0 ='), sirSection.indexOf('  run();'));
vm.runInContext(`${sirCalc}\nglobalThis.sir=(v)=>{p=v; run();return sol;};`, context);
for (const vaccination of [0, 0.8]) {
  const sol = context.sir(vaccination);
  const start = sol[0][1], end = sol.at(-1)[1];
  let peak = sol[0]; for (const row of sol) if (row[1][1] > peak[1][1]) peak = row;
  if (vaccination === 0.8) assert.equal(peak[0], 0);
  else { assert.ok(peak[0] > 0); const index = sol.indexOf(peak); assert.ok(sol[index-1][1][0] > 1/2.5 && sol[index+1][1][0] < 1/2.5); }
  assert.ok(Math.abs(end[0] - start[0]*Math.exp(-2.5*(end[2]-start[2]))) < 1e-7);
}
// MATH-10/11: the original repeated-root branch already uses the needed polynomial.
const complex = fs.readFileSync(path.join(root, 'chapters/complex.html'), 'utf8');
const xs = complex.slice(complex.indexOf('  function x(t, R) {'), complex.indexOf('  function stats() {', complex.indexOf('  function x(t, R) {')));
vm.runInContext(xs, context);
for (const t of [0, 0.2, 1, 3]) assert.ok(Math.abs(context.x(t, {type:'real', r1:-1, r2:-1}) - (1+t)*Math.exp(-t)) < 1e-14);
// MATH-24: a singular design chooses one solution, not a mathematically unique one.
const optim = fs.readFileSync(path.join(root, 'chapters/optimization.html'), 'utf8');
const ls = optim.slice(optim.indexOf('  function solveL2(P, w) {'), optim.indexOf('  function solve(P) {'));
vm.runInContext(ls, context);
const fit = context.solveL2([{x:0,y:1},{x:0,y:3}]);
assert.equal(fit.m, 0); assert.equal(fit.b, 2);
// Check edited inline scripts for syntax without executing DOM code.
let inline = 0;
for (const file of fs.readdirSync(path.join(root, 'chapters'))) {
  if (!file.endsWith('.html')) continue;
  const source = fs.readFileSync(path.join(root, 'chapters', file), 'utf8');
  for (const match of source.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
    if (/application\/ld\+json/.test(match[1])) { JSON.parse(match[2]); continue; }
    if (!match[2].trim()) continue;
    new vm.Script(match[2], { filename: file });
    inline++;
  }
}
console.log(JSON.stringify({ frequencyCases: cases, maxError, signedOtf: inversion.otf[7][1], mtf: inversion.mtf[7][1], hammingCases, sirCases: 2, repeatedRootCases: 4, singularLeastSquaresCases: 1, inlineScripts: inline }));

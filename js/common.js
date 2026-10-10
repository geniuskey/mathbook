/* ==========================================================================
   MathBook 공통 스크립트 — 전역 객체 MB
   - 레이아웃(상단바, 검색, 목차, 이전/다음, 테마, 소리 켜기/끄기) 자동 생성
   - 시뮬레이터 헬퍼: canvas, chart, plane(드래그 가능한 좌표 평면), range, seg, check, 포맷/난수
   - 수학: 복소수(MB.cx), 행렬·고유값·SVD(MB.mat), ODE(MB.rk4), FFT/2D FFT, 통계 분포
   - 그림: 시험 이미지(MB.testImage), 흑백/색 지도 그리기(MB.drawGray, MB.colormap)
   - 소리(선택): MB.tone, MB.playBuffer — 푸리에·샘플링 장에서 들려 주기용
   이 파일은 <head>에서 defer 없이 로드된다. 페이지 스크립트는 </body> 직전에 둔다.
   ========================================================================== */
(function () {
  "use strict";

  const CHAPTERS = [
    { slug: "limits",       num: "01", title: "무한을 길들이기",            desc: "제논의 역설에서 급수·적분까지. 계산기의 sin 버튼은 왜 동작하며, e와 π는 왜 어디에나 나오는가.", tags: ["극한", "sim"] },
    { slug: "complex",      num: "02", title: "복소수는 회전이다",          desc: "허수가 아니라 회전 연산자. 교류 회로의 페이저, 임피던스, 반사 방지 코팅의 박막 간섭.", tags: ["복소수", "sim"] },
    { slug: "linalg",       num: "03", title: "행렬은 변환이다",            desc: "행렬 = 공간을 휘는 기계. 색 보정 행렬(CCM), 고유값 = 공진 모드, SVD = 이미지 압축.", tags: ["선형대수", "sim"] },
    { slug: "ode",          num: "04", title: "변화율로 세상을 쓰다",        desc: "RC 회로, 칩의 열, 감염병이 같은 식이다. 1차·2차 미분방정식, 공진, 열확산 방정식.", tags: ["미분방정식", "sim"] },
    { slug: "fourier",      num: "05", title: "모든 것은 주파수의 합",       desc: "MRI가 몸속을 보는 방법. 푸리에 급수와 변환, 렌즈는 푸리에 변환기, MTF, JPEG.", tags: ["푸리에", "sim"] },
    { slug: "sampling",     num: "06", title: "연속을 격자로 자르기",        desc: "나이퀴스트–섀넌 표본화 정리, 에일리어싱과 모아레, 양자화. 연속 세계를 디지털로 옮길 때 생기는 일.", tags: ["샘플링", "sim"] },
    { slug: "probability",  num: "07", title: "잡음과 산포의 수학",          desc: "포아송 분포 = 샷 노이즈, 중심극한정리 = 공정 산포가 정규분포인 이유, 베이즈 = 불량 판정.", tags: ["확률·통계", "sim"] },
    { slug: "information",  num: "08", title: "놀라움을 재는 법",            desc: "QR 코드가 찢겨도 읽히는 이유. 엔트로피, 압축의 한계, 채널 용량, 해밍 부호와 리드–솔로몬.", tags: ["정보 이론", "sim"] },
    { slug: "optimization", num: "09", title: "가장 낮은 곳 찾기",           desc: "신경망 학습은 지형 위 공 굴리기. 경사 하강법, 학습률, 볼록성, 라그랑주 승수 = 제약의 가격.", tags: ["최적화", "sim"] },
    { slug: "numerics",     num: "10", title: "컴퓨터는 어떻게 틀리는가",     desc: "0.1 + 0.2 ≠ 0.3의 이유. 부동소수점, 상쇄 오차, 유한 차분, 안정성 조건, FDTD·RCWA의 원리.", tags: ["수치 해석", "sim"] },
    { slug: "geometry",     num: "11", title: "모양과 공간의 수학",          desc: "도넛과 머그컵, 곡률 = 지도를 평평하게 못 펴는 이유, 사영기하와 원근, 렌즈 수차.", tags: ["기하·위상", "sim"] },
    { slug: "symmetry",     num: "12", title: "대칭의 대수",                desc: "군론으로 보는 결정 구조, 벽지 무늬 17종, 루빅스 큐브. 대칭이 보존 법칙과 선택 규칙을 만든다.", tags: ["군론", "sim"] },
    { slug: "glossary",     num: "13", title: "도구 지도 · 용어집 · 종합 퀴즈", desc: "시리즈의 다른 책에서 어떤 수학을 쓰는지 한눈에. 용어를 검색하고 실력을 점검하자.", tags: ["정리"] },
  ];

  const MB = (window.MB = {});
  MB.CHAPTERS = CHAPTERS;


  /* ------------------------------------------------------------ math utils */
  MB.clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  MB.lerp = (a, b, t) => a + (b - a) * t;
  MB.map = (x, a, b, c, d) => c + ((x - a) * (d - c)) / (b - a);
  MB.smooth = (a, b, x) => { const t = MB.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  MB.randn = function () {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  MB.poisson = function (lambda) {
    if (lambda <= 0) return 0;
    if (lambda > 40) return Math.max(0, Math.round(lambda + Math.sqrt(lambda) * MB.randn()));
    const L = Math.exp(-lambda);
    let k = 0, p = 1;
    do { k++; p *= Math.random(); } while (p > L);
    return k - 1;
  };
  /** 시드 고정 난수 (장면 텍스처가 매번 같게) */
  MB.rng = function (seed = 1) {
    let s = seed >>> 0 || 1;
    const r = () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
    r.range = (a, b) => a + (b - a) * r();
    r.pick = (arr) => arr[Math.floor(r() * arr.length)];
    return r;
  };
  /** 숫자 포맷: 유효 자리 */
  MB.fmt = function (x, digits = 3) {
    if (!isFinite(x)) return "—";
    if (x === 0) return "0";
    const a = Math.abs(x);
    if (a >= 1e6 || a < 1e-3) return x.toExponential(digits - 1).replace("e+", "e");
    return Number(x.toPrecision(digits)).toLocaleString("en-US", { maximumFractionDigits: 6 });
  };
  /** 부호 포함 (±) 포맷 */
  MB.signed = (x, d = 1) => (x > 0.0001 ? "+" : x < -0.0001 ? "−" : "±") + Math.abs(x).toFixed(d);

  /* ------------------------------------------------------------ theme */
  const themeCbs = [];
  MB.onTheme = (cb) => themeCbs.push(cb);
  MB.isDark = function () {
    const t = document.documentElement.getAttribute("data-theme");
    if (t) return t === "dark";
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  };
  MB.color = function (name) {
    return getComputedStyle(document.documentElement).getPropertyValue("--" + name).trim();
  };
  MB.palette = function () {
    const c = MB.color;
    return {
      bg: c("canvas-bg"), text: c("text"), dim: c("text-dim"), faint: c("text-faint"),
      grid: c("grid"), axis: c("axis"), border: c("border"), surface: c("surface"), elev: c("bg-elev"),
      accent: c("accent"), accent2: c("accent-2"), ok: c("ok"), warn: c("warn"), bad: c("bad"),
      red: c("red"), green: c("green"), blue: c("blue"),
      series: [c("accent"), c("accent-2"), c("warn"), c("ok"), c("bad"), c("text-dim")],
    };
  };
  function applyTheme(t) {
    if (t) document.documentElement.setAttribute("data-theme", t);
    else document.documentElement.removeAttribute("data-theme");
    themeCbs.forEach((cb) => { try { cb(); } catch (e) { console.error(e); } });
  }
  try { const saved = localStorage.getItem("mk-theme"); if (saved) document.documentElement.setAttribute("data-theme", saved); } catch (e) {}
  if (window.matchMedia) {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", () => {
      if (!document.documentElement.getAttribute("data-theme")) applyTheme(null);
    });
  }

  /* ------------------------------------------------------------ canvas helper */
  /**
   * HiDPI 캔버스. 폭은 부모 폭을 따르고 높이는 aspect(높이/폭) 또는 height(px)로 결정.
   *   const cv = MB.canvas(el, (ctx,w,h)=>{...}, {aspect:0.5, maxHeight: 420});  aspect는 폭→비율 함수도 가능
   */
  MB.canvas = function (canvas, draw, opts = {}) {
    if (typeof canvas === "string") canvas = document.querySelector(canvas);
    const ctx = canvas.getContext("2d");
    const st = { ctx, w: 0, h: 0, canvas, dpr: 1 };
    function resize() {
      const parent = canvas.parentElement;
      const w = Math.max(200, Math.floor(opts.width || parent.clientWidth || 600));
      let h = opts.height || Math.round(w * (typeof opts.aspect === "function" ? opts.aspect(w) : opts.aspect || 0.5));
      if (opts.minHeight) h = Math.max(h, opts.minHeight);
      if (opts.maxHeight) h = Math.min(h, opts.maxHeight);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      st.w = w; st.h = h; st.dpr = dpr;
      st.redraw();
    }
    st.redraw = function () {
      if (!st.w) return;
      ctx.save();
      ctx.setTransform(st.dpr, 0, 0, st.dpr, 0, 0);
      if (!opts.noClear) {
        ctx.clearRect(0, 0, st.w, st.h);
        ctx.fillStyle = MB.color("canvas-bg");
        ctx.fillRect(0, 0, st.w, st.h);
      }
      try { draw && draw(ctx, st.w, st.h); } finally { ctx.restore(); }
    };
    st.resize = resize;
    if (window.ResizeObserver) {
      let lastW = -1;
      new ResizeObserver(() => { const w = canvas.parentElement.clientWidth; if (w !== lastW) { lastW = w; resize(); } }).observe(canvas.parentElement);
    } else window.addEventListener("resize", resize);
    MB.onTheme(() => st.redraw());
    resize();
    return st;
  };

  /** 화면에 보일 때만 도는 애니메이션 루프. fn(dt초, t초) */
  MB.loop = function (el, fn) {
    let raf = 0, last = 0, t = 0, visible = true, running = true;
    function frame(ts) {
      raf = 0;
      if (!running || !visible) return;
      const dt = last ? Math.min(0.05, (ts - last) / 1000) : 0.016;
      last = ts; t += dt;
      fn(dt, t);
      raf = requestAnimationFrame(frame);
    }
    function kick() { if (!raf && running && visible) { last = 0; raf = requestAnimationFrame(frame); } }
    if (window.IntersectionObserver && el) {
      new IntersectionObserver((es) => { visible = es[0].isIntersecting; kick(); }).observe(el);
    }
    kick();
    return {
      start() { running = true; kick(); },
      stop() { running = false; },
      get running() { return running; },
      toggle() { running ? (running = false) : ((running = true), kick()); return running; },
    };
  };

  /** 다음 프레임에 한 번만 실행 (슬라이더 입력 폭주 방지) */
  MB.throttle = function (fn) {
    let pending = false;
    return function () {
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => { pending = false; fn(); });
    };
  };

  /* ------------------------------------------------------------ chart helper */
  /**
   * 간단한 선 그래프. box = {x,y,w,h}(생략 시 캔버스 전체에 여백 자동)
   * opts: { x:[min,max], y:[min,max], logX, logY, xLabel, yLabel, xTicks, yTicks,
   *         xFmt, yFmt, series:[{data:[[x,y],...], color, width, dash, fill}],
   *         vlines:[{x,color,label,dash}], hlines:[{y,color,label,dash}], points:[{x,y,color,r,label}],
   *         bands:[{x0,x1,color}] }
   */
  MB.chart = function (ctx, box, opts) {
    const P = MB.palette();
    const dpr = (ctx.getTransform && ctx.getTransform().a) || 1;
    const W = ctx.canvas.width / dpr, H = ctx.canvas.height / dpr;
    if (!box) box = { x: 58, y: 16, w: W - 58 - 18, h: H - 16 - 46 };
    const [x0, x1] = opts.x, [y0, y1] = opts.y;
    const lx = (v) => (opts.logX ? Math.log10(v) : v);
    const ly = (v) => (opts.logY ? Math.log10(v) : v);
    const X = (v) => box.x + ((lx(v) - lx(x0)) / (lx(x1) - lx(x0))) * box.w;
    const Y = (v) => box.y + box.h - ((ly(v) - ly(y0)) / (ly(y1) - ly(y0))) * box.h;
    const ticks = (a, b, log, n) => {
      if (log) { const out = []; for (let e = Math.ceil(Math.log10(a) - 1e-9); e <= Math.log10(b) + 1e-9; e++) out.push(Math.pow(10, e)); return out; }
      const span = b - a, raw = span / (n || 5), mag = Math.pow(10, Math.floor(Math.log10(raw)));
      const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => span / s <= (n || 5) + 0.5) || raw;
      const out = []; for (let v = Math.ceil(a / step - 1e-9) * step; v <= b + step * 1e-6; v += step) out.push(Math.abs(v) < step * 1e-9 ? 0 : v);
      return out;
    };
    const defFmt = (v) => (Math.abs(v) >= 1e5 || (Math.abs(v) < 1e-2 && v !== 0) ? v.toExponential(0).replace("e+", "e") : String(Number(v.toPrecision(4))));
    const xFmt = opts.xFmt || defFmt, yFmt = opts.yFmt || defFmt;
    ctx.save();
    ctx.font = "11px " + getComputedStyle(document.body).getPropertyValue("--mono");
    ctx.lineWidth = 1;
    (opts.bands || []).forEach((b) => { ctx.fillStyle = b.color; ctx.fillRect(X(b.x0), box.y, X(b.x1) - X(b.x0), box.h); });
    const xt = opts.xTicks || ticks(x0, x1, opts.logX, 6);
    const yt = opts.yTicks || ticks(y0, y1, opts.logY, 5);
    ctx.strokeStyle = P.grid; ctx.fillStyle = P.dim;
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    xt.forEach((v) => { const px = X(v); if (px < box.x - 1 || px > box.x + box.w + 1) return; ctx.beginPath(); ctx.moveTo(px, box.y); ctx.lineTo(px, box.y + box.h); ctx.stroke(); ctx.fillText(xFmt(v), px, box.y + box.h + 6); });
    ctx.textAlign = "right"; ctx.textBaseline = "middle";
    yt.forEach((v) => { const py = Y(v); if (py < box.y - 1 || py > box.y + box.h + 1) return; ctx.beginPath(); ctx.moveTo(box.x, py); ctx.lineTo(box.x + box.w, py); ctx.stroke(); ctx.fillText(yFmt(v), box.x - 6, py); });
    ctx.strokeStyle = P.axis;
    ctx.beginPath(); ctx.moveTo(box.x, box.y); ctx.lineTo(box.x, box.y + box.h); ctx.lineTo(box.x + box.w, box.y + box.h); ctx.stroke();
    ctx.fillStyle = P.dim; ctx.font = "12px " + getComputedStyle(document.body).getPropertyValue("--font");
    if (opts.xLabel) { ctx.textAlign = "center"; ctx.textBaseline = "bottom"; ctx.fillText(opts.xLabel, box.x + box.w / 2, box.y + box.h + 40); }
    if (opts.yLabel) { ctx.save(); ctx.translate(14, box.y + box.h / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(opts.yLabel, 0, 0); ctx.restore(); }
    ctx.save(); ctx.beginPath(); ctx.rect(box.x, box.y - 2, box.w + 2, box.h + 4); ctx.clip();
    (opts.series || []).forEach((s, i) => {
      if (!s.data || !s.data.length) return;
      ctx.strokeStyle = s.color || P.series[i % P.series.length];
      ctx.lineWidth = s.width || 2; ctx.setLineDash(s.dash || []);
      ctx.beginPath();
      let started = false;
      s.data.forEach(([x, y]) => { if (!isFinite(y) || (opts.logY && y <= 0) || (opts.logX && x <= 0)) { started = false; return; } const px = X(x), py = Y(y); started ? ctx.lineTo(px, py) : ctx.moveTo(px, py); started = true; });
      ctx.stroke();
      if (s.fill) {
        ctx.lineTo(X(s.data[s.data.length - 1][0]), Y(opts.logY ? y0 : Math.max(y0, 0)));
        ctx.lineTo(X(s.data[0][0]), Y(opts.logY ? y0 : Math.max(y0, 0)));
        ctx.closePath(); ctx.fillStyle = s.fill; ctx.fill();
      }
      ctx.setLineDash([]);
    });
    (opts.vlines || []).forEach((l) => { ctx.strokeStyle = l.color || P.faint; ctx.setLineDash(l.dash || [4, 4]); ctx.lineWidth = l.width || 1.2; ctx.beginPath(); ctx.moveTo(X(l.x), box.y); ctx.lineTo(X(l.x), box.y + box.h); ctx.stroke(); ctx.setLineDash([]); if (l.label) { ctx.fillStyle = l.color || P.dim; ctx.textAlign = "left"; ctx.textBaseline = "top"; ctx.fillText(l.label, X(l.x) + 4, box.y + 4); } });
    (opts.hlines || []).forEach((l) => { ctx.strokeStyle = l.color || P.faint; ctx.setLineDash(l.dash || [4, 4]); ctx.lineWidth = l.width || 1.2; ctx.beginPath(); ctx.moveTo(box.x, Y(l.y)); ctx.lineTo(box.x + box.w, Y(l.y)); ctx.stroke(); ctx.setLineDash([]); if (l.label) { ctx.fillStyle = l.color || P.dim; ctx.textAlign = "right"; ctx.textBaseline = "bottom"; ctx.fillText(l.label, box.x + box.w - 4, Y(l.y) - 3); } });
    (opts.points || []).forEach((p) => { ctx.fillStyle = p.color || P.accent; ctx.beginPath(); ctx.arc(X(p.x), Y(p.y), p.r || 4, 0, Math.PI * 2); ctx.fill(); if (p.label) { ctx.fillStyle = P.text; ctx.textAlign = "left"; ctx.textBaseline = "bottom"; ctx.fillText(p.label, X(p.x) + 6, Y(p.y) - 4); } });
    ctx.restore();
    ctx.restore();
    return { X, Y, box };
  };

  /* ------------------------------------------------------------ controls */
  /**
   * range 입력 바인딩. output은 id+"-out" 요소.
   *   const get = MB.range('ev', v => v+' EV', v => redraw());  get() → 현재 값(Number)
   */
  MB.range = function (id, fmt, onInput) {
    const el = typeof id === "string" ? document.getElementById(id) : id;
    const out = document.getElementById(el.id + "-out") || document.querySelector(`output[for="${el.id}"]`);
    const update = (fire) => {
      const v = Number(el.value);
      const pct = ((v - Number(el.min || 0)) / (Number(el.max || 100) - Number(el.min || 0))) * 100;
      el.style.setProperty("--fill", pct + "%");
      if (out) out.textContent = fmt ? fmt(v) : String(v);
      if (fire && onInput) onInput(v);
    };
    el.addEventListener("input", () => update(true));
    update(false);
    const get = () => Number(el.value);
    get.set = (v, fire = true) => { el.value = v; update(fire); };
    get.el = el;
    return get;
  };
  /**
   * 이산 값 목록 슬라이더(조리개·셔터·ISO 눈금). HTML은 <input type="range" id="..."> 만 두면 된다.
   *   const N = MB.steps('ap', MB.APERTURES, MB.fmtN, 5.6, v => redraw());  N() → 값
   */
  MB.steps = function (id, list, fmt, initial, onInput) {
    const el = typeof id === "string" ? document.getElementById(id) : id;
    el.min = 0; el.max = list.length - 1; el.step = 1;
    el.value = initial != null ? MB.nearest(list, initial) : 0;
    const r = MB.range(el, (i) => (fmt ? fmt(list[i]) : String(list[i])), (i) => onInput && onInput(list[i]));
    const get = () => list[r()];
    get.set = (v, fire = true) => r.set(MB.nearest(list, v), fire);
    get.index = r;
    get.el = el;
    return get;
  };
  /** 세그먼트 버튼: <div class="seg" id="mode"><button data-value="a" class="on">A</button>...</div> */
  MB.seg = function (id, onChange) {
    const el = typeof id === "string" ? document.getElementById(id) : id;
    const btns = [...el.querySelectorAll("button")];
    let cur = (btns.find((b) => b.classList.contains("on")) || btns[0]).dataset.value;
    const set = (v, fire = true) => {
      cur = v;
      btns.forEach((b) => { const on = b.dataset.value === v; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); });
      if (fire && onChange) onChange(v);
    };
    btns.forEach((b) => b.addEventListener("click", () => set(b.dataset.value)));
    set(cur, false);
    const get = () => cur;
    get.set = set;
    return get;
  };
  /** 체크박스 바인딩 */
  MB.check = function (id, onChange) {
    const el = document.getElementById(id);
    el.addEventListener("change", () => onChange && onChange(el.checked));
    const get = () => el.checked;
    get.set = (v) => { el.checked = v; onChange && onChange(v); };
    return get;
  };
  MB.stat = function (id, html) { const el = document.getElementById(id); if (el) el.innerHTML = html; };

  MB.nearest = function (list, v, log = false) {
    let bi = 0, bd = Infinity;
    list.forEach((x, i) => { const d = log ? Math.abs(Math.log(x) - Math.log(v)) : Math.abs(x - v); if (d < bd) { bd = d; bi = i; } });
    return bi;
  };
  MB.mod = (n, m) => ((n % m) + m) % m;

  /* ==================================================================== statistics */
  /** 정규분포 확률밀도 */
  MB.normPdf = (x, mu = 0, s = 1) => Math.exp(-0.5 * ((x - mu) / s) ** 2) / (s * Math.sqrt(2 * Math.PI));
  /** 오차 함수(Abramowitz–Stegun 7.1.26, 오차 < 1.5e-7) */
  MB.erf = function (x) {
    const s = Math.sign(x), a = Math.abs(x), t = 1 / (1 + 0.3275911 * a);
    const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-a * a);
    return s * y;
  };
  /** 정규분포 누적분포 */
  MB.normCdf = (x, mu = 0, s = 1) => 0.5 * (1 + MB.erf((x - mu) / (s * Math.SQRT2)));
  /** ln Γ(x) (Lanczos) */
  MB.lgamma = function (x) {
    const g = 7, c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    if (x < 0.5) return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * x))) - MB.lgamma(1 - x);
    x -= 1; let a = c[0]; const t = x + g + 0.5;
    for (let i = 1; i < g + 2; i++) a += c[i] / (x + i);
    return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
  };
  /** 포아송 확률질량 P(K=k) */
  MB.poissonPmf = (k, lam) => (k < 0 ? 0 : Math.exp(k * Math.log(Math.max(lam, 1e-300)) - lam - MB.lgamma(k + 1)));
  /** 이항 확률질량 P(K=k) */
  MB.binomPmf = (k, n, p) => (k < 0 || k > n ? 0 : Math.exp(MB.lgamma(n + 1) - MB.lgamma(k + 1) - MB.lgamma(n - k + 1) + k * Math.log(Math.max(p, 1e-300)) + (n - k) * Math.log(Math.max(1 - p, 1e-300))));
  MB.mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
  MB.std = (a) => { const m = MB.mean(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / Math.max(1, a.length - 1)); };
  /**
   * 히스토그램. → {counts, edges, width}
   *   MB.histogram(data, 40, [lo, hi])
   */
  MB.histogram = function (data, bins = 30, range) {
    const lo = range ? range[0] : Math.min(...data), hi = range ? range[1] : Math.max(...data);
    const w = (hi - lo) / bins || 1, counts = new Array(bins).fill(0);
    for (const x of data) { const i = Math.floor((x - lo) / w); if (i >= 0 && i < bins) counts[i]++; else if (x === hi) counts[bins - 1]++; }
    return { counts, edges: counts.map((_, i) => lo + i * w).concat([hi]), width: w };
  };

  /* ==================================================================== complex numbers */
  /** 복소수는 [re, im] 배열로 다룬다. */
  MB.cx = {
    of: (re, im = 0) => [re, im],
    polar: (r, th) => [r * Math.cos(th), r * Math.sin(th)],
    add: (a, b) => [a[0] + b[0], a[1] + b[1]],
    sub: (a, b) => [a[0] - b[0], a[1] - b[1]],
    mul: (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]],
    div: (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; },
    scale: (a, s) => [a[0] * s, a[1] * s],
    conj: (a) => [a[0], -a[1]],
    abs: (a) => Math.hypot(a[0], a[1]),
    arg: (a) => Math.atan2(a[1], a[0]),
    exp: (a) => { const e = Math.exp(a[0]); return [e * Math.cos(a[1]), e * Math.sin(a[1])]; },
    /** e^{iθ} */
    cis: (th) => [Math.cos(th), Math.sin(th)],
    sqrt: (a) => { const r = Math.sqrt(Math.hypot(a[0], a[1])), th = Math.atan2(a[1], a[0]) / 2; return [r * Math.cos(th), r * Math.sin(th)]; },
    str: (a, d = 2) => { const re = +a[0].toFixed(d), im = +a[1].toFixed(d); return im === 0 ? String(re) : re === 0 ? `${im}i` : `${re} ${im < 0 ? "−" : "+"} ${Math.abs(im)}i`; },
  };

  /* ==================================================================== linear algebra */
  /** 행렬은 행 배열의 배열([[a,b],[c,d]]), 벡터는 배열. */
  MB.mat = {
    identity: (n) => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))),
    mul: (A, B) => A.map((row) => B[0].map((_, j) => row.reduce((s, a, k) => s + a * B[k][j], 0))),
    apply: (A, v) => A.map((row) => row.reduce((s, a, k) => s + a * v[k], 0)),
    transpose: (A) => A[0].map((_, j) => A.map((r) => r[j])),
    det: function (A) {
      const n = A.length;
      if (n === 1) return A[0][0];
      if (n === 2) return A[0][0] * A[1][1] - A[0][1] * A[1][0];
      const M = A.map((r) => r.slice()); let d = 1;
      for (let i = 0; i < n; i++) {
        let p = i; for (let r = i + 1; r < n; r++) if (Math.abs(M[r][i]) > Math.abs(M[p][i])) p = r;
        if (Math.abs(M[p][i]) < 1e-14) return 0;
        if (p !== i) { [M[p], M[i]] = [M[i], M[p]]; d = -d; }
        d *= M[i][i];
        for (let r = i + 1; r < n; r++) { const f = M[r][i] / M[i][i]; for (let c = i; c < n; c++) M[r][c] -= f * M[i][c]; }
      }
      return d;
    },
    /** 가우스–조르단 역행렬(특이하면 null) */
    inv: function (A) {
      const n = A.length, M = A.map((r, i) => r.concat(MB.mat.identity(n)[i]));
      for (let i = 0; i < n; i++) {
        let p = i; for (let r = i + 1; r < n; r++) if (Math.abs(M[r][i]) > Math.abs(M[p][i])) p = r;
        if (Math.abs(M[p][i]) < 1e-12) return null;
        [M[p], M[i]] = [M[i], M[p]];
        const d = M[i][i]; for (let c = 0; c < 2 * n; c++) M[i][c] /= d;
        for (let r = 0; r < n; r++) if (r !== i) { const f = M[r][i]; for (let c = 0; c < 2 * n; c++) M[r][c] -= f * M[i][c]; }
      }
      return M.map((r) => r.slice(n));
    },
    /** 연립방정식 A x = b */
    solve: (A, b) => { const Ai = MB.mat.inv(A); return Ai ? MB.mat.apply(Ai, b) : null; },
    /**
     * 2×2 고유값·고유벡터. → {values:[λ1,λ2] (실수) | null, complex:[re, im] | null, vectors:[[x,y],[x,y]]}
     * 고유값이 복소수이면 values=null, complex=[실부, 허부(+)]
     */
    eig2: function (A) {
      const [[a, b], [c, d]] = A, tr = a + d, det = a * d - b * c, disc = tr * tr / 4 - det;
      if (disc < -1e-12) return { values: null, complex: [tr / 2, Math.sqrt(-disc)], vectors: [] };
      const s = Math.sqrt(Math.max(0, disc)), l1 = tr / 2 + s, l2 = tr / 2 - s;
      const vec = (l) => {
        let v = Math.abs(b) > 1e-12 ? [b, l - a] : Math.abs(c) > 1e-12 ? [l - d, c] : (Math.abs(l - a) < 1e-12 ? [1, 0] : [0, 1]);
        const n = Math.hypot(v[0], v[1]) || 1; return [v[0] / n, v[1] / n];
      };
      let v1 = vec(l1), v2 = vec(l2);
      if (Math.abs(disc) < 1e-12 && Math.abs(b) < 1e-12 && Math.abs(c) < 1e-12) { v1 = [1, 0]; v2 = [0, 1]; }
      return { values: [l1, l2], complex: null, vectors: [v1, v2] };
    },
    /**
     * 대칭 행렬 고유분해(야코비 회전). → {values:[...](내림차순), vectors:[[...]...](각 열 대신 각 원소가 고유벡터)}
     */
    eigSym: function (A, iters = 100) {
      const n = A.length, M = A.map((r) => r.slice()), V = MB.mat.identity(n);
      for (let sweep = 0; sweep < iters; sweep++) {
        let off = 0; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) off += M[i][j] * M[i][j];
        if (off < 1e-20) break;
        for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) {
          if (Math.abs(M[p][q]) < 1e-15) continue;
          const th = (M[q][q] - M[p][p]) / (2 * M[p][q]);
          const t = Math.sign(th || 1) / (Math.abs(th) + Math.sqrt(th * th + 1)), c = 1 / Math.sqrt(t * t + 1), s = t * c;
          for (let k = 0; k < n; k++) { const mkp = M[k][p], mkq = M[k][q]; M[k][p] = c * mkp - s * mkq; M[k][q] = s * mkp + c * mkq; }
          for (let k = 0; k < n; k++) { const mpk = M[p][k], mqk = M[q][k]; M[p][k] = c * mpk - s * mqk; M[q][k] = s * mpk + c * mqk; }
          for (let k = 0; k < n; k++) { const vkp = V[k][p], vkq = V[k][q]; V[k][p] = c * vkp - s * vkq; V[k][q] = s * vkp + c * vkq; }
        }
      }
      const idx = [...Array(n).keys()].sort((i, j) => M[j][j] - M[i][i]);
      return { values: idx.map((i) => M[i][i]), vectors: idx.map((i) => V.map((r) => r[i])) };
    },
    /**
     * 특이값 분해(단측 야코비). A: m×n 행 배열(또는 Float64Array 평면 + m,n).
     * → {U: m×r, S: r, V: n×r (모두 행 배열), rank 순 내림차순}
     * 64×64 이미지 정도까지 브라우저에서 즉시 계산된다.
     */
    svd: function (A) {
      const m = A.length, n = A[0].length;
      const U = A.map((r) => Float64Array.from(r)); // m×n, 열을 직교화
      const V = Array.from({ length: n }, (_, i) => { const r = new Float64Array(n); r[i] = 1; return r; });
      for (let sweep = 0; sweep < 60; sweep++) {
        let rot = 0;
        for (let p = 0; p < n - 1; p++) for (let q = p + 1; q < n; q++) {
          let al = 0, be = 0, ga = 0;
          for (let i = 0; i < m; i++) { const up = U[i][p], uq = U[i][q]; al += up * up; be += uq * uq; ga += up * uq; }
          if (Math.abs(ga) <= 1e-12 * Math.sqrt(al * be) || ga === 0) continue;
          rot++;
          const z = (be - al) / (2 * ga), t = Math.sign(z || 1) / (Math.abs(z) + Math.sqrt(1 + z * z)), c = 1 / Math.sqrt(1 + t * t), s = c * t;
          for (let i = 0; i < m; i++) { const up = U[i][p], uq = U[i][q]; U[i][p] = c * up - s * uq; U[i][q] = s * up + c * uq; }
          for (let i = 0; i < n; i++) { const vp = V[i][p], vq = V[i][q]; V[i][p] = c * vp - s * vq; V[i][q] = s * vp + c * vq; }
        }
        if (!rot) break;
      }
      const S = []; for (let j = 0; j < n; j++) { let s = 0; for (let i = 0; i < m; i++) s += U[i][j] * U[i][j]; S.push(Math.sqrt(s)); }
      const order = [...Array(n).keys()].sort((a, b) => S[b] - S[a]);
      const Uo = U.map((r) => order.map((j) => (S[j] > 1e-15 ? r[j] / S[j] : 0)));
      const Vo = V.map((r) => order.map((j) => r[j]));
      return { U: Uo, S: order.map((j) => S[j]), V: Vo };
    },
  };

  /* ==================================================================== ODE */
  /**
   * 룽게–쿠타 4차. f(t, y[]) → dy[], 반환: [[t, y[]], ...] (n+1개)
   *   MB.rk4((t,y)=>[y[1], -y[0]], [1,0], 0, 0.01, 1000)
   */
  MB.rk4 = function (f, y0, t0, dt, n) {
    const out = [[t0, y0.slice()]]; let y = y0.slice(), t = t0;
    const add = (a, b, s) => a.map((v, i) => v + b[i] * s);
    for (let k = 0; k < n; k++) {
      const k1 = f(t, y), k2 = f(t + dt / 2, add(y, k1, dt / 2)), k3 = f(t + dt / 2, add(y, k2, dt / 2)), k4 = f(t + dt, add(y, k3, dt));
      y = y.map((v, i) => v + (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i])); t += dt;
      out.push([t, y.slice()]);
    }
    return out;
  };
  /** 오일러 전진법(비교용). 형식은 MB.rk4와 같다. */
  MB.euler = function (f, y0, t0, dt, n) {
    const out = [[t0, y0.slice()]]; let y = y0.slice(), t = t0;
    for (let k = 0; k < n; k++) { const d = f(t, y); y = y.map((v, i) => v + dt * d[i]); t += dt; out.push([t, y.slice()]); }
    return out;
  };

  /* ==================================================================== 2D Fourier & images */
  /** n×n 2D FFT(제자리, 행 우선 Float64Array). n은 2의 거듭제곱 */
  MB.fft2 = function (re, im, n, inverse = false) {
    const r = new Float64Array(n), i = new Float64Array(n);
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) { r[x] = re[y * n + x]; i[x] = im[y * n + x]; }
      MB.fft(r, i, inverse);
      for (let x = 0; x < n; x++) { re[y * n + x] = r[x]; im[y * n + x] = i[x]; }
    }
    for (let x = 0; x < n; x++) {
      for (let y = 0; y < n; y++) { r[y] = re[y * n + x]; i[y] = im[y * n + x]; }
      MB.fft(r, i, inverse);
      for (let y = 0; y < n; y++) { re[y * n + x] = r[y]; im[y * n + x] = i[y]; }
    }
  };
  /** 중심 이동(DC를 가운데로): 새 배열 반환 */
  MB.fftshift = function (a, n) {
    const out = new a.constructor(n * n), h = n >> 1;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) out[((y + h) % n) * n + ((x + h) % n)] = a[y * n + x];
    return out;
  };
  /**
   * 시험용 흑백 이미지(0..1, 행 우선 Float64Array n×n). 외부 사진 없이 매번 같은 그림.
   * kind: "scene"(집·해·나무가 있는 풍경) | "rings"(존 플레이트) | "bars"(막대 패턴) | "text"(글자 모양 블록) | "face"(단순한 얼굴)
   */
  MB.testImage = function (n = 64, kind = "scene") {
    const img = new Float64Array(n * n);
    const R = MB.rng(7);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const u = x / n, v = y / n; let g;
      if (kind === "rings") { const r2 = (u - 0.5) ** 2 + (v - 0.5) ** 2; g = 0.5 + 0.5 * Math.cos(Math.PI * n * 0.9 * r2); }
      else if (kind === "bars") { g = Math.floor(u * 8) % 2 ? 0.9 : 0.15; if (v > 0.5) g = Math.floor(u * 16) % 2 ? 0.9 : 0.15; }
      else if (kind === "face") {
        const d = Math.hypot(u - 0.5, (v - 0.52) * 0.9); g = d < 0.36 ? 0.78 : 0.22;
        if (Math.hypot(u - 0.37, v - 0.42) < 0.05 || Math.hypot(u - 0.63, v - 0.42) < 0.05) g = 0.08;
        if (Math.abs(v - 0.66 - 0.25 * (u - 0.5) ** 2 * 4) < 0.025 && Math.abs(u - 0.5) < 0.16) g = 0.12;
        if (v < 0.24 && d < 0.4) g = 0.1;
      } else if (kind === "text") {
        g = 0.95; const row = Math.floor(v * 8), col = Math.floor(u * 10);
        if (row % 2 === 1 && v * 8 - row > 0.15 && v * 8 - row < 0.85 && ((row * 7 + col * 3) % 5) !== 0 && u > 0.05 && u < 0.95) g = (Math.floor(u * 40) + row) % 3 === 0 ? 0.95 : 0.1;
      } else {
        g = 0.75 - 0.35 * v; // 하늘
        if (Math.hypot(u - 0.78, v - 0.2) < 0.09) g = 0.98; // 해
        if (v > 0.68) g = 0.35 + 0.08 * Math.sin(u * 40 + v * 13); // 땅
        if (u > 0.18 && u < 0.5 && v > 0.45 && v < 0.78) g = 0.55; // 벽
        if (v > 0.28 && v <= 0.45 && Math.abs(u - 0.34) < (v - 0.28) * 1.05) g = 0.2; // 지붕
        if (u > 0.24 && u < 0.31 && v > 0.52 && v < 0.6) g = 0.9; // 창
        if (u > 0.38 && u < 0.45 && v > 0.6 && v < 0.78) g = 0.15; // 문
        if (Math.hypot(u - 0.66, v - 0.5) < 0.1) g = 0.28 + 0.06 * Math.sin(u * 90) * Math.sin(v * 80); // 나무
        if (u > 0.645 && u < 0.675 && v > 0.58 && v < 0.75) g = 0.18;
      }
      img[y * n + x] = MB.clamp(g + (kind === "scene" ? (R() - 0.5) * 0.02 : 0), 0, 1);
    }
    return img;
  };
  const _off = document.createElement("canvas");
  /**
   * 흑백(0..1) 또는 색(colormap 함수) 배열을 캔버스에 그린다. 픽셀 경계가 보이도록 확대 시 스무딩을 끈다.
   *   MB.drawGray(ctx, data, w, h, dx, dy, dw, dh, {map: (v)=>[r,g,b], smooth:false})
   */
  MB.drawGray = function (ctx, data, w, h, dx, dy, dw, dh, o = {}) {
    _off.width = w; _off.height = h;
    const octx = _off.getContext("2d"), im = octx.createImageData(w, h);
    for (let i = 0; i < w * h; i++) {
      let r, g, b;
      if (o.map) [r, g, b] = o.map(data[i]);
      else { const v = Math.round(MB.clamp(data[i], 0, 1) * 255); r = g = b = v; }
      im.data[i * 4] = r; im.data[i * 4 + 1] = g; im.data[i * 4 + 2] = b; im.data[i * 4 + 3] = 255;
    }
    octx.putImageData(im, 0, 0);
    ctx.save(); ctx.imageSmoothingEnabled = !!o.smooth; ctx.drawImage(_off, dx, dy, dw, dh); ctx.restore();
  };
  /** 색 지도: t(0..1) → [r,g,b]. "viridis"(순차) | "diverge"(파랑–흰–빨강, 0.5가 흰색) | "phase"(색상환, 위상 표시) */
  MB.colormap = function (t, name = "viridis") {
    t = MB.clamp(t, 0, 1);
    if (name === "diverge") {
      const a = [33, 102, 172], m = [247, 247, 247], b = [178, 24, 43];
      return t < 0.5 ? a.map((v, i) => Math.round(v + (m[i] - v) * t * 2)) : m.map((v, i) => Math.round(v + (b[i] - v) * (t - 0.5) * 2));
    }
    if (name === "phase") {
      const h = t * 6, c = 220, x = c * (1 - Math.abs((h % 2) - 1)), o = 30;
      const k = Math.floor(h) % 6; const tbl = [[c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x]][k];
      return tbl.map((v) => Math.round(v + o));
    }
    const S = [[68, 1, 84], [72, 40, 120], [62, 74, 137], [49, 104, 142], [38, 130, 142], [31, 158, 137], [53, 183, 121], [109, 205, 89], [180, 222, 44], [253, 231, 37]];
    const f = t * (S.length - 1), i = Math.min(S.length - 2, Math.floor(f)), u = f - i;
    return S[i].map((v, k) => Math.round(v + (S[i + 1][k] - v) * u));
  };
  MB.rgb = (a) => `rgb(${a[0]},${a[1]},${a[2]})`;

  /* ==================================================================== coordinate plane */
  /**
   * 3Blue1Brown식 좌표 평면. 캔버스 위에 수학 좌표계를 깔고, 드래그 가능한 점을 다룬다.
   *   const pl = MB.plane("#cv", {x:[-5,5], y:[-3,3] | null(가로세로 같은 축척), aspect:0.6, grid:true, axes:true,
   *                              draw(P, api){...}  ← 생성 중에도 동기 호출되므로 pl 대신 api.points를 쓴다, points:[{x,y,color,r,label,snap,lock:"x"|"y",constrain(p)}], onDrag(pt,i)});
   *   P: {X(x)→px, Y(y)→py, ix(px)→x, iy(py)→y, unit(px/단위), ctx, w, h, P(팔레트),
   *       line(x1,y1,x2,y2,o), arrow(x1,y1,x2,y2,o), dot(x,y,o), poly(pts,o), circle(x,y,r,o), text(s,x,y,o), curve(fn,o), param(fn,t0,t1,o), grid(o), axes(o)}
   *   o 공통: {color, width, dash, fill, alpha, label, font, align, baseline, r, head}
   *   pl.redraw(), pl.points(배열, 직접 수정 가능), pl.view({x:[..], y:[..]}) 범위 변경
   */
  MB.plane = function (el, o = {}) {
    const st = { points: o.points || [], o };
    let view = { x: (o.x || [-5, 5]).slice(), y: o.y ? o.y.slice() : null };
    const api = { P: null };
    Object.defineProperty(api, "points", { get: () => st.points, set: (v) => { st.points = v; } });
    const cv = MB.canvas(el, (ctx, w, h) => {
      const pal = MB.palette();
      const [x0, x1] = view.x;
      let y0, y1;
      if (view.y) [y0, y1] = view.y; else { const half = ((x1 - x0) * h) / w / 2, cy = o.cy || 0; y0 = cy - half; y1 = cy + half; }
      const X = (x) => ((x - x0) / (x1 - x0)) * w, Y = (y) => h - ((y - y0) / (y1 - y0)) * h;
      const ix = (px) => x0 + (px / w) * (x1 - x0), iy = (py) => y0 + ((h - py) / h) * (y1 - y0);
      const unit = w / (x1 - x0);
      const style = (op, def) => { ctx.strokeStyle = op.color || def || pal.text; ctx.fillStyle = op.fill || op.color || def || pal.text; ctx.lineWidth = op.width || 2; ctx.setLineDash(op.dash || []); ctx.globalAlpha = op.alpha != null ? op.alpha : 1; };
      const reset = () => { ctx.setLineDash([]); ctx.globalAlpha = 1; };
      const P = {
        ctx, w, h, X, Y, ix, iy, unit, P: pal, x0, x1, y0, y1,
        line(a, b, c, d, op = {}) { style(op, pal.dim); ctx.beginPath(); ctx.moveTo(X(a), Y(b)); ctx.lineTo(X(c), Y(d)); ctx.stroke(); reset(); },
        arrow(a, b, c, d, op = {}) {
          style(op, pal.accent);
          const px = X(a), py = Y(b), qx = X(c), qy = Y(d), L = Math.hypot(qx - px, qy - py), hd = Math.min(op.head || 11, L * 0.45);
          if (L < 0.5) { reset(); return; }
          const ux = (qx - px) / L, uy = (qy - py) / L;
          ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(qx - ux * hd * 0.8, qy - uy * hd * 0.8); ctx.stroke();
          ctx.setLineDash([]);
          ctx.beginPath(); ctx.moveTo(qx, qy); ctx.lineTo(qx - ux * hd - uy * hd * 0.45, qy - uy * hd + ux * hd * 0.45); ctx.lineTo(qx - ux * hd + uy * hd * 0.45, qy - uy * hd - ux * hd * 0.45); ctx.closePath(); ctx.fillStyle = op.color || pal.accent; ctx.fill();
          if (op.label) P.text(op.label, c, d, { color: op.color || pal.accent, dx: 8 * Math.sign(ux || 1), dy: -8, bold: true, font: op.font });
          reset();
        },
        dot(x, y, op = {}) { style(op, pal.accent); ctx.beginPath(); ctx.arc(X(x), Y(y), op.r || 4, 0, Math.PI * 2); ctx.fill(); if (op.stroke) { ctx.strokeStyle = op.stroke; ctx.lineWidth = 2; ctx.stroke(); } if (op.label) P.text(op.label, x, y, { color: op.labelColor || pal.text, dx: 8, dy: -8, font: op.font }); reset(); },
        circle(x, y, r, op = {}) { style(op, pal.dim); ctx.beginPath(); ctx.arc(X(x), Y(y), r * unit, 0, Math.PI * 2); if (op.fill) ctx.fill(); if (op.stroke !== false) ctx.stroke(); reset(); },
        poly(pts, op = {}) {
          if (!pts.length) return; style(op, pal.accent); ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(X(x), Y(y)) : ctx.moveTo(X(x), Y(y))));
          if (op.close !== false) ctx.closePath();
          if (op.fill) { ctx.fillStyle = op.fill; ctx.fill(); }
          if (op.stroke !== false) { ctx.strokeStyle = op.color || pal.accent; ctx.stroke(); }
          reset();
        },
        text(s, x, y, op = {}) {
          ctx.save(); ctx.fillStyle = op.color || pal.text; ctx.globalAlpha = op.alpha != null ? op.alpha : 1;
          ctx.font = op.font || `${op.bold ? "700 " : ""}${op.size || 13}px ${getComputedStyle(document.body).getPropertyValue("--font")}`;
          ctx.textAlign = op.align || "left"; ctx.textBaseline = op.baseline || "middle";
          ctx.fillText(s, X(x) + (op.dx || 0), Y(y) + (op.dy || 0)); ctx.restore();
        },
        curve(fn, op = {}) {
          style(op, pal.accent); ctx.beginPath(); let started = false;
          const a = op.from != null ? op.from : x0, b = op.to != null ? op.to : x1, N = op.n || Math.max(100, Math.round(w));
          for (let i = 0; i <= N; i++) { const x = a + ((b - a) * i) / N, y = fn(x); if (!isFinite(y) || Math.abs(Y(y)) > 1e5) { started = false; continue; } started ? ctx.lineTo(X(x), Y(y)) : ctx.moveTo(X(x), Y(y)); started = true; }
          ctx.stroke(); reset();
        },
        param(fn, t0, t1, op = {}) {
          style(op, pal.accent); ctx.beginPath(); const N = op.n || 400;
          for (let i = 0; i <= N; i++) { const [x, y] = fn(t0 + ((t1 - t0) * i) / N); i ? ctx.lineTo(X(x), Y(y)) : ctx.moveTo(X(x), Y(y)); }
          if (op.close) ctx.closePath(); if (op.fill) { ctx.fillStyle = op.fill; ctx.fill(); } ctx.stroke(); reset();
        },
        grid(op = {}) {
          const step = op.step || 1;
          ctx.strokeStyle = op.color || pal.grid; ctx.lineWidth = op.width || 1; ctx.globalAlpha = op.alpha != null ? op.alpha : 1;
          ctx.beginPath();
          for (let x = Math.ceil(x0 / step) * step; x <= x1; x += step) { ctx.moveTo(X(x), 0); ctx.lineTo(X(x), h); }
          for (let y = Math.ceil(y0 / step) * step; y <= y1; y += step) { ctx.moveTo(0, Y(y)); ctx.lineTo(w, Y(y)); }
          ctx.stroke(); ctx.globalAlpha = 1;
        },
        axes(op = {}) {
          ctx.strokeStyle = op.color || pal.axis; ctx.lineWidth = 1.2; ctx.beginPath();
          ctx.moveTo(0, Y(0)); ctx.lineTo(w, Y(0)); ctx.moveTo(X(0), 0); ctx.lineTo(X(0), h); ctx.stroke();
          if (op.labels !== false) {
            const step = op.step || 1; ctx.fillStyle = pal.faint; ctx.font = "10px " + getComputedStyle(document.body).getPropertyValue("--mono");
            ctx.textAlign = "center"; ctx.textBaseline = "top";
            for (let x = Math.ceil(x0 / step) * step; x <= x1; x += step) if (Math.abs(x) > 1e-9) ctx.fillText(+x.toFixed(3), X(x), Math.min(h - 12, Math.max(2, Y(0) + 3)));
            ctx.textAlign = "right"; ctx.textBaseline = "middle";
            for (let y = Math.ceil(y0 / step) * step; y <= y1; y += step) if (Math.abs(y) > 1e-9) ctx.fillText(+y.toFixed(3), Math.max(24, Math.min(w - 2, X(0) - 4)), Y(y));
          }
        },
      };
      api.P = P;
      if (o.grid !== false && !o.noGrid) P.grid({ step: o.gridStep || 1 });
      if (o.axes !== false) P.axes({ step: o.gridStep || 1, labels: o.axisLabels });
      o.draw && o.draw(P, api);
      st.points.forEach((p) => { if (p.hidden) return; P.dot(p.x, p.y, { r: p.r || 7, color: p.color || pal.accent, stroke: pal.bg, label: p.label }); });
    }, { aspect: o.aspect || 0.62, maxHeight: o.maxHeight || 520, minHeight: o.minHeight || 220, height: o.height });
    api.cv = cv;
    api.redraw = () => cv.redraw();
    api.view = (v) => { if (v.x) view.x = v.x.slice(); if (v.y !== undefined) view.y = v.y ? v.y.slice() : null; cv.redraw(); };
    const canvas = cv.canvas;
    if (o.points || o.onDrag || o.onPointer) {
      canvas.classList.add("drag");
      let drag = -1;
      const pos = (e) => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
      canvas.addEventListener("pointerdown", (e) => {
        const P = api.P; if (!P) return; const [mx, my] = pos(e);
        let best = -1, bd = e.pointerType === "touch" ? 30 : 18;
        st.points.forEach((p, i) => { if (p.hidden || p.fixed) return; const d = Math.hypot(P.X(p.x) - mx, P.Y(p.y) - my); if (d < bd) { bd = d; best = i; } });
        if (best < 0 && o.onPointer) { o.onPointer(P.ix(mx), P.iy(my), "down"); return; }
        if (best < 0) return;
        drag = best; canvas.setPointerCapture(e.pointerId); canvas.classList.add("dragging"); e.preventDefault();
      });
      canvas.addEventListener("pointermove", (e) => {
        const P = api.P; if (!P) return; const [mx, my] = pos(e);
        if (drag < 0) { if (o.onPointer && e.buttons) o.onPointer(P.ix(mx), P.iy(my), "move"); return; }
        const p = st.points[drag];
        let x = P.ix(mx), y = P.iy(my);
        if (p.snap) { x = Math.round(x / p.snap) * p.snap; y = Math.round(y / p.snap) * p.snap; }
        if (p.lock !== "x") p.x = MB.clamp(x, P.x0, P.x1);
        if (p.lock !== "y") p.y = MB.clamp(y, P.y0, P.y1);
        if (p.constrain) p.constrain(p);
        o.onDrag && o.onDrag(p, drag);
        cv.redraw();
      });
      const up = (e) => { if (drag >= 0) { drag = -1; canvas.classList.remove("dragging"); o.onDragEnd && o.onDragEnd(); } else if (o.onPointer && api.P) { const [mx, my] = pos(e); o.onPointer(api.P.ix(mx), api.P.iy(my), "up"); } };
      canvas.addEventListener("pointerup", up);
      canvas.addEventListener("pointercancel", up);
    }
    return api;
  };

  /* ==================================================================== number formats */
  /** 2진 표현(IEEE 754 double)의 비트 문자열 {sign, exp, frac, hex} */
  MB.float64Bits = function (x) {
    const b = new DataView(new ArrayBuffer(8)); b.setFloat64(0, x);
    let s = ""; for (let i = 0; i < 8; i++) s += b.getUint8(i).toString(2).padStart(8, "0");
    let hex = ""; for (let i = 0; i < 8; i++) hex += b.getUint8(i).toString(16).padStart(2, "0");
    return { sign: s[0], exp: s.slice(1, 12), frac: s.slice(12), hex };
  };
  /** float32로 반올림 */
  MB.f32 = (x) => Math.fround(x);
  /** 행렬 → TeX 문자열 */
  MB.texMat = (A, d = 2) => "\\begin{bmatrix}" + A.map((r) => r.map((v) => (typeof v === "number" ? +v.toFixed(d) : v)).join(" & ")).join(" \\\\ ") + "\\end{bmatrix}";
  /** 요소 안의 TeX를 다시 렌더(동적으로 바꾼 수식용). KaTeX가 없으면 원문 그대로 둔다. */
  MB.tex = function (el, tex, display = false) {
    if (typeof el === "string") el = document.getElementById(el);
    if (!el) return;
    if (window.katex) { try { katex.render(tex, el, { throwOnError: false, displayMode: display }); return; } catch (e) {} }
    el.textContent = tex;
  };

  /* ==================================================================== DSP */
  /** 제자리 radix-2 FFT. re, im 길이는 2의 거듭제곱 */
  MB.fft = function (re, im, inverse = false) {
    const n = re.length;
    for (let i = 1, j = 0; i < n; i++) {
      let bit = n >> 1;
      for (; j & bit; bit >>= 1) j ^= bit;
      j ^= bit;
      if (i < j) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; }
    }
    for (let len = 2; len <= n; len <<= 1) {
      const ang = ((inverse ? 2 : -2) * Math.PI) / len, wr = Math.cos(ang), wi = Math.sin(ang);
      for (let i = 0; i < n; i += len) {
        let cr = 1, ci = 0;
        for (let k = 0; k < len / 2; k++) {
          const a = i + k, b = a + len / 2;
          const xr = re[b] * cr - im[b] * ci, xi = re[b] * ci + im[b] * cr;
          re[b] = re[a] - xr; im[b] = im[a] - xi; re[a] += xr; im[a] += xi;
          const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t;
        }
      }
    }
    if (inverse) for (let i = 0; i < n; i++) { re[i] /= n; im[i] /= n; }
  };
  MB.WINDOWS = {
    rect: () => 1,
    hann: (i, n) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1)),
    hamming: (i, n) => 0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (n - 1)),
    blackman: (i, n) => 0.42 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1)) + 0.08 * Math.cos((4 * Math.PI * i) / (n - 1)),
  };
  /**
   * 크기 스펙트럼(dBFS 근사). 사인파 진폭 A → 약 20log10(A) dB가 되도록 창 이득 보정.
   * → Float32Array(n/2) dB
   */
  MB.spectrum = function (x, win = "hann", n) {
    n = n || 1 << Math.ceil(Math.log2(x.length));
    const re = new Float64Array(n), im = new Float64Array(n), w = MB.WINDOWS[win] || MB.WINDOWS.hann;
    let wsum = 0;
    for (let i = 0; i < Math.min(n, x.length); i++) { const wi = w(i, Math.min(n, x.length)); re[i] = x[i] * wi; wsum += wi; }
    MB.fft(re, im);
    const out = new Float32Array(n / 2);
    for (let k = 0; k < n / 2; k++) out[k] = 20 * Math.log10((2 * Math.hypot(re[k], im[k])) / wsum + 1e-12);
    return out;
  };
  MB.db = (g) => 20 * Math.log10(Math.max(1e-12, g));
  MB.undb = (d) => Math.pow(10, d / 20);

  /* ==================================================================== audio engine */
  let actx = null, master = null, limiter = null, analyser = null, muted = false, masterVol = 0.8;
  try { muted = localStorage.getItem("mk-muted") === "1"; } catch (e) {}
  /** AudioContext(첫 호출 시 생성). 반드시 사용자 클릭·키 입력 안에서 처음 호출한다. */
  MB.ctx = function () {
    if (!actx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      actx = new AC({ latencyHint: "interactive" });
      master = actx.createGain();
      master.gain.value = muted ? 0 : masterVol;
      limiter = actx.createDynamicsCompressor();
      limiter.threshold.value = -6; limiter.knee.value = 4; limiter.ratio.value = 12; limiter.attack.value = 0.003; limiter.release.value = 0.15;
      analyser = actx.createAnalyser();
      analyser.fftSize = 8192; analyser.smoothingTimeConstant = 0.6;
      master.connect(limiter); limiter.connect(analyser); analyser.connect(actx.destination);
      MB.out = master; MB.analyser = analyser;
    }
    if (actx.state === "suspended") actx.resume();
    return actx;
  };
  /** 지금 시각(오디오 시계, 초) */
  MB.now = () => (MB.ctx() ? actx.currentTime : 0);
  MB.isMuted = () => muted;
  MB.setMuted = function (m) {
    muted = m;
    try { localStorage.setItem("mk-muted", m ? "1" : "0"); } catch (e) {}
    if (master) master.gain.setTargetAtTime(m ? 0 : masterVol, actx.currentTime, 0.02);
    document.querySelectorAll(".mb-mute").forEach((b) => b.classList.toggle("muted", m));
  };
  const _activeVoices = new Set();
  /** 재생 중인 모든 음을 짧게 멈춘다(정지 버튼용) */
  MB.stopAll = function () {
    if (!actx) return;
    const t = actx.currentTime;
    _activeVoices.forEach((v) => { try { v.release(t, 0.03); } catch (e) {} });
    _activeVoices.clear();
  };

  /**
   * 짧은 소리(사인파 등). 반드시 클릭 핸들러 안에서 부른다.
   *   MB.tone(440, 0.5, {gain:0.2, type:"sine", when})  → {release()}
   */
  MB.tone = function (freq, dur = 0.5, o = {}) {
    const ctx = MB.ctx(); if (!ctx) return null;
    const t0 = o.when || ctx.currentTime + 0.01, g = ctx.createGain(), osc = ctx.createOscillator();
    osc.type = o.type || "sine"; osc.frequency.value = freq;
    const peak = o.gain != null ? o.gain : 0.2;
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(peak, t0 + 0.01);
    if (dur != null) { g.gain.setTargetAtTime(0, t0 + dur, 0.03); osc.stop(t0 + dur + 0.2); }
    osc.connect(g); g.connect(o.dest || master); osc.start(t0);
    const v = { osc, gain: g, release(t = ctx.currentTime, rr = 0.05) { g.gain.cancelScheduledValues(t); g.gain.setTargetAtTime(0, t, rr / 3); try { osc.stop(t + rr + 0.1); } catch (e) {} } };
    _activeVoices.add(v); osc.onended = () => _activeVoices.delete(v);
    return v;
  };
  /** Float32Array 샘플을 바로 재생 */
  MB.playBuffer = function (samples, sr = 44100, o = {}) {
    const ctx = MB.ctx(); if (!ctx) return null;
    const b = ctx.createBuffer(1, samples.length, sr); b.getChannelData(0).set(samples);
    const s = ctx.createBufferSource(); s.buffer = b; s.loop = !!o.loop;
    const g = ctx.createGain(); g.gain.value = o.gain != null ? o.gain : 0.5;
    s.connect(g); g.connect(o.dest || master); s.start(o.when || ctx.currentTime + 0.01);
    const v = { src: s, gain: g, release(t = ctx.currentTime) { g.gain.setTargetAtTime(0, t, 0.01); try { s.stop(t + 0.08); } catch (e) {} } };
    _activeVoices.add(v);
    s.onended = () => _activeVoices.delete(v);
    return v;
  };

  /**
   * 계속 울리는 소리(드론): 파라미터를 실시간으로 바꿀 수 있는 발진기 묶음.
   *   const dr = MB.drone({freq:220, amps:[1,0.5,...], type, gain}); dr.set({freq, amps}); dr.stop();

  /* ==================================================================== drawing */
  /** 파형 그리기: data(배열), box, {color, width, yScale, from, count} */
  MB.drawWave = function (ctx, box, data, o = {}) {
    const P = MB.palette();
    const n = o.count || data.length, s0 = o.from || 0, ys = o.yScale || 1;
    ctx.save();
    if (o.axis !== false) { ctx.strokeStyle = P.grid; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(box.x, box.y + box.h / 2); ctx.lineTo(box.x + box.w, box.y + box.h / 2); ctx.stroke(); }
    ctx.strokeStyle = o.color || P.accent; ctx.lineWidth = o.width || 2; ctx.lineJoin = "round";
    ctx.beginPath();
    const step = Math.max(1, n / (box.w * 2));
    for (let i = 0; i < n; i += step) {
      const v = data[Math.floor(s0 + i)] || 0;
      const x = box.x + (i / (n - 1)) * box.w, y = box.y + box.h / 2 - v * ys * box.h / 2;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  };
  /** 재생/정지 토글 버튼 바인딩: MB.playButton("btn-id", onStart, onStop) → {set(playing)} */
  MB.playButton = function (id, onStart, onStop, labels = ["▶ 재생", "■ 정지"]) {
    const b = document.getElementById(id);
    let on = false;
    const set = (v) => { on = v; b.textContent = labels[on ? 1 : 0]; b.classList.toggle("playing", on); };
    b.addEventListener("click", () => { MB.ctx(); if (on) { set(false); onStop && onStop(); } else { set(true); onStart && onStart(); } });
    set(false);
    return { set, get on() { return on; }, el: b };
  };
  /* ------------------------------------------------------------ layout build */
  const LOGO = `<svg class="mark" viewBox="0 0 32 32" aria-hidden="true"><defs><linearGradient id="mbg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--accent)"/><stop offset="1" stop-color="var(--accent-2)"/></linearGradient></defs><rect x="2" y="2" width="28" height="28" rx="8" fill="url(#mbg)"/><path d="M19.5 7.5c-1.6-.6-3 .3-3.4 2.2L13.4 22.6c-.4 1.9-1.8 2.8-3.4 2.2" fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round"/><path d="M7 15.5h4.2M20 13l5 5M25 13l-5 5" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".8"/></svg>`;
  const ICON_SOUND = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path class="w1" d="M16.5 8.5a5 5 0 0 1 0 7"/><path class="w2" d="M19.3 5.8a9 9 0 0 1 0 12.4"/><path class="x" d="M16 9l6 6M22 9l-6 6"/></svg>`;
  const ICON_MENU = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>`;
  const ICON_MOON = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>`;
  const ICON_SUN = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>`;

  function build() {
    const body = document.body;
    const root = body.dataset.root != null ? body.dataset.root : body.dataset.chapter ? "../" : "";
    const curSlug = body.dataset.chapter || "";
    const href = (slug) => (slug ? `${root}chapters/${slug}.html` : `${root}index.html`);
    const feedbackUrl = "https://books.euiyun.com/feedback.html?book=mathbook&page=" + encodeURIComponent(location.href);

    const bar = document.createElement("header");
    bar.className = "sb-topbar";
    bar.innerHTML = `
      <button class="sb-btn icon" id="sb-menu" aria-label="챕터 목록">${ICON_MENU}</button>
      <a class="sb-logo" href="${href("")}">${LOGO}<span>MathBook <small>문제에서 출발하는 수학</small></span></a>
      <span class="spacer"></span>
      <a class="sb-btn series-link" href="https://books.euiyun.com/" aria-label="전체 책 보기" title="전체 책 보기"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5.5h6v14H4zM10 5.5h6v14h-6zM17 7l3-1 2 13-3 1z"/></svg><span>전체 책</span></a>
      <button class="sb-btn icon mb-mute" id="sb-mute" aria-label="소리 켜기/끄기" title="소리 켜기/끄기">${ICON_SOUND}</button>
      <button class="sb-btn icon" id="sb-theme" aria-label="테마 전환"></button>
      <div class="sb-progress" id="sb-progress"></div>`;
    const feedbackButton = document.createElement("a");
    feedbackButton.className = bar.className.replace("-topbar", "-btn") + " icon feedback-button";
    feedbackButton.href = feedbackUrl;
    feedbackButton.target = "_blank";
    feedbackButton.rel = "noopener";
    feedbackButton.setAttribute("aria-label", "독자 의견 보내기");
    feedbackButton.title = "독자 의견 보내기";
    feedbackButton.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 4h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-6 4V6a2 2 0 0 1 2-2z"/><path d="M8 9h8M8 13h5"/></svg>';
    bar.querySelector("[id$='-theme']").before(feedbackButton);
    body.prepend(bar);

    // Search chapter metadata immediately; load section and visual titles on demand.
    const progressBar = bar.querySelector("[id$='-progress']");
    const spacer = bar.querySelector(".spacer");
    const leftNav = document.createElement("div");
    leftNav.className = "book-nav-left";
    leftNav.append(bar.querySelector("[id$='-menu']"), bar.querySelector("a[class$='-logo']"));
    const rightNav = document.createElement("div");
    rightNav.className = "book-nav-right";
    [...bar.children].filter((el) => el !== spacer && el !== progressBar).forEach((el) => rightNav.appendChild(el));
    spacer.remove();
    const search = document.createElement("div");
    search.className = "book-search";
    search.innerHTML = '<svg class="book-search-icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></svg><input type="search" aria-label="이 책의 챕터, 섹션, 시뮬레이터, 그림 검색" placeholder="이 책 검색" autocomplete="off"><div class="book-search-results" aria-live="polite"></div>';
    bar.prepend(leftNav);
    bar.insertBefore(search, progressBar);
    bar.insertBefore(rightNav, progressBar);
    const searchInput = search.querySelector("input");
    const searchResults = search.querySelector(".book-search-results");
    const closeSearch = () => { search.classList.remove("open"); searchResults.replaceChildren(); };
    let detailEntries = [];
    let detailsLoaded = false;
    let detailPromise;
    function loadDetails() {
      if (detailPromise) return detailPromise;
      detailPromise = Promise.all(CHAPTERS.map(async (chapter) => {
        try {
          const response = await fetch(href(chapter.slug));
          if (!response.ok) return [];
          const doc = new DOMParser().parseFromString(await response.text(), "text/html");
          const main = doc.querySelector("main.chapter");
          if (!main) return [];
          const entries = [];
          [...main.querySelectorAll("section > h2")].forEach((heading, i) => {
            entries.push({ type: "섹션", title: heading.textContent.trim(), chapter, hash: heading.parentElement.id || `s${i + 1}` });
          });
          [...main.querySelectorAll(".sim")].filter((sim) => sim.querySelector(".sim-head h3")).forEach((sim, i) => {
            entries.push({ type: "시뮬레이터", title: sim.querySelector(".sim-head h3").textContent.trim(), chapter, hash: sim.id || `search-sim-${i + 1}` });
          });
          [...main.querySelectorAll("figure")].filter((figure) => figure.querySelector("figcaption")).forEach((figure, i) => {
            const caption = figure.querySelector("figcaption").textContent.replace(/\s+/g, " ").trim();
            entries.push({ type: "그림", title: caption.slice(0, 140), chapter, hash: figure.id || `search-fig-${i + 1}` });
          });
          return entries;
        } catch (error) { return []; }
      })).then((parts) => { detailEntries = parts.flat(); detailsLoaded = true; renderSearch(); });
      return detailPromise;
    }
    function renderSearch() {
      const words = searchInput.value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
      searchResults.replaceChildren();
      if (!words.length) { closeSearch(); return; }
      const includesWords = (value) => words.every((word) => value.toLocaleLowerCase().includes(word));
      const chapterMatches = CHAPTERS.filter((c) => includesWords([c.num, c.title, c.desc, ...(c.tags || [])].join(" ")))
        .map((c) => ({ type: "챕터", title: c.title, chapter: c, hash: "" }));
      const detailMatches = detailEntries.filter((entry) => includesWords(entry.title));
      const matches = [
        ...chapterMatches.slice(0, 4),
        ...detailMatches.filter((entry) => entry.type === "섹션").slice(0, 5),
        ...detailMatches.filter((entry) => entry.type === "시뮬레이터").slice(0, 4),
        ...detailMatches.filter((entry) => entry.type === "그림").slice(0, 4),
      ];
      matches.forEach((entry) => {
        const link = document.createElement("a");
        link.href = href(entry.chapter.slug) + (entry.hash ? `#${entry.hash}` : "");
        const title = document.createElement("strong");
        title.textContent = entry.title;
        const context = document.createElement("small");
        context.textContent = `${entry.chapter.num} · ${entry.chapter.title} · ${entry.type}`;
        link.append(title, context);
        searchResults.appendChild(link);
      });
      if (chapterMatches.length + detailMatches.length > matches.length) {
        const more = document.createElement("p");
        more.textContent = `상위 ${matches.length}개 표시 · 검색어를 더 구체적으로 입력해 보세요`;
        searchResults.appendChild(more);
      }
      if (detailPromise && !detailsLoaded) {
        const status = document.createElement("p");
        status.textContent = "섹션·시뮬레이터·그림 목록을 불러오는 중…";
        searchResults.appendChild(status);
      } else if (!matches.length) {
        const empty = document.createElement("p");
        empty.textContent = "검색 결과가 없습니다";
        searchResults.appendChild(empty);
      }
      search.classList.add("open");
    }
    searchInput.addEventListener("input", () => { if (searchInput.value.trim()) loadDetails(); renderSearch(); });
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { closeSearch(); searchInput.blur(); }
      else if (e.key === "ArrowDown") { const first = searchResults.querySelector("a"); if (first) { e.preventDefault(); first.focus(); } }
      else if (e.key === "Enter") { const first = searchResults.querySelector("a"); if (first) { e.preventDefault(); first.click(); } }
    });
    searchResults.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { closeSearch(); searchInput.focus(); }
      else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        const links = [...searchResults.querySelectorAll("a")];
        const next = links.indexOf(document.activeElement) + (e.key === "ArrowDown" ? 1 : -1);
        e.preventDefault();
        (links[next] || searchInput).focus();
      }
    });
    document.addEventListener("pointerdown", (e) => { if (!search.contains(e.target)) closeSearch(); });


    const drawer = document.createElement("nav");
    drawer.className = "sb-drawer";
    drawer.innerHTML = `<h4>Chapters</h4><ul class="sb-chlist">
      <li><a href="${href("")}" class="${curSlug ? "" : "active"}"><span class="num">00</span><span>홈 · 로드맵</span></a></li>
      ${CHAPTERS.map((c) => `<li><a href="${href(c.slug)}" class="${c.slug === curSlug ? "active" : ""}"><span class="num">${c.num}</span><span>${c.title}</span></a></li>`).join("")}
    </ul>
    <h4 style="margin-top:22px">함께 읽기</h4><ul class="sb-chlist">
      <li><a href="https://musicbook.euiyun.com/"><span class="num">↗</span><span>MusicBook · 푸리에를 소리로</span></a></li>
      <li><a href="https://sensorbook.euiyun.com/"><span class="num">↗</span><span>SensorBook · 노이즈 통계</span></a></li>
      <li><a href="https://opticsbook.euiyun.com/"><span class="num">↗</span><span>OpticsBook · 파동 광학</span></a></li>
      <li><a href="https://books.euiyun.com/"><span class="num">↗</span><span>전체 책 보기</span></a></li>
    </ul>`;
    const backdrop = document.createElement("div");
    backdrop.className = "sb-drawer-backdrop";
    body.append(backdrop, drawer);
    const toggleDrawer = (o) => body.classList.toggle("drawer-open", o);
    bar.querySelector("#sb-menu").addEventListener("click", () => toggleDrawer(true));
    backdrop.addEventListener("click", () => toggleDrawer(false));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") toggleDrawer(false); });

    const mbtn = bar.querySelector("#sb-mute");
    mbtn.classList.toggle("muted", MB.isMuted());
    mbtn.addEventListener("click", () => { MB.ctx(); MB.setMuted(!MB.isMuted()); });

    const tbtn = bar.querySelector("#sb-theme");
    const setIcon = () => (tbtn.innerHTML = MB.isDark() ? ICON_SUN : ICON_MOON);
    setIcon();
    tbtn.addEventListener("click", () => {
      const next = MB.isDark() ? "light" : "dark";
      try { localStorage.setItem("mk-theme", next); } catch (e) {}
      applyTheme(next); setIcon();
    });

    const prog = bar.querySelector("#sb-progress");
    const onScroll = () => { const h = document.documentElement.scrollHeight - innerHeight; prog.style.width = (h > 0 ? (scrollY / h) * 100 : 0) + "%"; };
    addEventListener("scroll", onScroll, { passive: true }); onScroll();

    const main = document.querySelector("main.chapter");
    if (main) {
      // Give search results stable anchors even when the source has no id.
      [...main.querySelectorAll(".sim")].filter((sim) => sim.querySelector(".sim-head h3")).forEach((sim, i) => { if (!sim.id) sim.id = `search-sim-${i + 1}`; });
      [...main.querySelectorAll("figure")].filter((figure) => figure.querySelector("figcaption")).forEach((figure, i) => { if (!figure.id) figure.id = `search-fig-${i + 1}`; });
      if (/^#(?:s\d+|search-(?:sim|fig)-)/.test(location.hash)) {
        requestAnimationFrame(() => document.getElementById(location.hash.slice(1))?.scrollIntoView());
      }
      const layout = document.createElement("div");
      layout.className = "sb-layout";
      main.parentNode.insertBefore(layout, main);
      layout.appendChild(main);
      const toc = document.createElement("aside");
      toc.className = "sb-toc";
      const h2s = [...main.querySelectorAll("section > h2")];
      let n = 0;
      toc.innerHTML = "<h4>ON THIS PAGE</h4>" + h2s.map((h, i) => {
        const sec = h.parentElement;
        if (!sec.id) sec.id = "s" + (i + 1);
        const numbered = !sec.classList.contains("keypoints") && !sec.classList.contains("quiz-sec") && !sec.hasAttribute("data-nonum");
        if (numbered && !h.querySelector(".h-num")) { n++; h.insertAdjacentHTML("afterbegin", `<span class="h-num">${String(n).padStart(2, "0")}</span>`); }
        return `<a href="#${sec.id}">${h.textContent.replace(/^\d\d/, "").trim()}</a>`;
      }).join("");
      layout.appendChild(toc);
      const links = [...toc.querySelectorAll("a")];
      if (window.IntersectionObserver && h2s.length) {
        const io = new IntersectionObserver((es) => {
          es.forEach((e) => { if (e.isIntersecting) { links.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id)); } });
        }, { rootMargin: "-20% 0px -70% 0px" });
        h2s.forEach((h) => io.observe(h.parentElement));
      }

      const idx = CHAPTERS.findIndex((c) => c.slug === curSlug);
      const prev = idx > 0 ? CHAPTERS[idx - 1] : null;
      const next = idx >= 0 && idx < CHAPTERS.length - 1 ? CHAPTERS[idx + 1] : null;
      const pager = document.createElement("nav");
      pager.className = "sb-pager";
      pager.innerHTML =
        (prev ? `<a class="prev" href="${href(prev.slug)}"><small>← 이전 · ${prev.num}</small>${prev.title}</a>` : `<a class="prev" href="${href("")}"><small>← 처음으로</small>홈 · 로드맵</a>`) +
        (next ? `<a class="next" href="${href(next.slug)}"><small>다음 · ${next.num} →</small>${next.title}</a>` : "");
      layout.after(pager);
    }
    const foot = document.createElement("footer");
    foot.className = "sb-foot";
    foot.innerHTML = `MathBook — 문제에서 출발해 도구로 가는 수학 교과서 · 시리즈 전체의 "더 깊이" 링크가 모이는 공통 기반 층입니다.
      <br>시리즈: <a href="https://books.euiyun.com/">books.euiyun.com</a> · <a href="https://musicbook.euiyun.com/">MusicBook</a> · <a href="https://sensorbook.euiyun.com/">SensorBook</a> · <a href="https://opticsbook.euiyun.com/">OpticsBook</a>
      <br>© 2026 <a href="https://github.com/geniuskey">geniuskey</a> ·
      콘텐츠 <a href="https://creativecommons.org/licenses/by/4.0/deed.ko" rel="license">CC BY 4.0</a> ·
      코드 <a href="https://github.com/geniuskey/mathbook/blob/main/LICENSE-MIT">MIT</a> ·
      <a href="https://github.com/geniuskey/mathbook/blob/main/LICENSE.md">라이선스 안내</a>`;
    const feedbackLink = document.createElement("a");
    feedbackLink.href = feedbackUrl;
    feedbackLink.target = "_blank";
    feedbackLink.rel = "noopener";
    feedbackLink.textContent = "독자 의견";
    foot.append(" · ", feedbackLink);
    body.appendChild(foot);

    document.querySelectorAll(".quiz-q").forEach((q) => {
      const opts = [...q.querySelectorAll("button.opt")];
      opts.forEach((b) => b.addEventListener("click", () => {
        opts.forEach((o) => { o.disabled = true; if (o.hasAttribute("data-correct")) o.classList.add("right"); });
        if (!b.hasAttribute("data-correct")) b.classList.add("wrong");
        q.classList.add("done");
        q.dispatchEvent(new CustomEvent("answered", { bubbles: true, detail: { correct: b.hasAttribute("data-correct") } }));
      }));
    });

    const renderMath = () => {
      if (window.renderMathInElement) {
        renderMathInElement(document.body, {
          delimiters: [{ left: "$$", right: "$$", display: true }, { left: "\\(", right: "\\)", display: false }, { left: "\\[", right: "\\]", display: true }],
          throwOnError: false,
          ignoredClasses: ["no-math"],
        });
      }
    };
    if (window.renderMathInElement) renderMath();
    else window.addEventListener("load", renderMath);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", build);
  else build();
})();

// Simulator deep links: add a shareable # link to each simulator heading.
(function () {
  function addSimulatorLinks() {
    document.querySelectorAll(".sim[id] > .sim-head").forEach((head) => {
      if (head.querySelector(".sim-link")) return;
      const link = document.createElement("a");
      link.className = "sim-link";
      link.href = "#" + head.parentElement.id;
      link.textContent = "#";
      link.title = "이 시뮬레이터로 가는 링크";
      link.setAttribute("aria-label", "이 시뮬레이터로 가는 링크");
      head.appendChild(link);
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", addSimulatorLinks, { once: true });
  } else {
    addSimulatorLinks();
  }
})();

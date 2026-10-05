# MathBook 챕터 작성 가이드

## 기여물의 라이선스

기여하는 코드는 MIT, 교재 콘텐츠는 CC BY 4.0으로 제공하는 데 동의해야 합니다. HTML 안에 코드와 콘텐츠가 함께 있어도 각 부분에 해당하는 라이선스를 적용합니다. 적용 범위는 [라이선스 안내](LICENSE.md)를 참고하세요. 제3자 자료(그림, 표, 데이터)를 추가할 때는 재사용·배포가 허용되는지 확인하고 출처와 해당 라이선스를 명시하세요.

빌드 과정 없는 정적 사이트다. `index.html` + `chapters/<slug>.html` + 공통 `css/style.css`, `js/common.js`.
로컬 실행: `python3 -m http.server 8000` → http://localhost:8000 (file://로 열어도 동작하게 classic script만 사용한다. ES module 금지.)

## 원칙: 문제 → 도구
수학은 공학과 너무 가까워서 "의외성"이 약하다. 그래서 각도를 뒤집는다. 교과서 순서(정의 → 정리 → 예제)가 아니라 **문제 → 막힘 → 도구 → 다시 문제** 순서로 쓴다. 독자가 묻는 질문은 "이 개념이 뭔가"가 아니라 **"이 개념이 어떤 공학 문제 때문에 필요했는가"**다.

- **장 첫머리**는 "이 수식이 없었다면 못 만들었을 물건"(`.origin`)으로 연다. 예: 푸리에 → MRI, 오류 정정 부호 → QR 코드, 복소수 → 전력망.
- **각 절**은 가능하면 `.problem` 상자(구체적인 공학 문제)로 시작하고, 기존 방법으로는 왜 막히는지 보여 준 뒤 도구를 꺼낸다. 정의는 도구가 등장한 다음에 쓴다.
- **데모는 기하적 직관**을 직접 만지게 한다(3Blue1Brown 스타일). 수식 기호를 조작하는 것보다 **그림을 끌어서** 수학이 반응하게 한다. 예: 행렬 값을 바꾸면 격자가 변형되고, 점을 끌면 고유벡터가 따라 돈다. `MB.plane`을 적극 쓴다.
- 한국어, 대상은 엔지니어와 공대생(미적분·기초 선형대수를 한 번 배웠지만 "왜"는 흐릿한 사람). 영어 원어는 `<span class="en">(Eigenvalue)</span>`처럼 병기.
- 흐름: 물건 → 문제 → 직관 그림(SVG) → **조작하는 시뮬레이터** → 수식(KaTeX) → 실제 수치 예 → 쓰이는 곳(`.uses`) → 요약/퀴즈.
- **시리즈의 공통 기반 층**: 다른 책(MusicBook의 푸리에, SensorBook의 노이즈 통계, OpticsBook의 파동 광학 …)의 "더 깊이" 링크가 이 책으로 모인다. 그래서 절 `id`는 의미 있는 영어 슬러그로 짓고(`id="phasor"`, `id="shot-noise"`) 한 번 정하면 바꾸지 않는다. 각 장 끝 근처에 "이 도구가 쓰이는 곳"(`.uses`) 절을 둬서 반대 방향 링크를 제공한다.
- 외부 라이브러리는 KaTeX만. 이미지 파일 대신 인라인 SVG/canvas와 `MB.testImage`를 쓴다.
- 색은 하드코딩하지 말고 CSS 변수(`var(--accent)` 등)나 `MB.palette()`를 쓴다. 라이트/다크 둘 다 읽혀야 한다.
- 모바일(폭 360px)에서 가로 스크롤이 생기면 안 된다. SVG는 `viewBox`만 주고 width/height 속성 생략.
- 모델의 가정·한계를 시뮬레이터 가까이(`.sim-note`)에 밝힌다.
- 역사·수치는 확인된 사실만 쓴다. 불확실하면 쓰지 않거나 "~로 알려져 있다"로 범위를 밝힌다.

## head 템플릿
```html
<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="icon" href="../favicon.svg" type="image/svg+xml">
<title>복소수는 회전이다 · MathBook</title>
<meta name="description" content="한 문장 설명(120자 안팎)">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"></script>
<link rel="stylesheet" href="../css/style.css">
<script src="../js/common.js"></script>
<style> /* 이 장 전용 스타일(최소한) */ </style>
<!-- Cloudflare Web Analytics -->
<script type='module' src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{"token": "3d6151a0abc94ede89285d462527fa80"}'></script>
<!-- End Cloudflare Web Analytics -->
</head>
<body data-chapter="complex">
<main class="chapter">
  <header class="chapter-hero">
    <div class="eyebrow">Chapter 02</div>
    <h1>복소수는 회전이다</h1>
    <p class="lead">...</p>
    <ul class="objectives"><li>...</li></ul>
    <div class="origin">                                   <!-- "이 수식이 없었다면 못 만들었을 물건" -->
      <div class="o-head"><small>이 수식이 없었다면</small><b>전력망</b></div>
      <div class="o-body"><p>문제 → 왜 기존 도구로 안 되는가 → 이 장의 도구가 어떻게 해결했나 (3~5문장)</p>
        <div class="o-chain"><span>교류 회로 계산</span><i>→</i><span>미분방정식 지옥</span><i>→</i><span class="tool">복소수 페이저</span><i>→</i><span>대수 문제</span></div></div>
    </div>
  </header>

  <section id="intro"><h2>문제에서 시작하는 절 제목</h2> ... </section>   <!-- h2 번호와 우측 목차는 자동 생성 -->
  ...
  <section class="keypoints" id="summary"><h2>핵심 정리</h2><ol><li>...</li></ol></section>
  <section class="quiz-sec" id="quiz"><h2>확인 퀴즈</h2><div class="quiz"> ... </div></section>
</main>
<script> /* 페이지 스크립트: 시뮬레이터마다 (function(){ ... })(); 로 감싼다 */ </script>
</body>
</html>
```
상단바(검색·소리 켜기/끄기 포함), 챕터 서랍, 목차, 이전/다음, 푸터, 테마 토글, 퀴즈 동작, KaTeX 렌더는 `common.js`가 자동 처리한다.
새 챕터는 `common.js`의 `CHAPTERS`에 등록한 뒤 `python3 tools/seo.py`를 실행한다(canonical·OG·JSON-LD와 `sitemap.xml` 생성, 직접 쓰지 않는다).

## 컴포넌트
```html
<figure class="diagram"><svg viewBox="0 0 800 300">...</svg><figcaption><b>그림 2-1.</b> 설명</figcaption></figure>
```
SVG 안 유틸 클래스: `.t .t-dim .t-mono .t-acc`(텍스트), `.s-line .s-axis .s-acc`(선), `.f-surface .f-elev .f-acc .f-acc-soft .f-acc2-soft`(면).

```html
<div class="sim" id="sim-cx-rotate">
  <div class="sim-head"><span class="sim-tag">SIMULATOR</span><h3>제목</h3></div>
  <div class="sim-body side">                                    <!-- side: 넓은 화면에서 컨트롤을 오른쪽에 -->
    <div class="sim-view"><canvas id="cv-rot"></canvas></div>
    <div class="sim-controls">
      <label class="ctrl"><span>각도 θ <output id="th-out"></output></span><input type="range" id="th" min="0" max="360" value="30"></label>
      <div class="ctrl"><span>보기</span><div class="seg" id="mode"><button data-value="vec" class="on">벡터</button><button data-value="grid">격자</button></div></div>
      <label class="ctrl"><span>프리셋</span><select id="preset">...</select></label>
      <label class="check"><input type="checkbox" id="opt"> 옵션</label>
      <div class="btn-row"><button class="btn primary" id="play">▶ 애니메이션</button><button class="btn" id="reset">초기화</button></div>
    </div>
  </div>
  <div class="sim-readout">
    <div class="stat"><span class="k">|z|</span><span class="v" id="o-abs">—</span></div>
  </div>
  <div class="sim-note">해볼 것: ... · 모델: ...</div>
</div>
```
- 시뮬레이터 `id`는 `sim-` 접두사로 시작하고, 한 번 정하면 바꾸지 않는다(포털 실험 검색의 앵커).
- `sim-note`에는 "해볼 것"(구체적 조작 2~3개)과 "모델"(가정·근사)을 적는다.
- 그 밖의 레이아웃: `.pads > button.pad`(큰 선택 버튼 `<b>제목</b><small>부제</small>`), `.big-readout`(큰 숫자), `.sim-msg.ok/.bad`(피드백 줄), `.cards > div`(숫자 카드, `.big`), `.badge(.ok .bad .warn)`, `.compare`(그림 나란히).
- MathBook 전용:
  - `.origin`(장 첫머리 "이 수식이 없었다면" 상자, 위 템플릿 참고), `.problem`(절을 여는 공학 문제 상자, `<div class="problem"><strong>제목</strong><p>…</p></div>`)
  - `.uses > a`(이 도구가 쓰이는 시리즈의 다른 책 링크: `<a href="https://sensorbook.euiyun.com/"><small>SENSORBOOK</small>샷 노이즈<br><span>한 줄 설명</span></a>`)
  - `.mat`(행렬 입력 칸: `<div class="mat" style="--n:2"><input id="a11" value="1">…</div>`)
  - `.split > div > canvas + .cap`(나란히 놓은 캔버스, 왼쪽 위 캡션), `.sim-view .tag-tl`(캔버스 위 라벨)

콜아웃: `<div class="callout">`, `.tip`, `.warn`, `.deep`(심화). 수식: `<div class="formula">$$...$$<div class="where">여기서 ...</div></div>`, 인라인 `\( ... \)`.
표: `<div class="table-wrap"><table>...</table></div>`. 퀴즈:
```html
<div class="quiz-q"><p>질문?</p><div class="opts">
  <button class="opt">보기</button><button class="opt" data-correct>정답</button>
</div><div class="quiz-exp">해설</div></div>
```

## JS 헬퍼 (`js/common.js`, 전역 `MB`)

### 화면·컨트롤 (MusicBook과 같음)
- `MB.canvas(el, (ctx,w,h)=>{}, {aspect:0.5, height, minHeight, maxHeight})` → `{ctx,w,h,canvas,redraw()}` HiDPI, 리사이즈·테마 변경 시 자동 redraw(배경 `--canvas-bg`). **생성 중에 draw가 한 번 동기 호출된다**(그 전에 상태 변수를 선언할 것).
- `MB.chart(ctx, box|null, {x:[a,b], y:[a,b], logX, logY, xLabel, yLabel, series:[{data:[[x,y]],color,width,dash,fill}], vlines, hlines, points, bands, xFmt, yFmt, xTicks, yTicks})` → `{X,Y,box}` 함수 그래프·히스토그램 축.
- `MB.loop(el, (dt,t)=>{})` 화면에 보일 때만 도는 rAF 루프 `{start,stop,toggle,running}`. `MB.throttle(fn)`.
- `MB.range(id, fmt, onInput)` → getter `get()`, `get.set(v)`. `MB.steps(id, list, fmt, initial, onInput)` 이산 눈금 슬라이더. `MB.seg(id, onChange)` → getter. `MB.check(id, onChange)`. `MB.stat(id, html)`. `MB.playButton(id, onStart, onStop, labels)`.
- `MB.palette()` → `{bg,text,dim,faint,grid,axis,border,surface,elev,accent,accent2,ok,warn,bad,red,green,blue,series[]}`, `MB.color('accent')`, `MB.onTheme(cb)`, `MB.isDark()`.
- `MB.clamp/lerp/map/smooth`, `MB.mod(n,m)`, `MB.rng(seed)`(시드 난수, `.range(a,b)`, `.pick(arr)`), `MB.randn()`, `MB.poisson(λ)`, `MB.fmt(x, digits)`, `MB.signed(x,d)`, `MB.nearest(list, v)`.
- `MB.drawWave(ctx, box, data, {color,width,yScale,from,count,axis})` 파형.

### 좌표 평면 (3Blue1Brown식 데모의 핵심)
```js
const pl = MB.plane("#cv-id", {
  x: [-5, 5], y: null,            // y 생략/null → 가로세로 같은 축척(원은 원으로), y:[a,b]로 따로 지정 가능
  aspect: 0.62, gridStep: 1,      // grid:false, axes:false로 끌 수 있다
  points: [{ x: 1, y: 0, color: P.accent, label: "î", snap: 0.5, lock: "y", constrain(p){...}, fixed, hidden }],
  draw(P, api) { /* 생성 중에도 호출된다 → pl이 아니라 api.points 사용 */
    P.arrow(0, 0, api.points[0].x, api.points[0].y, { color: P.P.accent, label: "v", width: 3 });
  },
  onDrag(p, i) { /* 점을 끌 때마다 */ },   onPointer(x, y, "down"|"move"|"up") { /* 빈 곳 클릭·드래그 */ },
});
pl.redraw(); pl.points; pl.view({ x: [-2, 2] }); pl.P // 마지막 draw의 P
```
`P`(그리기 객체): `X(x)/Y(y)`(수학→픽셀), `ix(px)/iy(py)`, `unit`(1단위 px), `P`(팔레트), `x0 x1 y0 y1`, `ctx w h`,
`line(x1,y1,x2,y2,o)`, `arrow(x1,y1,x2,y2,o)`, `dot(x,y,o)`, `circle(x,y,r,o)`, `poly([[x,y]...],o)`, `text(s,x,y,o)`, `curve(fn,o)`(y=f(x)), `param(t=>[x,y],t0,t1,o)`, `grid({step})`, `axes({step})`.
`o` 공통: `{color, width, dash:[4,4], fill, alpha, label, size, bold, align, baseline, dx, dy, r, head, close, stroke:false, from, to, n}`.
드래그 점이 있는 캔버스는 자동으로 `touch-action:none`이 걸린다. 모바일에서 점을 잡기 쉽도록 반지름 7px 이상.

### 수학
- 복소수 `MB.cx`: `[re, im]` 배열. `of polar add sub mul div scale conj abs arg exp cis sqrt str`.
- 행렬 `MB.mat`(행 배열의 배열): `identity mul apply transpose det inv solve`, `eig2(A)` → `{values:[λ1,λ2]|null, complex:[re,im]|null, vectors}`, `eigSym(A)` 대칭 행렬 야코비 고유분해(내림차순), `svd(A)` → `{U, S, V}`(m×n, 64×64 이미지까지 즉시).
- ODE: `MB.rk4(f, y0, t0, dt, n)` / `MB.euler(...)` → `[[t, y[]], ...]`.
- 통계: `MB.normPdf(x,mu,s)`, `MB.normCdf`, `MB.erf`, `MB.lgamma`, `MB.poissonPmf(k,λ)`, `MB.binomPmf(k,n,p)`, `MB.mean`, `MB.std`, `MB.histogram(data, bins, [lo,hi])` → `{counts, edges, width}`.
- FFT: `MB.fft(re, im, inverse)` 제자리 radix-2, `MB.fft2(re, im, n, inverse)` n×n, `MB.fftshift(a, n)`, `MB.WINDOWS`, `MB.spectrum(samples, win, n)` → dB, `MB.db/undb`.
- 수 표현: `MB.float64Bits(x)` → `{sign, exp, frac, hex}`, `MB.f32(x)`.
- 수식: `MB.texMat(A, digits)` → TeX 행렬 문자열, `MB.tex(el|id, tex, display)` 동적 수식 렌더(KaTeX 없으면 원문).

### 이미지
- `MB.testImage(n, "scene"|"rings"|"bars"|"text"|"face")` → n×n Float64Array(0..1). 외부 사진 대신 쓴다.
- `MB.drawGray(ctx, data, w, h, dx, dy, dw, dh, {map, smooth})` 배열을 픽셀로 그린다(`map: v=>[r,g,b]`이면 색).
- `MB.colormap(t, "viridis"|"diverge"|"phase")` → `[r,g,b]`, `MB.rgb([r,g,b])` → CSS 문자열.

### 소리(선택)
- `MB.ctx()` AudioContext(**클릭 핸들러 안에서** 처음 부른다), `MB.tone(freq, dur, {gain, type, when})` → `{release()}`, `MB.playBuffer(float32, sr, {loop, gain})` → `{release()}`, `MB.stopAll()`.
- 소리는 반드시 사용자 클릭 안에서 시작하고, 사인파는 gain 0.2 이하로 둔다. 계속 울리는 소리에는 정지 버튼.

같은 공식을 장마다 다시 쓰지 않는다. 장 고유의 모델(예: SIR, 해밍 부호, 박막 전달 행렬)은 해당 장 페이지 스크립트에 둔다.

## 검사
```bash
python3 tools/seo.py      # 메타·sitemap 갱신
node tools/check.mjs      # (Playwright) 모든 페이지를 열어 콘솔 오류·가로 스크롤·시뮬레이터 수를 점검
node tools/check.mjs complex   # 한 장만
```

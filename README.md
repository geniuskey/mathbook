# MathBook — 문제에서 출발하는 수학 교과서

수학 개념을 **"어떤 공학 문제 때문에 필요했는가"**로 배우는 엔지니어와 공대생을 위한 한국어 인터랙티브 교과서입니다.
교과서 순서(정의 → 정리 → 예제)가 아니라 **문제 → 막힘 → 도구 → 다시 문제** 순서로 씁니다. 각 장은 "이 수식이 없었다면 못 만들었을 물건"(전력망, MRI, QR 코드 …)으로 시작하고, 수식을 조작하기보다 **그림을 직접 끌어서**(3Blue1Brown 스타일) 기하적 직관을 만듭니다.

MusicBook · SensorBook · OpticsBook 등과 같은 [시리즈](https://books.euiyun.com/)이며, 시리즈 전체의 "더 깊이" 링크가 모이는 **공통 기반 층**입니다. 책별로 어떤 장을 쓰는지는 13장의 [도구 지도](chapters/glossary.html#tool-map)에 있습니다.

## 실행
빌드 과정이 없는 정적 사이트입니다.

```bash
python3 -m http.server 8000   # → http://localhost:8000
```
`index.html`을 브라우저로 바로 열어도 동작합니다. KaTeX와 웹 폰트는 CDN에서 불러오며, 없으면 수식이 원문으로, 글꼴이 시스템 글꼴로 표시됩니다.

## 구성
| 장 | 파일 | 이 수식이 없었다면 | 주제 |
|---|---|---|---|
| 01 | chapters/limits.html | 계산기의 sin 버튼 | 제논의 역설, 급수의 수렴·발산, ε–δ = 공차 계약, 미분·적분, e, 테일러 급수 |
| 02 | chapters/complex.html | 교류 전력망 | i = 90° 회전, 오일러 공식, 페이저와 임피던스, 역률, 박막 간섭(반사 방지 코팅) |
| 03 | chapters/linalg.html | 스마트폰 카메라의 색 | 행렬 = 변환, 행렬식, 색 보정 행렬(CCM), 고유값 = 공진 모드, SVD 이미지 압축 |
| 04 | chapters/ode.html | 칩 방열 설계 | 1차 시스템(RC·냉각·약물), 기울기장, 감쇠 진동과 공진, SIR, 열확산 방정식 |
| 05 | chapters/fourier.html | MRI | 에피사이클, 감기 기계, FFT, 2D 푸리에, 렌즈 = 푸리에 변환기(PSF·MTF), JPEG, k-공간 |
| 06 | chapters/sampling.html | 디지털 오디오 | 수레바퀴 효과, 에일리어싱, 표본화 정리와 sinc 복원, 모아레, 양자화와 디더 |
| 07 | chapters/probability.html | 야간 사진의 잡음 | 포아송 = 샷 노이즈, 중심극한정리 = 공정 산포, Cpk, 베이즈 불량 판정, 수율 모델 |
| 08 | chapters/information.html | QR 코드 | 정보량과 엔트로피, 허프만 부호, 채널 용량, 해밍 부호, 리드–솔로몬(다항식 보간) |
| 09 | chapters/optimization.html | 신경망 학습 | 경사 하강(지형 위 공 굴리기), 모멘텀·Adam, 볼록성, 최소제곱, 라그랑주 승수 = 제약의 가격 |
| 10 | chapters/numerics.html | 패트리어트 미사일 사건 | 부동소수점, 상쇄 오차, 수치 미분, 유한 차분과 CFL, FDTD, RCWA, 조건수 |
| 11 | chapters/geometry.html | 문서 스캔 앱 | 위상 불변량, 곡률과 가우스 곡률, 지도 투영, 호모그래피, 렌즈 수차 |
| 12 | chapters/symmetry.html | 실리콘 웨이퍼 | 이면체군, 치환의 홀짝성(15 퍼즐), 벽지 무늬 17종, 결정학적 제약, 밀러 지수 |
| 13 | chapters/glossary.html | — | 책별 수학 도구 지도, 용어집, 종합 퀴즈 |

공통 코드: `css/style.css`(디자인 토큰, 라이트/다크, `.origin`·`.problem`·`.uses`·`.mat` 등 MathBook 컴포넌트), `js/common.js`(전역 `MB`: 레이아웃·검색, 캔버스·차트, 드래그 가능한 좌표 평면 `MB.plane`, 복소수 `MB.cx`, 행렬·고유값·SVD `MB.mat`, ODE `MB.rk4`, FFT·2D FFT, 확률 분포, 시험 이미지·색 지도, 간단한 소리).
챕터 작성 규칙과 `MB` API는 [CONTRIBUTING.md](CONTRIBUTING.md)를 참고하세요.

```bash
python3 tools/seo.py        # canonical/OG/JSON-LD 태그와 sitemap.xml 갱신
node tools/check.mjs        # Playwright로 전 페이지 콘솔 오류·360px 가로 스크롤·시뮬레이터 조작 점검
npm ci && npm run build     # 배포물(.book-dist/) 생성 — @euiyun/book
```

시뮬레이터의 수치는 원리를 보여 주기 위한 교육용 모델입니다. 각 시뮬레이터 아래(`sim-note`)에 모델의 가정을 적었습니다.

## 다른 책에서 링크하기
각 절의 `id`는 의미 있는 영어 슬러그(예: `complex.html#phasor`)이고, 시뮬레이터 `id`는 `sim-` 접두사입니다. 한 번 정한 id는 바꾸지 않으므로 다른 책의 "더 깊이" 링크에 그대로 쓸 수 있습니다.

## 배포
`main`에 푸시하면 GitHub Actions(`.github/workflows/pages.yml`)가 `@euiyun/book`으로 `.book-dist/`를 만들어 GitHub Pages에 배포합니다. `CNAME`은 `mathbook.euiyun.com`입니다.

## 라이선스

코드는 [MIT](LICENSE-MIT), 교재 콘텐츠는 [CC BY 4.0](LICENSE-CC-BY-4.0)으로 제공됩니다. 적용 범위와 재사용 조건은 [라이선스 안내](LICENSE.md)를 참고하세요.

---
title: "모두의 입시 AI"
slug: "modoo-ipsi-ai"
order: 1
category: "company"
company: "(주)이노스피치"
period: "2025.12 ~ 2026.10"
tagline: "AI 모의면접 웹 서비스"
summary: "생기부 기반 AI 모의면접, 생기부 분석, 학교/학과 탐색 등의 기능을 통해 대학입시 준비를 할 수 있는 웹 플랫폼"
stack: ["React", "TypeScript", "Vite", "Zustand", "Tailwind"]
thumbnail: "/projects/modoo-ipsi-ai/cover-f988a9bf.jpg"
# 프로젝트 목록 카드 오른쪽에 보이는 대표 화면
preview: "/projects/modoo-ipsi-ai/09.jpg"
links: [{"label": "웹사이트", "url": "https://www.modu-ipsi.com/"}]
status: ""
notionId: "33133aa8-a192-8061-b574-fdfe6beeefe6"
# team·myRole은 상세 페이지와 챗봇에, interviewQA는 챗봇에만 사용
team: "프론트엔드 1명(본인), 백엔드 1명"
myRole: "프론트엔드 전담. 영업팀이 가져온 아이디어를 바탕으로 기획을 구체화하고 Figma로 화면을 직접 디자인한 뒤, 로그인·회원가입·마이페이지를 포함한 모든 메뉴의 화면과 기능을 구현하고 S3 + CloudFront 배포까지 담당"
interviewQA:
  - question: "API 에러 처리는 어떤 기준으로 설계했나요?"
    answer: "서버가 HTTP 200으로 응답하면서 본문의 result_code에 HTTP 의미를 담는 구조라서, \"result_code가 2xx면 성공, 나머지는 전부 에러\"라는 규칙 하나로 정리했습니다. 처리 중을 뜻하는 202도 정상 응답이라 단순히 200인지만 비교하면 안 됐기 때문입니다. axios 인스턴스 하나에 이 규칙과 공통 에러 처리를 모았고, 401이면 스토어를 초기화한 뒤 로그인 화면으로 보내도록 했습니다."
  - question: "오래 걸리는 작업은 어떻게 처리했나요?"
    answer: "생기부·이력서 예상 질답 생성은 동기 호출로는 타임아웃 위험이 커서, 작업을 생성한 뒤 10초 간격으로 상태를 확인하는 폴링 구조로 바꿨습니다. 최대 10분까지만 확인하도록 상한을 두었고, 호출할 API만 주입받는 공통 훅으로 만들어 생기부와 이력서가 같은 코드를 쓰게 했습니다. 화면을 떠나면 폴링을 멈추고, StrictMode의 이중 마운트에도 대비했습니다."
---

### 📱 AI모의면접 웹 서비스

생기부 기반 AI 모의면접, 생기부 분석, 학교/학과 탐색 등의 기능을 통해 대학입시 준비를 할 수 있는 웹 플랫폼

### 🛠️ 사용 기술

- 프론트엔드 : React 19, TypeScript, Vite 8
- 라우팅·데이터 : TanStack Router(파일 기반 라우팅), TanStack Query, Zustand(`persist` + sessionStorage 일부)
- 스타일·폼 : Tailwind CSS 4, React Hook Form, Zod
- 라이브러리 : html2canvas-pro, jsPDF, Chart.js

### 👩‍💻 개발 사항

- **라우팅·인증 가드** — TanStack Router 파일 기반 라우팅 + `autoCodeSplitting`. `_authenticated` 레이아웃 `beforeLoad`에서 비로그인 리다이렉트와 사용제한(`usage_type: DISABLE`) 유저의 제한 메뉴 직접 진입 차단을 한 곳에서 처리
- **API 계층** — axios 인스턴스 1개에 `result_code` 기반 공통 에러 처리(2xx만 성공), 브랜딩된 API 에러 객체, 401 시 스토어 초기화 후 로그인 이동, 화면이 직접 에러를 그리는 API는 alert만 억제, FormData 자동 multipart, dev 환경 전용 요청·응답 로깅
- **AI 면접 세션 6종** (생기부·이력서·대학기출·MMI·제시문·꼬리질문) — 백엔드 생성 TTS 재생 → 녹음 → WAV 변환 → STT → 피드백까지의 단계형 세션, MediaPipe Face/Pose 기반 시선·자세 실시간 피드백, 면접관 영상(대기/질문/답변/피드백) 선로딩 및 재생, 세션 이탈 시 스트림·타이머·랜드마커 정리
- **비동기 질답 생성** — 생기부·이력서 예상 질답을 작업 생성 → 10초 주기 폴링(최대 10분) 구조로 전환, API만 주입해 도메인별로 재사용하는 공통 훅으로 추상화
- **결과 리포트 PDF·메일** — `html2canvas-pro` + `jsPDF`로 결과 화면을 A4 폭에 맞춰 캡처하고, 세로 초과분은 슬라이스해 다음 페이지로 이어 붙인 뒤 base64로 메일 API 연동(`fileType`으로 png/pdf 분기)
- **대입 합격진단** — 수시(내신 환산)·정시(수능 환산) 진단 화면, 엑셀 양식 업로드/수기 입력 두 경로의 내신 성적 CRUD, chart.js 기반 대학·학과 통계 차트
- **탐색·검사·마이페이지** — AI 학과 탐색, 학교/학과 정보 검색, 교과 세특 추천 도서, 결정 트리 기반 진로적성검사, 이용권·잔여 횟수·리포트 관리
- **키오스크·접근 환경 대응** — `?kiosk=1` 세션 유지형 키오스크 모드와 한글 가상 키보드, SPA용 경로별 `document.title`·robots 제어
- **배포** — S3 + CloudFront, prod/dev 분리 빌드(`VITE_DEPLOY_ENV`로 배포본 로그 노출 제어)

### 💡 프로젝트 회고

#### API 에러 규칙

> 서버가 HTTP 200으로 내려주면서 본문 `result_code`에 HTTP 시맨틱을 쓰는 구조라, **"2xx 패턴이면 성공, 나머지는 전부 에러"** 로 규칙을 하나로 정리했다(처리중을 뜻하는 202도 정상 응답이라 단순 `=== 200` 비교로는 안 됐다).

#### 브라우저 미디어·면접 세션 라이프사이클

> `ready → answering → transcribing → done`에 가까운 **단계 전이**로 세션을 모델링했다. TTS 재생 완료 후 녹음 시작, 녹음 종료 후 STT, 피드백 영상 재생 완료를 기다렸다가 다음 단계로 — 각 전이를 Promise로 묶어 순서가 어긋나지 않게 했다.
> 언마운트·이탈 시 `getTracks().stop()`, 분석 인터벌 `clearInterval`, 랜드마커 `close()`를 모두 정리한다. **정리를 빠뜨리면 페이지를 떠난 뒤에도 카메라 LED가 켜져 있는 게 사용자에게 그대로 보인다.** 리소스 누수 중 가장 티가 나는 종류라 우선순위를 높게 뒀다.
> 녹음 포맷은 브라우저마다 달라 `MediaRecorder.isTypeSupported`로 고르고, 업로드 전에 **WAV(16kHz·모노·16bit)로 변환**한다. 백엔드가 클라이언트 파일명을 그대로 임시파일로 쓰는 구조라 확장자와 실제 컨테이너가 어긋나면 디코딩이 500으로 떨어져서, `Blob.type`에서 확장자를 역산해 파일명을 만드는 처리를 추가했다.

#### MediaPipe 기반 실시간 피드백

> 시선 피드백 ON일 때만 `FaceLandmarker`/`PoseLandmarker`를 GPU delegate로 로드하고 주기 분석한다. OFF면 아예 로드하지 않고 이미 떠 있으면 닫는다 — **기능 토글이 곧 리소스 토글**이 되도록 했다.
> 디바이스 부담이 달라서 `pointer: coarse` 등으로 모바일류를 판정해 **분석 주기(데스크탑 500ms / 모바일 750ms)와 카메라 해상도 제약을 분기**했다. 탭이 백그라운드일 땐 분석을 건너뛴다. 피드백 문구별 카운트를 누적해 결과 화면 비율로 환산한다.

#### 면접관 영상 선로딩

> `import.meta.glob`으로 mp4 에셋을 스캔하고 **파일명 규칙(모드·언어·버전·단계)을 파싱**해 매핑한다. 에셋을 추가하면 코드 수정 없이 버전 목록에 자동 편입된다.
> setup 모달에서 옵션을 고르는 동안 미리 영상을 preload하고, confirm 시 **preload와 질문 생성 API를 `Promise.all`로 병렬 대기**한다. 시선 피드백 OFF면 3단계, ON이면 5단계만 받아 불필요한 다운로드를 줄였다. 모달에서 고른 버전과 실제 세션 버전이 달라지면 preload가 무의미해져서, 옵션 조합 단위로 버전을 pin 해두고 confirm 시점에 영상과 무관한 옵션(녹음 시간 등)만 최신값으로 재구성한다.

#### PDF 생성·메일 첨부

> 결과 화면 캔버스를 A4 폭에 맞추고 **세로가 페이지를 넘으면 픽셀 단위로 잘라 다음 페이지로** 이어 붙인다. JPEG 품질 0.92로 용량과 화질을 맞췄고, 최종 PDF를 base64로 만들어 메일 API에 넘긴다

#### 장시간 작업의 비동기화

> 예상 질답 생성은 동기 호출로는 타임아웃 위험이 커서 **작업 생성 → 상태 폴링(10초 간격, 10분 상한)** 구조로 바꿨다. 호출할 API를 주입받는 공통 훅으로 만들어 생기부·이력서가 같은 코드를 쓴다. 언마운트 시 폴링을 중단하고, StrictMode 이중 마운트에 대비해 마운트 시 취소 플래그를 복구한다.

#### SPA의 SEO

> 정적 `index.html`의 `<title>` 하나로는 모든 페이지 제목이 같아지고, 그러면 **검색엔진이 결과 제목을 임의로 다시 쓴다.** 라우트 경로에 따라 `document.title`과 robots 메타를 갱신하고 sitemap에 공개 페이지를 관리하는 식으로 대응했다.

---

### 📌 주요 기능

![모두의 입시 AI 화면 1](/projects/modoo-ipsi-ai/01.png)
![모두의 입시 AI 화면 2](/projects/modoo-ipsi-ai/02.png)
![모두의 입시 AI 화면 3](/projects/modoo-ipsi-ai/03.png)
![모두의 입시 AI 화면 4](/projects/modoo-ipsi-ai/04.png)
![모두의 입시 AI 화면 5](/projects/modoo-ipsi-ai/05.png)
![모두의 입시 AI 화면 6](/projects/modoo-ipsi-ai/06.png)
![AI 모의면접 및 질답생성 기능](/projects/modoo-ipsi-ai/07.png)
![AI 모의면접 및 질답생성 기능](/projects/modoo-ipsi-ai/08.png)
- AI 모의면접 및 질답생성 기능
![진로적성 검사 질문 화면](/projects/modoo-ipsi-ai/09.jpg)
- 진로적성 검사 질문 화면
- 질문의 답변에 따라 프론트에서 결과 도출 (트리 형식으로 로직 구현)

![진로적성 검사 결과 화면](/projects/modoo-ipsi-ai/10.jpg)
- 진로적성 검사 결과 화면
![학교/학과 정보 조회 기능](/projects/modoo-ipsi-ai/11.jpg)
- 학교/학과 정보 조회 기능

![chart.js 사용하여 차트 구현](/projects/modoo-ipsi-ai/12.png)
- chart.js 사용하여 차트 구현
![폼 입력 구현](/projects/modoo-ipsi-ai/13.jpg)
- 폼 입력 구현
- 파일 업로드 구현
![10개씩 페이징 처리](/projects/modoo-ipsi-ai/14.jpg)
- 10개씩 페이징 처리
- 검색바 구현
![그 외의 로그인/회원가입/마이페이지 구현](/projects/modoo-ipsi-ai/15.jpg)
- 그 외의 로그인/회원가입/마이페이지 구현
- 모든 메뉴 화면 및 기능 구현

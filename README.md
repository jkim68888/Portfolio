# Portfolio

프론트엔드 개발자 김지현의 포트폴리오 사이트입니다. 프로젝트 소개와 함께, 면접관이 "이 프로젝트에서 무엇을 했나요?"라고 물으면 **제가 1인칭으로 답하는 AI 챗봇**이 붙어 있습니다.

챗봇은 **제 MacBook에서 직접 운영하는 로컬 LLM**으로 답하고, Mac이 꺼져 있거나 답변이 느리면 **호스팅 API(Claude)** 로 넘어갑니다.

## 진행 계획

[`docs/PLAN.md`](docs/PLAN.md)에 이 사이트를 만든 계획과 진행 기록을 정리했습니다. 1주(2026-10-15 ~ 10-21)로 계획했고, 실제로는 4일(10/15 ~ 10/18) 동안 작업했습니다.

- **확정 사항:** 프로젝트 범위, 챗봇 화자, LLM 구성 등 시작 전에 정한 것
- **챗봇 LLM 구성:** 엔진 전환 규칙, 아키텍처, 엔진별 컨텍스트 전략, 운영 비용, Mac 운영 조건
- **1주 일정과 진행 현황:** 날짜별 목표와 실제로 끝낸 것, 일정이 밀릴 때 뒤로 미룰 순서
- **단계별 체크리스트:** 준비 → 셋업 → 콘텐츠 → 로컬 LLM → 화면 → 챗봇 서버·UI → 대화 로그 → 검증·마무리

## 기술 스택

| 영역 | 사용 기술 |
| --- | --- |
| 프레임워크 | Next.js 16 (App Router, Cache Components), React 19, TypeScript |
| 스타일 | Tailwind CSS 4, Pretendard |
| 콘텐츠 | 마크다운 + frontmatter (gray-matter, Zod 검증), react-markdown |
| 로컬 LLM | Ollama + gemma4:e4b (MacBook Pro M1 Pro 16GB), 인증 프록시, Tailscale Funnel |
| 호스팅 API | Claude Haiku 5.5 (`@anthropic-ai/sdk`) |
| 요청 제한·대화 로그 | Upstash Redis |
| 배포 | Vercel |

## 구조

```
[브라우저] ──▶ [Vercel: /api/chat]
                  │ engine = local | cloud
                  │ 로컬 상태 확인 (타임아웃 3초, 결과 온라인 30초·오프라인 5초 캐시)
                  ├─▶ 로컬 가능 → Tailscale Funnel ─▶ [Mac: 인증 프록시 ─▶ Ollama]
                  └─▶ 로컬 불가 / cloud 선택 → [Claude API (Haiku 5.5)]
                  │
                  └─ 응답(NDJSON) 맨 앞에 { engine, model, fallbackReason } 전송
```

```
content/           프로젝트·프로필 마크다운 (화면과 챗봇이 같은 원본을 사용)
src/app/           홈, 프로젝트 상세(정적 생성), /api/chat, /api/llm-status
src/components/    화면 컴포넌트, chat/ (챗봇 패널·세션 훅)
src/lib/chat/      프롬프트, 컨텍스트 선택, 두 엔진, 요청 제한·로그
local-llm/         Mac에서 도는 인증 프록시와 launchd 설치 스크립트
scripts/           Notion 추출, 이미지 가져오기, 벤치마크, 답변 점검, 로그 조회
docs/              진행 계획(PLAN.md), 모델 비교·답변 점검 결과(benchmarks/)
```

## 설계 결정

### 1. 로컬 LLM + 호스팅 API 하이브리드

로컬 LLM을 기본으로 쓰면 운영 비용이 거의 들지 않고, 모델을 고르고 직접 운영하는 과정을 보여줄 수 있습니다. 대신 Mac 상태에 따라 답을 못 할 수 있어서 전환 규칙을 두었습니다.

| 상황 | 답변 엔진 | 화면 표시 |
| --- | --- | --- |
| Mac 켜짐 (기본) | 로컬 LLM | 🖥️ 로컬 · gemma4:e4b on MacBook |
| 사용자가 "빠른 답변" 선택 | 호스팅 API | ☁️ Claude Haiku 5.5 |
| Mac 꺼짐·연결 불가 | 호스팅 API로 자동 전환 | "로컬 LLM이 오프라인이라 클라우드로 답변합니다" |
| 로컬 답변 도중 끊김 | 받은 글을 버리고 클라우드로 다시 답변 | "연결이 끊겨 클라우드로 다시 답변합니다" |
| 첫 글자가 5초 넘게 늦음 | 로컬 대기 | 전환 버튼 강조 |

- 두 엔진의 응답을 같은 이벤트 형식(`meta → delta… → done/error`)으로 맞춰, 화면은 엔진 종류와 상관없이 같은 방식으로 그립니다. (`src/lib/chat/protocol.ts`)
- 메시지마다 어떤 엔진이 몇 초 걸려 답했는지 라벨로 남깁니다.

### 2. 로컬 모델 선정

M1 Pro 16GB에서 돌릴 수 있는 후보 3개를 실제 챗봇과 같은 프롬프트, 같은 질문 12개로 비교했습니다. (`npm run llm:benchmark`, 결과: [`docs/benchmarks/local-llm-2026-10-16.md`](docs/benchmarks/local-llm-2026-10-16.md))

| 모델 | 첫 글자 평균 | 첫 글자 최대 | 생성 속도 | 메모리 | 사실 정확도 |
| --- | --- | --- | --- | --- | --- |
| exaone3.5:7.8b | 3.8초 | 16.3초 | 21.5 tok/s | 5.8 GB | React와 React Native 혼동 |
| qwen3.5:9b | 11.3초 | 36.7초 | 18.1 tok/s | 7.7 GB | 일부 과장 |
| **gemma4:e4b** | 5.0초 | 10.1초 | 25.6 tok/s | 9.4 GB | 가장 정확 |

정확도와 속도가 가장 좋은 gemma4:e4b(Apache 2.0)로 정했고, 메모리를 가장 많이 쓰는 점은 감수했습니다. thinking이 기본으로 켜져 있어 호출할 때 `think: false`를 넘깁니다.

### 3. 엔진별 컨텍스트 전략 (RAG 대신 프롬프트 주입)

프로젝트가 11개뿐이라 검색(RAG) 없이 프로젝트 내용을 시스템 프롬프트에 직접 넣습니다. 다만 로컬 모델은 프롬프트가 길수록 첫 글자가 크게 늦어져서 엔진마다 양을 다르게 합니다. (`src/lib/chat/prompt.ts`, `context.ts`)

| 엔진 | 시스템 프롬프트 |
| --- | --- |
| 호스팅 API | 전체 프로젝트 상세 + 프롬프트 캐싱 |
| 로컬 LLM | 전체 요약 목록 + 관련 프로젝트 1~2개만 상세 |

관련 프로젝트는 ① 상세 페이지에서 연 채팅이면 그 프로젝트 ② 최근 질문 3개에 나온 프로젝트명·회사명·기술명(2개 이하 프로젝트에만 쓰인 기술만) ③ 없으면 요약 목록만 쓰는 순서로 고릅니다.

### 4. Ollama를 외부에 공개할 때의 보안

Ollama에는 자체 인증이 없어서 그대로 공개하면 누구나 제 Mac의 모델을 쓰거나 다른 모델을 내려받게 할 수 있습니다. (`local-llm/proxy.mjs`)

- Mac에 인증 프록시를 두고, Tailscale Funnel로는 **프록시만** 공개합니다.
- 비밀키(`Authorization: Bearer`)를 상수 시간 비교로 확인하고, `POST /api/chat`·`GET /health`만 통과시킵니다. 모델도 프록시에서 고정합니다.
- 비밀키와 Mac 주소는 Vercel 서버 환경 변수에만 있고 브라우저로 보내지 않습니다.
- 16GB 메모리라 한 번에 한 질문만 Ollama로 보내고, 나머지는 차례를 기다리게 합니다.
- `launchd`로 재부팅 후 자동 실행하고, 전원 연결 중에는 `caffeinate`로 잠들지 않게 합니다.

### 5. 요청 제한과 비용 상한

| 장치 | 내용 |
| --- | --- |
| 요청 제한 | 방문자(IP 해시)당 분 6회, 일 60회 (Upstash Ratelimit, 초과 시 429) |
| 입력 제한 | 메시지 1,000자, 대화 20개, 마지막은 질문 (Zod) |
| 프롬프트 캐싱 | 질문마다 같은 시스템 프롬프트를 캐시해 비용과 지연을 줄임 |
| 답변 길이 | 프롬프트에서 400자 이내로 제한, `max_tokens`는 상한 역할만 |
| 월 사용 한도 | Anthropic Console에서 설정 |

Redis 장애가 답변을 막지 않도록, 요청 제한은 실패하면 통과시키고 대화 로그는 응답이 끝난 뒤 `after()`로 저장합니다. 로그에는 IP 대신 해시만 남깁니다.

### 6. 지어낸 답변·프롬프트 인젝션 대응과 검증

1차 벤치마크에서 연봉 질문에 숫자를 지어내고, 자료에 없는 일반론을 덧붙이는 문제가 있었습니다.

- 자료에 없는 질문과 연봉·처우 질문에는 **정해진 문장을 그대로** 답하게 합니다.
- 작은 모델이 긴 자료를 읽은 뒤 규칙을 잊지 않도록 자료 뒤에 핵심 규칙을 한 번 더 둡니다.
- 규칙을 바꾸라는 요청, 포트폴리오와 관계없는 질문(사생활, 코드 작성 부탁)은 사양합니다.
- 검증: `npm run chat:eval`로 질문 30개와 엣지 케이스 7개를 두 엔진에 같은 컨텍스트로 보내고, 답변을 자료와 대조합니다. 결과: [`docs/benchmarks/`](docs/benchmarks/)

### 7. 정적 생성과 검색 노출

모두의 입시 AI(SPA)에서는 정적 `index.html` 하나로 모든 페이지 제목이 같아지는 SEO 문제를 겪었습니다. 이 사이트는 홈과 프로젝트 상세를 **SSG(Static Site Generation, 배포 전 빌드할 때 페이지 HTML을 미리 만들어 두는 방식)** 로 만들어 페이지마다 제목·설명이 HTML에 들어 있고(링크 미리보기용 OG 이미지 포함), 첫 화면도 빠르게 뜹니다.

다만 지원용 사이트라 **링크를 받은 사람만 보도록** 검색 노출은 막았습니다. `robots` 메타와 모든 경로의 `X-Robots-Tag` 헤더로 noindex를 걸고, sitemap은 만들지 않습니다. (robots.txt로 크롤링 자체를 막으면 noindex를 읽지 못해 오히려 노출될 수 있어서 막지 않습니다.)

## 로컬에서 실행

```bash
npm install
cp .env.example .env.local   # 값 채우기 (없으면 챗봇은 클라우드만, 요청 제한·로그는 건너뜀)
npm run dev
```

| 스크립트 | 설명 |
| --- | --- |
| `npm run content:export` | Notion에서 프로젝트 본문을 마크다운으로 추출 |
| `npm run llm:proxy` | Mac에서 인증 프록시 실행 (`local-llm/.env` 필요) |
| `npm run llm:benchmark` | 로컬 모델 후보 비교 |
| `npm run chat:eval` | 두 엔진 답변 점검 |
| `npm run chat:logs` | 대화 로그 조회 |
| `npm run og:build` | OG 이미지 생성 |

### 환경 변수

| 이름 | 설명 |
| --- | --- |
| `ANTHROPIC_API_KEY` | 호스팅 API 키 |
| `LOCAL_LLM_URL`, `LOCAL_LLM_SECRET` | Funnel로 공개한 인증 프록시 주소와 공유 비밀키 |
| `LOCAL_LLM_MODEL` | 로컬 모델 (기본 `gemma4:e4b`) |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | 요청 제한·대화 로그 |

---
title: "저축하나로"
slug: "saving-hanaro"
order: 3
category: "company"
company: "(주)피카로카"
period: "2023.03 ~ 2024.05"
tagline: "예적금 포트폴리오"
summary: "예적금 상품의 금리 비교와 포트폴리오 만들기를 통한 내 예적금 수익 예측이 가능한 핀테크 어플리케이션"
stack: ["Swift", "UIKit", "WebView", "React"]
thumbnail: "/projects/saving-hanaro/cover.jpg"
# 프로젝트 목록 카드 오른쪽에 보이는 대표 화면
preview: "/projects/saving-hanaro/03.jpg"
links: []
status: "회사가 폐업하면서 앱이 스토어에서 내려가 현재는 앱 링크가 없음"
notionId: "27633aa8-a192-8114-a8d1-edc9799b83bd"
# team·myRole은 상세 페이지와 챗봇에, interviewQA는 챗봇에만 사용
team: "iOS 1명(본인), Android 1명, 웹 프론트엔드 1명, 백엔드 1명, CTO 1명"
myRole: "iOS 전담. React.js로 개발된 웹을 WKWebView로 패키징해 iOS 앱으로 출시하고, 애플 로그인·탈퇴, 웹뷰 JS 브릿지, 웹 쿠키 동기화 같은 네이티브 기능을 구현. React.js 웹 유지보수도 함께 진행"
interviewQA:
  - question: "웹과 네이티브 사이의 JS 브릿지는 어떻게 구현했나요?"
    answer: "WKScriptMessageHandler를 사용했습니다. 웹에서 애플 로그인 버튼을 누르면 window.webkit.messageHandlers로 네이티브에 메시지를 보내고, 앱은 등록해 둔 핸들러에서 메시지를 받아 애플 로그인을 진행합니다. 로그인이 끝나면 evaluateJavaScript로 웹의 함수를 호출해 결과 토큰을 다시 웹에 전달했습니다."
  - question: "하이브리드 앱을 개발하면서 느낀 장단점은 무엇인가요?"
    answer: "웹 기반 UI라 플랫폼 간 코드를 재사용할 수 있어 개발이 빠르고, 웹 내용을 바꾸면 앱스토어 배포 없이 바로 반영할 수 있다는 점이 장점이었습니다. 반면 완전한 네이티브 앱과는 사용자 경험에 미묘한 차이가 있고, 네이티브와 웹 사이에서 생긴 문제는 원인을 찾기 어려웠습니다. iOS Safari와 WKWebView의 동작 차이에도 따로 대응해야 했습니다."
  - question: "네이티브 대신 웹뷰 기반 하이브리드 앱으로 결정한 이유는 무엇인가요?"
    answer: ""
  - question: "웹 프론트엔드 개발자와 JS 브릿지 인터페이스는 어떻게 맞췄나요?"
    answer: ""
---

### 📱 예적금 포트폴리오

예적금 상품의 금리 비교와 포트폴리오 만들기를 통한 내 예적금 수익 예측이 가능한 핀테크 어플리케이션

### 🛠️ 사용 기술

- UIkit, Swift5 
- WKWebView, WebCookie, WKScriptMessageHandler
- Apple Login SDK

### 👩‍💻 개발 사항

- 웹뷰 JS 브릿지 구현
- 웹 쿠키 동기화
- 애플 로그인 및 탈퇴 구현 
- React.js로 개발된 웹 유지보수 진행 

### 💡 프로젝트 회고

#### 하이브리드 앱

> 장점
> - **빠른 개발 속도**: 웹 기반 UI로 플랫폼 간 코드 재사용성 확보
> - **유연한 업데이트**: 웹 콘텐츠 변경 시 앱스토어 배포 없이 즉시 반영 가능

> 단점
> - **네이티브 UX 한계**: 완전한 네이티브 앱 대비 사용자 경험의 미묘한 차이
> - **디버깅의 복잡성**: 네이티브-웹 간 이슈 발생 시 원인 파악의 어려움
> - **플랫폼별 차이**: iOS Safari와 WKWebView 간 미묘한 동작 차이 대응 필요

#### JS 브릿지

> **WKScriptMessageHandler 활용**
> - 웹뷰를 만들 때 애플 로그인용 메시지 핸들러를 등록해, 웹에서 네이티브로 메시지를 보낼 수 있는 통로를 만듦

> 플로우1. JS → Swift
> - 웹에서 애플 로그인 버튼을 누르면, 등록해 둔 핸들러 이름으로 네이티브에 메시지를 보냄
> - 앱은 메시지 이름을 확인한 뒤, 함께 넘어온 데이터를 가지고 애플 로그인을 시작함

> 플로우2. Swift → JS
> - 애플 로그인이 끝나면 `evaluateJavaScript`로 웹 쪽 함수를 호출해 결과 토큰을 웹에 전달
> - 웹은 받은 토큰으로 로그인 처리를 이어감

#### 쿠키 동기화

> 작업 계기
> - 마케팅 링크를 타고 들어온 유저를 구분해 마케팅 성과 측정에 활용해야 했음

> WKHTTPCookieStore 활용
> - 웹뷰의 기본 데이터 저장소에 있는 쿠키 저장소를 이용해 쿠키를 조회·저장·삭제하는 기능을 WKWebView 확장으로 묶어 재사용
> - 마케팅 링크로 들어온 유저라는 정보를 쿠키에 저장
> - 딥링크로 앱이 열리면 쿠키에서 해당 값을 조회해, 마케팅 유입 유저인지 판단하는 데 활용

---

### 📌 주요 기능

![예적금 상품 리스트 조회](/projects/saving-hanaro/01.jpg)
- 예적금 상품 리스트 조회
- 1금융권/2금융권 필터링
- 예금/적금 필터링

![나의 포트폴리오 만기 수익 계산](/projects/saving-hanaro/02.jpg)
- 나의 포트폴리오 만기 수익 계산
![예적금 상품 포트폴리오 만들기](/projects/saving-hanaro/03.jpg)
- 예적금 상품 포트폴리오 만들기
- 금융기관/저축기간/저축금액의 조건을 충족하는 예적금 상품 조회
![네이버 뉴스 API 연동](/projects/saving-hanaro/04.jpg)
- 네이버 뉴스 API 연동
![유튜브 API 연동](/projects/saving-hanaro/05.jpg)
- 유튜브 API 연동
![소셜 로그인 / 이메일 로그인](/projects/saving-hanaro/06.jpg)
- 소셜 로그인 / 이메일 로그인

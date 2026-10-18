---
title: "하이브리드앱"
slug: "hybrid-app"
order: 9
category: "rn-side"
company: ""
period: "2026.07.29 ~ 2026.08.08"
tagline: "웹뷰 기반 하이브리드 앱"
summary: "네이버 웹을 앱에서 사용할 수 있는 어플리케이션"
stack: ["React Native","WebView","TypeScript","Context API"]
thumbnail: "/projects/hybrid-app/cover.jpg"
# 프로젝트 목록 카드 오른쪽에 보이는 대표 화면
preview: "/projects/hybrid-app/preview.jpg"
links: [{"label":"GitHub","url":"https://github.com/jkim68888/HybridApp"}]
notionId: "30b33aa8-a192-8079-967c-d7e254099182"
# team·myRole은 상세 페이지와 챗봇에, interviewQA는 챗봇에만 사용
team: "1인 개발"
myRole: "React Native에서 웹뷰 기반 하이브리드 앱 구조를 익히기 위해 혼자 기획·개발한 학습 프로젝트. 웹뷰 로드와 화면 이동, 쿠키 동기화 로그인, 공유·뒤로가기·Pull To Refresh 같은 네이티브 기능 연동을 직접 구현"
interviewQA:
  - question: "웹뷰 안에서 로그인 상태는 어떻게 관리했나요?"
    answer: "웹에서 로그인하면 쿠키가 생기기 때문에, 앱에서는 @react-native-cookies/cookies 라이브러리로 쿠키를 읽어서 로그인 상태를 판단했습니다. 쿠키가 없으면 로그인 버튼을 보여주고, 로그인 페이지에서 웹 로그인이 끝나면 웹뷰를 새로고침해 상태를 반영했습니다. 쿠키가 있으면 로그아웃 버튼을 보여주고, 로그아웃할 때는 쿠키를 삭제한 뒤 웹뷰를 새로고침했습니다."
  - question: "웹뷰 앱을 네이티브 앱처럼 자연스럽게 만들기 위해 어떤 처리를 했나요?"
    answer: "웹사이트를 그대로 띄우기만 하면 앱이라기보다 브라우저처럼 느껴져서, 네이티브 동작을 하나씩 연결했습니다. 로딩 중에는 로딩바를 보여주고, 뒤로가기·앞으로가기·새로고침 버튼과 Pull To Refresh, 네이티브 공유 기능을 넣었습니다. 안드로이드 백버튼도 웹뷰의 뒤로가기와 연결했고, 앱에서 어색한 핀치 줌, 텍스트 롱 프레스, 링크 롱 프레스 프리뷰는 비활성화했습니다. 웹사이트의 요청을 가로채서 새로운 스크린으로 이동시키는 처리도 했습니다."
  - question: "웹과 네이티브의 차이를 체감한 점"
    answer: ""
  - question: "이 학습 프로젝트를 시작하게 된 계기는 무엇인가요?"
    answer: ""
  - question: "웹과 앱이 서로 데이터를 주고받아야 할 때는 어떻게 처리했나요?"
    answer: ""
---

### 📱 하이브리드앱

네이버 웹을 앱에서 사용할 수 있는 어플리케이션

### 🛠️ 사용 기술

- TypeScript
- React-Native
- Context Api

### 👩‍💻 개발 사항

- 웹뷰에 웹사이트 로드 및 웹사이트 리퀘스트를 처리하여 새로운 스크린으로 이동
- 웹사이트 로드 중 로딩바 구현
- 웹사이트 브라우징 시 네이티브 앱에서 뒤로가기, 앞으로가기, 새로고침 기능 구현
- Pull To Refresh 기능 개발
- 네이티브 공유 기능 개발
- 쿠키 동기화하여 로그인 기능 개발
- 핀치 줌/아웃, 텍스트 롱 프레스 액션 비활성화
- 링크 롱 프레스 시 프리뷰 비활성화
- 안드로이드 백버튼과 웹뷰 연결

### 💡 프로젝트 회고

#### 웹뷰에서 로그인 기능 개발하기

```markdown
# 쿠키가 없는 경우 프로세스
read 쿠키 -> N -> show 로그인 버튼 -> 로그인 페이지로 이동 -> 웹에서 로그인 완료 -> 웹뷰 새로고침
```
```markdown
# 쿠키가 있는 경우 프로세스
read 쿠키 -> Y -> show 로그아웃 버튼 -> 쿠키 삭제 -> 웹뷰 새로고침
```
→ 쿠키 관리 라이브러리는 [@react-native-cookies/cookies](https://github.com/react-native-cookies/cookies) 사용.

---

[🐱 깃허브 바로가기](https://github.com/jkim68888/HybridApp)

---

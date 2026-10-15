---
title: "하이브리드앱"
slug: "hybrid-app"
order: 9
category: "rn-side"
company: ""
period: ""
tagline: "하이브리드앱"
summary: "네이버 웹을 앱에서 사용할 수 있는 어플리케이션"
stack: ["WebView","TypeScript","Context Api"]
thumbnail: ""
links: [{"label":"GitHub","url":"https://github.com/jkim68888/HybridApp"}]
notionId: "30b33aa8-a192-8079-967c-d7e254099182"
# 아래는 챗봇 답변용 정보 (화면에는 노출하지 않음)
team: ""
myRole: ""
interviewQA: []
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

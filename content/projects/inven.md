---
title: "인벤"
slug: "inven"
order: 5
category: "company"
company: "(주)인벤"
period: "2024.07 ~ 2024.12"
tagline: "게임 커뮤니티"
summary: "국내 게임 커뮤니티 인벤의 공식 iOS 앱"
stack: ["Swift", "UIKit", "WebView"]
thumbnail: "/projects/inven/cover.jpg"
# 프로젝트 목록 카드 오른쪽에 보이는 대표 화면
preview: "/projects/inven/preview.jpg"
links: [{"label": "App Store", "url": "https://apps.apple.com/us/app/%EC%9D%B8%EB%B2%A4-inven-%EA%B3%B5%EC%8B%9D/id997288621"}]
status: ""
notionId: "27633aa8-a192-815a-9632-d57de69dd0b4"
# team·myRole은 상세 페이지와 챗봇에, interviewQA는 챗봇에만 사용
team: "iOS 1명(본인), Android 1명, 웹 개발자 5명, 웹 퍼블리셔 1명, 디자이너 4명, 기획자 2명"
myRole: "iOS 전담. 버그 수정과 간단한 기능 추가 후 앱스토어 배포, Firebase Crashlytics 모니터링을 맡아 Crash Free Rate 99.8% 이상을 유지"
interviewQA:
  - question: "앱 안정성은 어떻게 관리했나요?"
    answer: "Firebase Crashlytics로 크래시를 모니터링하며 Crash Free Rate를 99.8% 이상으로 유지했습니다. 리포트에 올라온 크래시는 모두 추적해서 수정했고, 영향을 받은 사용자와 기기 수가 많으면 크리티컬하다고 판단해 바로 대응하고 핫픽스로 배포했습니다."
---

### 📱 게임 커뮤니티

### 🛠️ 사용 기술

- UIkit, Swift5 
- WKWebView 

### 👩‍💻 담당 개발 파트

- 앱 유지보수
- 앱 배포

### 💡 프로젝트 회고

#### Firebase Crashlytics

> Crash Free Rate 99.8% 이상 유지
> - 크래시 리포트에 찍힌 크래시들은 항상 추적하고 수정 개발함.
> - 크래시가 발생한 유저와 기기 수가 많을 경우, 크리티컬 하다고 판단.
> - 크리티컬한 크래시의 경우 바로 대응하여, Hotfix 로 앱 배포.

> 실시간 크래시 리포팅 도구
> 앱에서 발생하는 예기치 않은 오류(crash)를 수집하고, 원인을 분석할 수 있도록 도와주는 **모바일 앱 품질 모니터링 툴**
> - Firebase와 완전히 통합되어 **기존 Firebase Auth, Firestore 등과 연계**하여 사용 가능
> - 사용자가 직접 리포트하지 않아도 **자동으로 오류 수집**
> - **디바이스, OS, 버전, 발생 경로 등의 맥락 정보**가 함께 제공되어 디버깅 시간을 단축
> - 비정상 종료 외에도 경고성 오류도 수집 가능 (Non-fatal)

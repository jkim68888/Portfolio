---
title: "투두리스트"
slug: "todolist"
order: 8
category: "swift-side"
company: ""
period: "2022.10.15 ~ 2022.10.30"
tagline: "Todo 앱"
summary: "할 일을 중요도 색상으로 구분하고, 앱을 다시 켜도 목록이 유지되는 Todo 어플리케이션"
stack: ["RxSwift", "SnapKit", "Realm"]
thumbnail: "/projects/todolist/cover.jpg"
# 프로젝트 목록 카드 오른쪽에 보이는 대표 화면
preview: "/projects/todolist/01.png"
links: [{"label": "GitHub", "url": "https://github.com/jkim68888/ToDoApp"}, {"label": "App Store", "url": "https://apps.apple.com/kr/app/to-do-list-%ED%88%AC%EB%91%90%EB%A6%AC%EC%8A%A4%ED%8A%B8/id6444089142"}]
status: ""
notionId: "27633aa8-a192-812a-851f-f09455bd5cc0"
# team·myRole은 상세 페이지와 챗봇에, interviewQA는 챗봇에만 사용
team: "1인 개발"
myRole: "아이디어부터 앱스토어 출시까지 혼자 만든 0→1 프로젝트. 기획, Figma를 이용한 UI 디자인, RxSwift·MVVM 기반 앱 개발, 앱스토어 배포를 모두 직접 진행"
interviewQA:
  - question: "앱을 껐다 켜도 할 일 목록이 유지되도록 어떻게 구현했나요?"
    answer: "할 일 데이터를 Realm 데이터베이스에 저장해서, 앱을 종료했다가 다시 실행해도 이전 목록을 그대로 불러오도록 했습니다. 할 일 추가, 완료 체크, 개별 삭제와 전체 삭제가 모두 Realm에 반영되도록 구현했습니다."
---

### 📱 Todo 앱

### 🛠️ 사용 기술

- RxSwift
- Snapkit
- Realm
-  MVVM Design Pattern

### 👩‍💻 개발  사항

- 색상별로 중요도 선택 기능
- 할 일 개별 삭제 & 전체 삭제 기능
- 할 일 완료 시 체크 기능
- `앱을 끄고 난 후 다시 켜도` 이전 할 일 리스트가 보이도록 데이터를  `Realm 데이터베이스에 저장`

### 💡 프로젝트 회고

#### Input/Output 구조의 MVVM

> 작업 내용
> - 모든 ViewModel이 공통 `ViewModelType` 프로토콜을 따르도록 하고, 화면에서 들어오는 이벤트(Input)를 화면에 보여줄 데이터(Output)로 바꾸는 `transform` 함수 하나로 흐름을 정리
> - 홈, 할 일 추가, 편집 화면을 각각 ViewController와 ViewModel로 나눠, ViewController는 바인딩과 UI만 맡도록 함

> 효과
> - 화면마다 같은 틀을 쓰니 새 화면을 추가할 때 구조를 고민할 필요가 없었음
> - 어떤 이벤트가 어떤 결과로 이어지는지 ViewModel만 보면 알 수 있어 흐름을 따라가기 쉬워짐

#### Realm으로 할 일 저장하기

> 작업 계기
> - 앱을 껐다 켜도 할 일 목록이 그대로 남아 있어야 했음

> 작업 내용
> - 할 일 데이터를 Realm 객체로 정의하고, 추가·완료 체크·개별 삭제·전체 삭제가 모두 Realm에 바로 반영되도록 구현
> - Realm은 Swift enum을 그대로 저장할 수 없어서, 중요도(높음/보통/낮음)는 문자열로 저장하고 읽을 때 enum으로 바꿔 쓰도록 처리

#### 화면 간 데이터 동기화

> 작업 계기
> - 편집 화면에서 할 일을 삭제하거나 전체 삭제하면 홈 화면 목록도 바로 바뀌어야 했음

> 작업 내용
> - 저장소(Repository)를 하나만 두고 할 일 목록을 Observable로 내보내, 홈 화면과 편집 화면이 같은 데이터를 구독하도록 구성
> - `RxDataSources`의 애니메이션 섹션 모델을 적용해, 할 일을 추가하거나 삭제할 때 목록이 자연스럽게 바뀌도록 함

> 효과
> - 한 화면에서 데이터를 바꾸면 다른 화면이 자동으로 갱신돼, 화면마다 따로 새로고침할 필요가 없어짐

---

[🐱 깃허브 바로가기](https://github.com/jkim68888/ToDoApp)

---

### 📌 주요 기능

![중요도 표기](/projects/todolist/01.png)
- 중요도 표기

![완료 체크 기능](/projects/todolist/02.png)
- 완료 체크 기능
![전체 삭제](/projects/todolist/03.png)
- 전체 삭제
- 개별 삭제
- 순서 변경
- 긴 글 여러줄 표기

---
title: "체크잇"
slug: "checkit"
order: 10
category: "rn-side"
company: ""
period: "2025.05.24 ~ 2025.06.06"
tagline: "Todo 앱"
summary: "날짜 별로 Todo 리스트를 정리할 수 있는 어플리케이션"
stack: ["React Native","Expo","TypeScript","Context API"]
thumbnail: "/projects/checkit/cover.jpg"
# 프로젝트 목록 카드 오른쪽에 보이는 대표 화면
preview: "/projects/checkit/01.png"
links: [{"label":"GitHub","url":"https://github.com/jkim68888/Check-it"},{"label":"App Store","url":"https://apps.apple.com/us/app/%EC%B2%B4%ED%81%AC%EC%9E%87/id6746921529"}]
notionId: "27633aa8-a192-816d-a55f-dfe131dee390"
# team·myRole은 상세 페이지와 챗봇에, interviewQA는 챗봇에만 사용
team: "1인 개발"
myRole: "아이디어부터 앱스토어 출시까지 혼자 만든 0→1 프로젝트. 기획, Figma를 이용한 UI 디자인, 앱 개발, EAS Build를 이용한 iOS·Android 빌드 및 배포를 모두 직접 진행. iOS는 앱스토어에 출시했고, Android는 플레이스토어 비공개 테스트 단계로 테스터를 모집 중"
interviewQA:
  - question: "상태 관리로 Context API를 쓴 이유는 무엇인가요?"
    answer: "처음에는 할 일 데이터를 props로 내려줬는데, 컴포넌트가 늘면서 props drilling이 심해지고 할 일 추가·삭제·수정 로직이 여러 컴포넌트에 흩어져 관리가 어려워졌습니다. 그래서 Context API로 TodoContext를 만들어 할 일 관련 로직을 한곳에 모으고, Provider로 데이터와 기능을 함께 제공하도록 바꿨습니다."
  - question: "TypeScript 타입은 어떤 기준으로 설계했나요?"
    answer: "초기에는 모든 Props를 type Props = {...}로 선언해서 어떤 컴포넌트의 타입인지, 재사용하는 타입인지 구분이 모호했습니다. 그래서 컴포넌트 Props는 PrioritySelectBoxProps처럼 컴포넌트 이름을 붙인 interface로 선언하고, 여러 곳에서 쓰는 공통 타입만 type으로 별도 파일에 분리했습니다. 확장이 필요한 부분은 유틸리티 타입을 활용했습니다."
---

### 📱 Todo 앱

날짜 별로 Todo 리스트를 정리할 수 있는 어플리케이션

### 🛠️ 사용 기술

- TypeScript
- React Native
- Expo

### 👩‍💻 개발 사항

- 날짜 별 할 일 목록 생성
- 할 일 삭제 / 순서 변경 / 완료 체크 기능
- 날짜 별 할 일 목록 삭제 기능
- 중요도 선택 기능
- 날짜 오름차순 정렬
- 오늘 날짜 기준으로 과거의 할 일은 자동 삭제

### 💡 프로젝트 회고

#### 타입 시스템 설계와 관리

> 문제점
> Props도 type으로 선언
> - 초기에 단순히 type Props = {...} 와 같은 방식으로 타입을 정의하여 컴포넌트 간 타입 구분이 모호했음
> - 재사용 가능한 타입과 컴포넌트별 고유 타입의 구분이 불명확했음

> 해결
> Props는 interface로 선언, 공통 타입만 type으로 선언
> - 컴포넌트별로 명확한 네이밍을 가진 interface로 변경 (예: PrioritySelectBoxProps)
> - 공통 타입은 별도 파일로 분리하여 재사용성 향상
> - TypeScript의 유틸리티 타입을 활용하여 타입 확장성 개선

#### 상태 관리와 데이터 흐름

> 문제점
> - 컴포넌트 간 데이터 전달이 props drilling으로 복잡해짐
> - 할 일 목록의 CRUD 작업이 여러 컴포넌트에 분산되어 있어 관리가 어려움

> 해결
> - Context API를 도입하여 전역 상태 관리 구현
> - TodoContext에서 할 일 관련 모든 로직을 중앙화하여 관리
> - Provider 패턴을 통해 데이터와 기능을 캡슐화

#### 날짜 기반 데이터 처리

> 과거 / 현재 / 미래에 따른 데이터 처리
> - dayjs 라이브러리를 도입하여 날짜 처리 표준화
> - 날짜별 데이터 그룹핑 로직을 구현하여 효율적인 데이터 구조 설계
> - 자동 데이터 삭제 기능 구현으로 과거 데이터 관리 자동화

#### Expo EAS Build

> EAS Build
> - `eas build:configure`를 통해 EAS 프로젝트 설정
> - `eas.json` 환경에 따라 **dev**, **preview**, **production** 채널 분리 구성
> - `eas build -p ios` / `eas build -p android` 명령어로 클라우드 빌드 수행

> 장점
>
> | 항목 | 설명 |
> | --- | --- |
> | **1. Native 모듈 자유롭게 사용 가능** | `react-native-reanimated`, `react-native-svg` 등 Native module을 Expo에서도 자유롭게 쓸 수 있음 (`expo build`에서는 제한적이었음). |
> | **2. 로컬 빌드 환경 불필요** | 빌드가 클라우드에서 이루어져 macOS, Xcode 없이 iOS 앱 빌드 가능. (Windows, Linux 환경에서도 iOS 빌드 가능) |
> | **3. OTA + 채널 기반 배포** | `eas update`와 채널(`production`, `preview`, `dev`)을 조합해 각 환경에 맞는 OTA 배포가 가능함. QA/테스트/운영 분리 용이. |
> | **4. CI/CD 연동 쉬움** | GitHub Actions, Bitrise 등과 쉽게 통합 가능. `eas build`, `eas update`를 스크립트로 처리 가능. |
> | **5. iOS 인증서 자동 관리** | Apple의 인증서, 프로비저닝 프로파일, Team 관리 등을 자동화해 번거로운 수작업을 줄여줌. |
> | **6. autoIncrement 및 환경 설정 자동화** | 빌드 시 자동 버전 증가, 환경변수 주입 등도 `eas.json` 설정으로 손쉽게 관리 가능. |
>

> 단점
> EAS 무료 플랜 기준 대기 큐 발생 → 대기 시간이 너무 오래 걸린다…

---

[🐱 깃허브 바로가기](https://github.com/jkim68888/Check-it)

---

### 📌 주요 기능

![완료 체크](/projects/checkit/01.png)
- 완료 체크
- 순서 변경
- 삭제

![날짜 선택](/projects/checkit/02.png)
- 날짜 선택
- 중요도 선택
![날짜 오름차순 정렬](/projects/checkit/03.png)
- 날짜 오름차순 정렬
![과거 데이터는 자동 삭제](/projects/checkit/04.png)
- 과거 데이터는 자동 삭제

---
title: "볼텍스 게이밍"
slug: "vortex-gaming"
order: 4
category: "company"
company: "(주)인벤"
period: "2024.09 ~ 2024.12"
tagline: "NFT 게이밍 커뮤니티"
summary: "NFT 게이밍 커뮤니티 웹 서비스의 기능을 네이티브 iOS 앱으로 구현한 프로젝트"
stack: ["Swift", "UIKit", "WebSocket"]
thumbnail: "/projects/vortex-gaming/cover.jpg"
# 프로젝트 목록 카드 오른쪽에 보이는 대표 화면
preview: "/projects/vortex-gaming/08.jpg"
links: [{"label": "웹사이트", "url": "https://vortexgaming.io/en"}]
status: "웹 서비스(링크)의 기능을 네이티브 앱으로 옮기는 프로젝트였으나, 앱은 출시되지 못하고 마무리됨"
notionId: "27633aa8-a192-817c-aeae-fb1fef628628"
# team·myRole은 상세 페이지와 챗봇에, interviewQA는 챗봇에만 사용
team: "인벤 소속으로, 당시 인벤의 자회사였던 협업사 Vortex Gaming의 개발자들과 함께 개발. iOS 약 4명, Android 약 4명, 백엔드 약 4명, 기획자와 디자이너 별도"
myRole: "여러 iOS 개발자와 협업하며 채팅, 알림함, 블록체인 지갑 연동 파트를 담당"
interviewQA:
  - question: "채팅 기능은 어떻게 구현했나요?"
    answer: "실시간 통신이 필요해서 URLSessionWebSocketTask로 WebSocket을 연결했고, 메시지 크기를 줄이려고 JSON 대신 바이너리 데이터로 주고받았습니다. swift-nio의 ByteBuffer로 Swift 구조체와 바이너리 포맷을 서로 변환하는 유틸 함수를 만들었습니다. 앱이 백그라운드로 가면 연결을 정리하고, 네트워크가 불안정하면 지연과 최대 횟수를 둔 재접속을 하며, ping/pong으로 연결 상태를 확인했습니다."
  - question: "협업사와 함께 개발하면서 겪은 문제는 무엇이었나요?"
    answer: "인벤의 자회사였던 Vortex Gaming 개발자들과 함께 개발했는데, 초기에 코드 컨벤션과 설계 기준이 명확하지 않아서 양쪽 코드의 스타일이 달랐고, UIKit과 SwiftUI가 섞이거나 반복 코드가 생겨 유지보수 부담이 컸습니다. 그래서 컨벤션 문서와 코드 리뷰 절차를 만들고, 협업사 작업물은 내부 리뷰 후 리팩토링을 전제로 머지했습니다. 협업 기준과 커뮤니케이션 체계를 초기에 명확히 하는 게 가장 중요하다는 걸 배웠습니다."
  - question: "앱이 출시되지 못하고 마무리된 과정에서 배운 점은 무엇인가요?"
    answer: "당시 인벤의 자회사였던 협업사 Vortex Gaming과의 관계가 정리되면서, 앱은 출시되지 못하고 프로젝트가 마무리됐습니다. 출시까지 가지 못한 건 아쉽지만, 여러 회사의 개발자가 함께 만드는 프로젝트에서는 초기에 코드 컨벤션, 책임 범위, 리뷰 절차 같은 협업 기준을 명확히 정하는 게 얼마나 중요한지 배웠습니다. 또 채팅의 WebSocket과 바이너리 통신, 블록체인 지갑 연동처럼 처음 다뤄 보는 기술을 짧은 기간에 익혀 구현한 경험이 남았습니다."
  - question: "블록체인 지갑 연동에서 가장 까다로웠던 부분은 무엇인가요?"
    answer: "블록체인을 처음 다뤄 봐서, 지갑 주소나 트랜잭션 서명 같은 개념을 이해하는 게 가장 어려웠습니다. Wepin SDK가 지갑 생성과 서명 과정을 대신 처리해 주지만, 지갑 주소가 서버에서 사용자를 식별하는 기준이 되고 NFT 발행이나 토큰 전송 때 서명 요청이 어떤 흐름으로 오가는지를 이해해야 연동 순서를 제대로 설계할 수 있었습니다. 그래서 개념을 먼저 정리한 뒤, 앱 로그인 시 Wepin에도 로그인하고 지갑 주소를 받아 서버와 연동하는 흐름으로 구현했습니다."
---

### 📱 NFT 게이밍 커뮤니티

### 🛠️ 사용 기술

- UIkit, Swift5 
- WebSocket
- Alamofire, SnapKit 
- Wepin SDK

### 👩‍💻 담당 개발 파트

- 채팅
- 알림함
- 블록체인

### 💡 프로젝트 회고

#### 협업사(Vortex Gaming)와의 협업

> 협업 방식
> - GitHub를 통한 **Branch 단위 작업 분리**
> - Figma 기준으로 화면 단위 스펙 정리 및 전달
> - Slack & Notion을 활용하여 **업무 소통 및 일정 관리**

> 문제 및 개선
> - 초기에는 **명확한 코드 컨벤션과 설계 기준 부족**으로 인해,
>   → 협업사 코드와 인벤 내부 코드의 스타일이 상이하고, 유지보수에 어려움이 있음
>   → 이후 컨벤션 문서 작성 및 코드리뷰 프로세스 마련
> - 협업사 개발물 중 일부는 **품질 검수 및 리팩토링 필요성 존재**
>   → **내부 리뷰 후, 리팩토링을 전제로 Merge**

> 회고
> - 단기적으로는 협업사의 개발 리소스를 함께 활용해 **개발 속도를 높일 수 있었음**
> - 하지만 **UIKit과 SwiftUI가 혼용되고, 반복적인 코드 작성 발생, 일관되지 않은 아키텍쳐** 등으로 인해 장기적으로 유지보수에 큰 부담으로 작용함을 체감
> - 가장 중요했던 점은
>   - **초기 협업 기준의 명확화 (코드 컨벤션, 책임 분리, 리뷰 절차)**
>   - **커뮤니케이션 체계의 고도화 (일정 공유, QA 체크리스트 등)**

#### WebSocket 과 Binary Data

> 작업 내용
> - 채팅 기능 개발 중, 서버와의 실시간 데이터 통신이 필요함에 따라 WebSocket 사용
> - JSON 대신 Binary Data로 통신하면 **메시지 크기 절감 → 성능 향상** 가능
> - Swift의 `ByteBuffer`, `swift-nio`를 활용하여 **바이너리 포맷–Swift 구조체 구조화**

> Binary Data
> ✅ ByteBuffer 이해 및 활용
>   - `ByteBuffer`: Swift-NIO에서 **바이너리 바이트 단위 조작**을 쉽게 해주는 버퍼
>   - 기본 타입(`Int`, `Float`, `String`)을 **read/write API**로 직접 변환
>
> ✅ Swift 구조체 ↔ ByteBuffer 매핑
>   - `struct Foo { let x: Int; let y: String }` 같은 타입을 `ByteBuffer`로 인코딩 & 디코딩하는 **유틸 함수 구현**
>
> (참고 : [https://dev-hyunn.tistory.com/4](https://dev-hyunn.tistory.com/4))

> WebSocket
> ✅ WebSocket 연결 관리
> - Swift 클라이언트에서는 `URLSessionWebSocketTask` 사용하여 서버와 WebSocket 연결
> - 앱 라이프사이클(`foreground`, `background`)에 따라 **연결 유지/해제 로직 분리**
> - **Reconnect 전략** 구현
>   - 네트워크 불안정 시 자동 재접속
>   - 재시도 간 딜레이 및 최대 재시도 횟수 제한
>
> ✅ 메시지 송수신 처리
> - 클라이언트에서 수신 루프를 돌며 `receive` 이벤트 대기
>
> ✅ 핑/퐁 구현
> - WebSocket은 기본적으로 서버-클라이언트 연결 유지를 위해 **ping/pong 신호 주기적 송신**
> - 서버에서 일정 시간 `pong` 수신 실패 시 연결 종료 처리
> - 클라이언트에서도 ping 전송 및 timeout 체크를 통해 **연결 상태를 모니터링**

#### 블록체인 지갑 연동

> Wepin SDK 사용 (연동 흐름 요약)
> 1. 앱 로그인 시, Wepin SDK에 사용자가 로그인 되도록 구현
> 2. 로그인 성공 후, Wepin SDK로부터 지갑 주소를 획득
> 3. 해당 지갑 주소는 서버와 연동되어 **사용자 식별 및 트랜잭션 주체로 사용**
> 4. NFT 발행, 토큰 전송 등에서 Wepin SDK를 통해 트랜잭션 서명 요청
> 5. 사용자는 별도의 지갑 앱을 설치하지 않고도 앱 내에서 **직관적으로 서명 및 전송 가능**

#### 이미지 합성 작업

![볼텍스 게이밍 화면 1](/projects/vortex-gaming/01.jpg)
> 여러장의 이미지를 클라이언트에서 합성
> - 아바타 아이콘 위에 이미지 레이어를 순서대로 오버레이하기
>   - 서버에서 받아온 각각의 이미지에는 order number가 있음
>   - 여러개의 `UIImageView`를 동적으로 생성하여 `addSubview()` 해줌
> - 이미지 비율 계산
>   - 이미지들 중 `maxWidth`를 기준으로 나머지 이미지들의 비율(`ratio`)을 계산

---

### 📌 주요 기능

![토큰 보유 현황 조회](/projects/vortex-gaming/02.jpg)
- 토큰 보유 현황 조회
![토큰 교환/전송](/projects/vortex-gaming/03.jpg)
- 토큰 교환/전송

![알림 수신함](/projects/vortex-gaming/04.jpg)
- 알림 수신함

![밈토큰 생성](/projects/vortex-gaming/05.jpg)
- 밈토큰 생성
![이미지 합성](/projects/vortex-gaming/06.jpg)
- 이미지 합성

![토큰 전송](/projects/vortex-gaming/07.jpg)
- 토큰 전송
![채팅방 리스트](/projects/vortex-gaming/08.jpg)
- 채팅방 리스트
- 채팅방 검색

![채팅 리스트](/projects/vortex-gaming/09.jpg)
- 채팅 리스트
- 채팅 내역 검색
- 답장 기능
- 유저 in/out 표기

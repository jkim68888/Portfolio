---
title: "볼텍스 게이밍"
slug: "vortex-gaming"
order: 4
category: "company"
company: "(주)인벤"
period: ""
tagline: "NFT 게이밍 커뮤니티"
summary: ""
stack: ["Swift","UIKit"]
thumbnail: ""
links: []
notionId: "27633aa8-a192-817c-aeae-fb1fef628628"
# 아래는 챗봇 답변용 정보 (화면에는 노출하지 않음)
team: ""
myRole: ""
interviewQA: []
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

#### 외주사와의 협업

> 협업 방식
> - GitHub를 통한 **Branch 단위 작업 분리**
> - Figma 기준으로 화면 단위 스펙 정리 및 전달
> - Slack & Notion을 활용하여 **업무 소통 및 일정 관리**

> 문제 및 개선
> - 초기에는 **명확한 코드 컨벤션과 설계 기준 부족**으로 인해,
>   → 외주사 코드와 내부 코드의 스타일이 상이하고, 유지보수에 어려움이 있음
>   → 이후 컨벤션 문서 작성 및 코드리뷰 프로세스 마련
> - 외주 개발물 중 일부는 **품질 검수 및 리팩토링 필요성 존재**
>   → **내부 리뷰 후, 리팩토링을 전제로 Merge**

> 회고
> - 단기적으로는 외주사의 리소스를 활용해 **개발 속도를 높일 수 있었음**
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

<!-- IMAGE: IMG_2457.jpg (block 27633aa8-a192-816c-8edc-c207ded1ddb3) -->
> 여러장의 이미지를 클라이언트에서 합성
> - 아바타 아이콘 위에 이미지 레이어를 순서대로 오버레이하기
>   - 서버에서 받아온 각각의 이미지에는 order number가 있음
>   - 여러개의 `UIImageView`를 동적으로 생성하여 `addSubview()` 해줌
> - 이미지 비율 계산
>   - 이미지들 중 `maxWidth`를 기준으로 나머지 이미지들의 비율(`ratio`)을 계산

---

### 📌 주요 기능

<!-- IMAGE: IMG_2414.jpg (block 27633aa8-a192-8102-9a94-f38f1e834a20) -->
- 토큰 보유 현황 조회
<!-- IMAGE: IMG_2419.jpg (block 27633aa8-a192-818e-b1e1-f5dde0d74a98) -->
- 토큰 교환/전송

<!-- IMAGE: IMG_2421.jpg (block 27633aa8-a192-8138-a855-f71c903bb720) -->
- 알림 수신함

<!-- IMAGE: IMG_2420.jpg (block 27633aa8-a192-81ad-b02f-e31d78184a2b) -->
- 밈토큰 생성
<!-- IMAGE: IMG_2457.jpg (block 27633aa8-a192-81f9-9af2-dcf5cf48eff7) -->
- 이미지 합성

<!-- IMAGE: IMG_2458.jpg (block 27633aa8-a192-81f3-b3b0-d39e4ac99905) -->
- 토큰 전송
<!-- IMAGE: IMG_2460.jpg (block 27633aa8-a192-8114-8a46-fa93ad17c5cd) -->
- 채팅방 리스트
- 채팅방 검색

<!-- IMAGE: IMG_2459.jpg (block 27633aa8-a192-81b0-a620-f588a6151a56) -->
- 채팅 리스트
- 채팅 내역 검색
- 답장 기능
- 유저 in/out 표기

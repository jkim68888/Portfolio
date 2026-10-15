---
title: "피피"
slug: "pipi"
order: 6
category: "swift-side"
company: ""
period: ""
tagline: "일기와 커뮤니티"
summary: "나만 볼 수 있는 일기와, 다른 사람들과 함께 게시물을 올려서 볼 수 있는 커뮤니티가 공존하는 어플리케이션"
stack: ["SwiftUI","Combine"]
thumbnail: ""
links: [{"label":"GitHub","url":"https://github.com/team-ppeople"}]
notionId: "27633aa8-a192-8161-bcaf-c384e565950c"
# 아래는 챗봇 답변용 정보 (화면에는 노출하지 않음)
team: ""
myRole: ""
interviewQA: []
---

### 📱 일기와 커뮤니티

나만 볼 수 있는 일기와, 다른 사람들과 함께 게시물을 올려서 볼 수 있는 커뮤니티가 공존하는 어플리케이션

### 🛠️ 사용 기술

- SwiftUI, Combine 
- MVVM Design Pattern
- CoreData
- Kingfisher, Moya, Mantis 
- Kakao Login SDK, Apple Login SDK

### 👩‍💻 담당 개발 파트

- 애플 로그인, 카카오 로그인 SDK를 사용하여 소셜로그인 구현
- CoreData를 사용하여 나의 일기 파트 CRUD 개발
- 이미지 크롭 기능 개발
- 앱 배포

### 💡 프로젝트 회고

#### 애플 심사 리젝 대응

> 커뮤니티 관련 유저 차단 및 신고 기능 부재에 따른 심사 거절
> 유저 차단기능 추가 후 재심사 요청
>   - 유저 UID 와 차단할 유저의 UID를 서버에 전송하여 차단 처리
>   - 차단 된 유저의 게시물, 댓글, 프로필은 조회되지 않도록 처리

> EULA(최종 사용자 라이센스 계약) 약관이 부재에 따른 심사 거절
> 설정 화면에 약관 추가 후 재심사 요청

#### Presigned URL 방식의 이미지 업로드

> Presigned URL 방식은 클라이언트가 서버를 거치지 않고 직접 클라우드 스토리지에 파일을 업로드할 수 있게 해주는 방법
> 1. 클라이언트에서 서버에 파일 업로드를 요청
> 2. 서버에 AWS S3에 해당 이미지를 업로드 할 수 있도록 URL 생성을 요청
> 3. 서버에서 해당 URL을 클라이언트로 반환
> 4. 클라이언트에서 서버로부터 받은 URL로 AWS S3에 직접 업로드 요청
>
> Presigned URL의 장점
> - 서버 부하 감소
>   - 100MB 이미지 10개를 업로드한다면?
>   - 기존 방식: 서버가 1GB 데이터를 모두 처리
>   - Presigned URL: 서버는 URL만 생성, 실제 데이터는 AWS가 처리
> - 속도 향상
>   - 클라이언트가 AWS의 전 세계 CDN에 직접 연결
>   - 서버의 인터넷 속도에 제약받지 않음

본 프로젝트는 Presigned URL 방식을 채택했지만, Presigned URL 방식으로 구현했다고 보긴 어렵다. 당시 Presigned URL 방식에 대한 이해도가 부족했기 때문인 것 같다.
> 본 프로젝트 방식

1. 클라이언트에서 서버에 이미지 파일 업로드 요청
2. 서버에서 해당 파일을 AWS S3에 업로드 후, 파일 id를 생성하여 클라이언트에 전달
3. 클라이언트에서 해당 이미지 id와 날짜, 텍스트 등의 정보를 서버에 전달하여 게시물 업로드 요청

---

🐱 깃허브
- [team-ppeople](https://github.com/team-ppeople)

---

### 📌 주요 기능

<!-- IMAGE: IMG_2405 2.jpg (block 27633aa8-a192-81b5-b11e-edb39feab4b4) -->
- 카카오 로그인
- 애플 로그인

<!-- IMAGE: 설정.jpg (block 27633aa8-a192-81e9-ac76-f10c79e73953) -->
- 로그인 여부에 따른 유저 프로필 노출
<!-- IMAGE: 나의 프로필.jpg (block 27633aa8-a192-812f-992e-e9759ca8cd4c) -->
- 프로필 수정
- 나의 게시물 및 좋아요 조회
<!-- IMAGE: IMG_2401 2.jpg (block 27633aa8-a192-8136-b20e-cb6fc5870365) -->
- 게시물 리스트 보기
<!-- IMAGE: IMG_2402 2.jpg (block 27633aa8-a192-8130-a182-e1918050542c) -->
- 게시물 상세 보기
<!-- IMAGE: IMG_2403 2.jpg (block 27633aa8-a192-8160-a067-dcb040c8f057) -->
- 게시물 이미지와 텍스트  업로드
<!-- IMAGE: IMG_2404 2.jpg (block 27633aa8-a192-8128-ab11-f4505ee05d11) -->
- 이미지 크롭
<!-- IMAGE: image 3013.jpg (block 27633aa8-a192-81e6-bc03-ec150e0c8cff) -->
- 좋아요, 댓글, 삭제 기능

### 기타 사항

- 직접 앱을 기획하여 UI/UX 화면설계 플로우차트 작성
  <!-- IMAGE: 240330 - 기획 1.jpg (block 27633aa8-a192-81a9-8ce4-eb9c50cc38a4) -->

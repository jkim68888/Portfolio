---
title: "피피"
slug: "pipi"
order: 6
category: "swift-side"
company: ""
period: "2024.04.01 ~ 2024.06.20"
tagline: "일기와 커뮤니티"
summary: "나만 볼 수 있는 일기와, 다른 사람들과 함께 게시물을 올려서 볼 수 있는 커뮤니티가 공존하는 어플리케이션"
stack: ["SwiftUI", "Combine"]
thumbnail: "/projects/pipi/cover.jpg"
# 프로젝트 목록 카드 오른쪽에 보이는 대표 화면
preview: "/projects/pipi/04.jpg"
links: [{"label": "GitHub", "url": "https://github.com/team-ppeople"}, {"label": "App Store", "url": "https://apps.apple.com/kr/app/%ED%94%BC%ED%94%BC/id6480352084"}]
status: ""
notionId: "27633aa8-a192-8161-bcaf-c384e565950c"
# team·myRole은 상세 페이지와 챗봇에, interviewQA는 챗봇에만 사용
team: "iOS 2명(본인 포함), Android 2명, 백엔드 2명"
myRole: "직접 기획하고 팀원을 모집한 사이드 프로젝트. 기획, UI/UX 화면 설계와 디자인, iOS 개발(소셜 로그인, CoreData 기반 일기 CRUD, 이미지 크롭), 앱스토어 배포를 담당"
interviewQA:
  - question: "앱스토어 심사에서 리젝된 경험이 있나요?"
    answer: "커뮤니티 기능이 있는데 사용자 차단·신고 기능이 없다는 이유로 리젝됐습니다. 그래서 내 UID와 차단할 사용자의 UID를 서버에 보내 차단하고, 차단한 사용자의 게시물·댓글·프로필이 보이지 않도록 처리한 뒤 재심사를 요청했습니다. EULA 약관이 없다는 이유로도 리젝돼서, 설정 화면에 약관을 추가해 해결했습니다."
  - question: "이미지 업로드는 어떤 방식으로 구현했나요?"
    answer: "Presigned URL 방식을 채택하려 했지만, 돌아보면 제대로 구현했다고 보기는 어렵습니다. 실제로는 클라이언트가 서버에 이미지를 보내면 서버가 S3에 올리고 파일 id를 돌려주고, 클라이언트가 그 id로 게시물을 등록하는 방식이었습니다. 당시 Presigned URL에 대한 이해가 부족했다는 걸 나중에 깨달았고, 본래 방식은 클라이언트가 서버에서 받은 URL로 S3에 직접 올려 서버 부하를 줄이는 것이라는 걸 정리했습니다."
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

![카카오 로그인](/projects/pipi/01.jpg)
- 카카오 로그인
- 애플 로그인

![로그인 여부에 따른 유저 프로필 노출](/projects/pipi/02.jpg)
- 로그인 여부에 따른 유저 프로필 노출
![프로필 수정](/projects/pipi/03.jpg)
- 프로필 수정
- 나의 게시물 및 좋아요 조회
![게시물 리스트 보기](/projects/pipi/04.jpg)
- 게시물 리스트 보기
![게시물 상세 보기](/projects/pipi/05.jpg)
- 게시물 상세 보기
![게시물 이미지와 텍스트  업로드](/projects/pipi/06.jpg)
- 게시물 이미지와 텍스트  업로드
![이미지 크롭](/projects/pipi/07.jpg)
- 이미지 크롭
![좋아요, 댓글, 삭제 기능](/projects/pipi/08.jpg)
- 좋아요, 댓글, 삭제 기능

### 기타 사항

- 직접 앱을 기획하여 UI/UX 화면설계 플로우차트 작성
  ![피피 화면 9](/projects/pipi/09.jpg)

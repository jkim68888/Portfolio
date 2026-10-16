import { cacheLife } from "next/cache";

// content/*.md를 읽는 "use cache" 함수 안에서 호출한다.
// - 배포본: 빌드 때 한 번 읽으면 충분하므로 최대한 오래 캐시한다.
// - 개발 중: .md 수정이 곧바로 보이도록 1초 뒤 다시 읽게 한다.
//   단, stale 30초 미만이나 expire 5분 미만이면 Next.js가 미리 렌더링에서 빼 버려
//   "Blocking Route" 에러가 나므로 stale·expire는 그 기준 이상으로 둔다.
export function contentCacheLife() {
  if (process.env.NODE_ENV === "development") {
    cacheLife({ stale: 300, revalidate: 1, expire: 3600 });
  } else {
    cacheLife("max");
  }
}

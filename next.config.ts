import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // 챗봇은 요청 시점에 content/*.md를 읽으므로 서버리스 함수에 함께 담는다.
  outputFileTracingIncludes: {
    "/api/chat": ["./content/**/*.md"],
  },
  // 이미지 등 HTML이 아닌 응답도 검색 결과에서 제외
  headers() {
    return [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

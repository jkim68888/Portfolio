"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { getVisitorId } from "./chat/use-chat-session";

// 페이지를 열거나 사이트 안에서 다른 페이지로 옮길 때마다 방문 기록을 보낸다. 화면에는 아무것도 그리지 않는다.
export function VisitTracker() {
  const pathname = usePathname();
  // 마지막으로 기록한 경로. 개발 모드(Strict Mode)에서 effect가 두 번 실행돼도 한 번만 보낸다.
  const sentRef = useRef<string>(undefined);

  useEffect(() => {
    if (sentRef.current === pathname) return;
    // 다른 사이트에서 들어온 경로는 처음 연 페이지에만 붙인다. 사이트 안에서 옮기면 document.referrer가 바뀌지 않는다.
    const referrer = sentRef.current === undefined ? document.referrer || undefined : undefined;
    sentRef.current = pathname;
    void fetch("/api/visit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ path: pathname, visitorId: getVisitorId(), referrer }),
      // 기록을 보내자마자 다른 사이트로 떠나도 요청이 끝까지 가게 한다.
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  return null;
}

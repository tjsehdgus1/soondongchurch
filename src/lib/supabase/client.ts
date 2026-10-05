import { createBrowserClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr'
import { REMEMBER_COOKIE, withSessionMaxAge } from '@/lib/supabase/session'

// 모듈 레벨 싱글톤 제거
// 이유: Next.js App Router는 'use client' 컴포넌트도 서버에서 SSR 프리렌더링함
// 컴포넌트 레벨에서 createClient()를 호출하면 서버 환경에서도 실행되어
// 브라우저 전용인 createBrowserClient가 비정상 인스턴스를 반환함
// 이 인스턴스가 싱글톤으로 캐싱되면 브라우저에서 재사용 → 모든 쿼리 무한 pending
// createBrowserClient 자체가 내부적으로 브라우저 환경 캐싱을 처리하므로 위임
//
// 쿠키는 직접 읽고 씀 — 라이브러리 기본값(400일) 대신 로그인 유지 기간(30일/12시간) 적용 (session.ts)
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          if (typeof document === 'undefined') return []
          return parseCookieHeader(document.cookie).map(({ name, value }) => ({ name, value: value ?? '' }))
        },
        setAll(cookiesToSet) {
          if (typeof document === 'undefined') return
          const remember = parseCookieHeader(document.cookie).some((c) => c.name === REMEMBER_COOKIE && c.value === '1')
          cookiesToSet.forEach(({ name, value, options }) => {
            document.cookie = serializeCookieHeader(name, value, withSessionMaxAge(options, remember))
          })
        },
      },
    }
  )
}

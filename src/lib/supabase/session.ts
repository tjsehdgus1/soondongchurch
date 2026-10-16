// 로그인 유지 기간 — 로그인 화면 '로그인 상태 유지' 체크 시 30일, 아니면 12시간
// 로그인 쿠키는 토큰이 갱신될 때마다(사용 중 약 1시간마다) 다시 써지므로 '마지막 사용 후' 기준으로 늘어남
// @supabase/ssr은 쿠키 유효기간을 늘 400일로 덮어쓰므로, 쿠키를 쓰는 세 곳
// (브라우저 client.ts · 서버 server.ts · proxy.ts)에서 이 함수로 유효기간을 바꿈 — tests/session.test.ts

export const REMEMBER_COOKIE = 'sd-remember'
export const REMEMBER_MAX_AGE = 30 * 24 * 60 * 60
export const SHORT_MAX_AGE = 12 * 60 * 60

// 라이브러리가 넘긴 쿠키 옵션에 우리 유효기간 적용 (삭제용 maxAge 0은 그대로)
export function withSessionMaxAge<T extends { maxAge?: number, expires?: Date }>(options: T, remember: boolean): Omit<T, 'expires'> {
    const { expires: _expires, ...rest } = options
    if (rest.maxAge === 0) return rest
    return { ...rest, maxAge: remember ? REMEMBER_MAX_AGE : SHORT_MAX_AGE }
}

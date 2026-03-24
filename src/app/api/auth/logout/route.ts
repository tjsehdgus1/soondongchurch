import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// [리팩토링] 302 redirect 제거 → 200 JSON 응답으로 변경
// 기존 문제: API 라우트가 302를 반환해도 fetch()는 redirect를 따라가지만
//           브라우저 주소창이 바뀌지 않음 → 이후 Navbar에서 window.location.href로
//           또 이동 → 불필요한 302 왕복으로 네트워크 레이턴시 낭비
// 변경: 서버는 세션 쿠키만 삭제하고 200 반환, 리다이렉트는 클라이언트가 전담
export async function POST() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    return NextResponse.json({ success: true })
}

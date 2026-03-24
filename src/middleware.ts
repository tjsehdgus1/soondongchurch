import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // IMPORTANT: getUser()는 반드시 호출 — 세션 토큰 갱신 담당
    const { data: { user } } = await supabase.auth.getUser()

    const pathname = request.nextUrl.pathname
    const isProtected = pathname.startsWith('/admin') || pathname.startsWith('/groups')

    // [리팩토링] 인증 필요 경로 통합 처리
    // 기존: /admin 미인증만 redirect, is_blocked는 별도 조건으로 분리
    // 변경: isProtected 하나의 조건으로 통합 → /groups도 미인증 redirect 적용
    if (isProtected) {
        if (!user) {
            const loginUrl = request.nextUrl.clone()
            loginUrl.pathname = '/auth/login'
            return NextResponse.redirect(loginUrl)
        }

        // [리팩토링] is_blocked 조회를 인증 검사 블록 안으로 이동
        // 기존: 두 개의 분리된 if문으로 getUser() 후 다시 조건 평가
        // 변경: 인증된 사용자에 대해서만 1회 DB 조회 — 불필요한 조건 재평가 제거
        try {
            const { data: profile } = await supabase
                .from('profiles')
                .select('is_blocked')
                .eq('id', user.id)
                .single()

            if (profile?.is_blocked) {
                const blockedUrl = request.nextUrl.clone()
                blockedUrl.pathname = '/auth/login'
                blockedUrl.searchParams.set('blocked', '1')
                return NextResponse.redirect(blockedUrl)
            }
        } catch {
            // profiles 조회 실패 시 차단 여부 확인 생략하고 통과
        }
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}


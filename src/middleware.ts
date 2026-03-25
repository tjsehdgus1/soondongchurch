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
                    cookiesToSet.forEach(({ name, value, options }) => {
                        // maxAge/expires 제거 → 브라우저 종료 시 자동 삭제되는 세션 쿠키
                        const { maxAge: _m, expires: _e, ...sessionOptions } = options ?? {}
                        supabaseResponse.cookies.set(name, value, sessionOptions)
                    })
                },
            },
        }
    )

    // IMPORTANT: getUser()는 반드시 호출 — 세션 토큰 갱신 담당
    // profiles 쿼리는 middleware에서 제거 (모든 요청마다 DB 왕복 방지)
    // is_blocked 체크는 admin/layout.tsx, groups/layout.tsx에서 처리
    const { data: { user } } = await supabase.auth.getUser()

    const pathname = request.nextUrl.pathname
    const isProtected = pathname.startsWith('/admin') || pathname.startsWith('/groups')

    if (isProtected && !user) {
        const loginUrl = request.nextUrl.clone()
        loginUrl.pathname = '/auth/login'
        return NextResponse.redirect(loginUrl)
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}


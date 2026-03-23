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
    // 반환값을 사용하지 않아도 사이드이펙트(쿠키 갱신)를 위해 반드시 await 해야 함
    const { data: { user } } = await supabase.auth.getUser()

    // 관리자 전용 경로 보호 (서버 사이드 redirect)
    if (request.nextUrl.pathname.startsWith('/admin')) {
        if (!user) {
            const loginUrl = request.nextUrl.clone()
            loginUrl.pathname = '/auth/login'
            return NextResponse.redirect(loginUrl)
        }
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}


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

    // 관리자 전용 경로 보호
    if (pathname.startsWith('/admin')) {
        if (!user) {
            const loginUrl = request.nextUrl.clone()
            loginUrl.pathname = '/auth/login'
            return NextResponse.redirect(loginUrl)
        }
    }

    // 차단된 유저가 인증이 필요한 경로 접근 시 차단
    if (user && (pathname.startsWith('/admin') || pathname.startsWith('/groups'))) {
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
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}


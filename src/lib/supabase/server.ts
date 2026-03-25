import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
    const cookieStore = await cookies()

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            // maxAge/expires 제거 → 브라우저 종료 시 자동 삭제되는 세션 쿠키
                            const { maxAge: _m, expires: _e, ...sessionOptions } = options ?? {}
                            cookieStore.set(name, value, sessionOptions)
                        })
                    } catch {
                        // Server Component에서 set 호출 — middleware에서 처리
                    }
                },
            },
        }
    )
}

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { REMEMBER_COOKIE, withSessionMaxAge } from '@/lib/supabase/session'

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
                        // 로그인 유지 기간: '로그인 상태 유지' 체크 시 30일, 아니면 12시간 (session.ts)
                        const remember = cookieStore.get(REMEMBER_COOKIE)?.value === '1'
                        cookiesToSet.forEach(({ name, value, options }) => {
                            cookieStore.set(name, value, withSessionMaxAge(options ?? {}, remember))
                        })
                    } catch {
                        // Server Component에서 set 호출 — middleware에서 처리
                    }
                },
            },
        }
    )
}

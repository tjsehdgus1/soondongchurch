// 공개 데이터 조회 전용 클라이언트 (쿠키 불필요)
// 쿠키를 사용하지 않으므로 revalidate(ISR 캐싱)와 함께 동작
import { createClient } from '@supabase/supabase-js'

export function createPublicClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
}

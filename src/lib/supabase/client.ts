import { createBrowserClient } from '@supabase/ssr'

// [리팩토링] 모듈 레벨 싱글톤 패턴 적용
// 기존: createClient() 호출마다 새 인스턴스 생성 → 리렌더 시 불필요한 객체 생성 반복
// 변경: 첫 호출 시 한 번만 생성, 이후 동일 인스턴스 재사용
// createBrowserClient 내부도 캐싱을 지원하지만 명시적 싱글톤이 더 안전
let clientInstance: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (!clientInstance) {
    clientInstance = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return clientInstance
}

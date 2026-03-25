import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function GroupsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // middleware가 미인증 redirect 처리 → getSession()으로 사용자 ID만 읽기
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_blocked')
    .eq('id', session.user.id)
    .single()

  if (profile?.is_blocked) {
    redirect('/auth/login?blocked=1')
  }

  return <>{children}</>
}

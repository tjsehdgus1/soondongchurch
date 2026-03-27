import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function GroupsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // middleware가 미인증 redirect 처리 → getUser()로 보안 검증
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_blocked')
    .eq('id', user.id)
    .single()

  if (profile?.is_blocked) {
    redirect('/auth/login?blocked=1')
  }

  return <>{children}</>
}

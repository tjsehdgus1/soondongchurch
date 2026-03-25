import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminSidebar from './AdminSidebar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // middleware가 이미 getUser()로 세션 검증 → getSession()으로 쿠키 읽기 (네트워크 호출 없음)
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/auth/login')
  }

  // role + is_blocked 1회 쿼리로 통합 (middleware profiles 쿼리 제거 대응)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, name, is_blocked')
    .eq('id', session.user.id)
    .single()

  if (profile?.is_blocked) {
    redirect('/auth/login?blocked=1')
  }

  if (profile?.role !== 'admin') {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <AdminSidebar name={profile?.name ?? session.user.email ?? ''} />
      <main className="flex-1 p-6 md:p-8 lg:p-10">
        {children}
      </main>
    </div>
  )
}

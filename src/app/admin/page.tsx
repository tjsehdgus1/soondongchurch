import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  // 병렬 실행 + 에러 시 0 fallback
  const safe = (q: PromiseLike<{ count: number | null }>) =>
    Promise.resolve(q).then(r => r.count ?? 0).catch(() => 0)

  const [memberCount, upcomingEventsCount, noticeCount] = await Promise.all([
    safe(supabase.from('profiles').select('*', { count: 'exact', head: true })),
    safe(supabase.from('events').select('*', { count: 'exact', head: true }).gte('event_date', new Date().toISOString().split('T')[0])),
    safe(supabase.from('notices').select('*', { count: 'exact', head: true })),
  ])

  // 퀵 메뉴 카드 컴포넌트
  const QuickCard = ({ title, count, href, icon, color }: { title: string, count: number, href: string, icon: string, color: string }) => (
    <Link href={href} className="group block bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-700">{title}</h3>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${color}`}>
          {icon}
        </div>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-4xl font-extrabold text-gray-900 group-hover:text-blue-600 transition-colors">
          {count ?? 0}
        </span>
        <span className="text-gray-500 mb-1">건</span>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center text-sm font-medium text-blue-600">
        관리하기
        <span className="group-hover:translate-x-1 transition-transform">→</span>
      </div>
    </Link>
  )

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">대시보드</h1>
        <p className="mt-2 text-gray-600">순천순동교회 홈페이지 관리자 센터입니다.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <QuickCard 
          title="등록된 교인" 
          count={memberCount || 0} 
          href="/admin/members" 
          icon="👥"
          color="bg-blue-50 text-blue-600"
        />
        <QuickCard 
          title="다가오는 일정" 
          count={upcomingEventsCount || 0} 
          href="/admin/events" 
          icon="📅"
          color="bg-amber-50 text-amber-600"
        />
        <QuickCard 
          title="전체 공지사항" 
          count={noticeCount || 0} 
          href="/admin/notices" 
          icon="📢"
          color="bg-indigo-50 text-indigo-600"
        />
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-8">
        <h2 className="text-xl font-bold text-blue-900 mb-2">👋 환영합니다!</h2>
        <p className="text-blue-800 leading-relaxed">
          좌측 메뉴를 이용해 교인 명부를 확인하거나 예배/행사 일정, 메인 화면의 공지사항을 직접 관리할 수 있습니다.<br/>
          모든 변경 사항은 홈페이지에 실시간으로 반영됩니다.
        </p>
      </div>
    </div>
  )
}

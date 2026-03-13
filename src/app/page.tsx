import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

const worshipSchedule = [
  { day: '주일', time: '오전 11:00', name: '주일 예배', icon: '🛐' },
  { day: '수요일', time: '오후 7:30', name: '수요 예배', icon: '✝️' },
  { day: '매일', time: '오전 5:30', name: '새벽 기도회', icon: '🌅' },
  { day: '금요일', time: '오후 7:00', name: '구역 예배', icon: '🏠' },
]

export default async function HomePage() {
  const supabase = await createClient()

  // 최신 공지사항 3개
  const { data: notices } = await supabase
    .from('notices')
    .select('id, title, created_at, is_pinned')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(3)

  // 다가오는 행사 3개
  const { data: events } = await supabase
    .from('events')
    .select('id, title, event_date, event_time, event_type, location')
    .gte('event_date', new Date().toISOString().split('T')[0])
    .order('event_date', { ascending: true })
    .limit(3)

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500 rounded-full opacity-20 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-indigo-400 rounded-full opacity-20 blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-28 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-blue-100 text-sm font-medium px-4 py-2 rounded-full mb-6">
            <span>✝</span>
            <span>하나님의 은혜 안에서 함께 성장하는 교회</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
            순천순동교회에<br />
            <span className="text-blue-300">오신 것을</span><br />
            환영합니다
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-10 leading-relaxed">
            예수 그리스도의 사랑으로 하나되어 섬기며,<br />
            하나님의 말씀 위에 세워진 교회입니다.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/events"
              className="px-8 py-4 bg-white text-blue-700 font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
              예배 일정 보기
            </Link>
            <Link href="/auth/register"
              className="px-8 py-4 bg-blue-600/50 border border-white/30 text-white font-bold rounded-xl hover:bg-blue-600 transition-all backdrop-blur-sm">
              교인 등록하기
            </Link>
          </div>
        </div>
      </section>

      {/* Worship Schedule */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-blue-600 font-semibold text-sm uppercase tracking-wider">예배 안내</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">정기 예배 시간</h2>
            <p className="text-gray-500 mt-3 max-w-lg mx-auto">함께 드리는 예배는 가장 큰 기쁨입니다</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {worshipSchedule.map((w) => (
              <div key={w.name}
                className="group bg-gradient-to-br from-gray-50 to-blue-50 border border-gray-100 rounded-2xl p-6 hover:shadow-lg hover:-translate-y-1 transition-all cursor-default">
                <div className="text-4xl mb-4">{w.icon}</div>
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">{w.day}</p>
                <h3 className="font-bold text-gray-900 text-lg mb-1">{w.name}</h3>
                <p className="text-2xl font-extrabold text-blue-700">{w.time}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Events + Notices */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

            {/* Upcoming Events */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">다가오는 행사</h2>
                <Link href="/events" className="text-blue-600 text-sm font-medium hover:underline">
                  전체 보기 →
                </Link>
              </div>
              <div className="space-y-4">
                {events && events.length > 0 ? events.map((ev) => {
                  const typeLabel = ev.event_type === 'worship' ? '예배' : ev.event_type === 'event' ? '행사' : '모임'
                  const typeColor = ev.event_type === 'worship'
                    ? 'bg-blue-100 text-blue-700'
                    : ev.event_type === 'event'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-green-100 text-green-700'
                  return (
                    <div key={ev.id} className="flex items-center gap-4 bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                      <div className="text-center bg-blue-50 rounded-xl px-3 py-2 min-w-[56px]">
                        <p className="text-xs text-blue-500 font-medium">
                          {new Date(ev.event_date).toLocaleDateString('ko-KR', { month: 'short' })}
                        </p>
                        <p className="text-xl font-extrabold text-blue-700">
                          {new Date(ev.event_date).getDate()}
                        </p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${typeColor}`}>{typeLabel}</span>
                        </div>
                        <p className="font-semibold text-gray-900 truncate">{ev.title}</p>
                        <p className="text-sm text-gray-500">{ev.event_time?.slice(0, 5)} · {ev.location}</p>
                      </div>
                    </div>
                  )
                }) : (
                  <p className="text-gray-400 text-center py-8">등록된 행사가 없습니다.</p>
                )}
              </div>
            </div>

            {/* Latest Notices */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">최신 공지사항</h2>
                <Link href="/notices" className="text-blue-600 text-sm font-medium hover:underline">
                  전체 보기 →
                </Link>
              </div>
              <div className="space-y-3">
                {notices && notices.length > 0 ? notices.map((n) => (
                  <Link
                    key={n.id}
                    href={`/notices/${n.id}`}
                    className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-100 transition-all group"
                  >
                    {n.is_pinned && (
                      <span className="flex-shrink-0 bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">📌 중요</span>
                    )}
                    <span className="flex-1 font-medium text-gray-800 group-hover:text-blue-700 truncate">{n.title}</span>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {new Date(n.created_at).toLocaleDateString('ko-KR')}
                    </span>
                  </Link>
                )) : (
                  <p className="text-gray-400 text-center py-8">등록된 공지사항이 없습니다.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Church Info / Vision */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-blue-600 font-semibold text-sm uppercase tracking-wider">교회 소개</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">우리 교회의 비전</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: '📖', title: '말씀 중심', desc: '성경 말씀을 삶의 기준으로 삼고, 매일 말씀을 통해 하나님을 만나는 교회입니다.' },
              { icon: '🙏', title: '기도하는 교회', desc: '쉬지 않고 기도하며 하나님의 뜻을 구하는 기도 운동이 살아있는 교회입니다.' },
              { icon: '💕', title: '사랑의 공동체', desc: '이웃과 지역사회를 섬기며 그리스도의 사랑을 실천하는 공동체입니다.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="text-center p-8 rounded-2xl bg-gradient-to-b from-blue-50 to-white border border-blue-100 hover:shadow-lg transition-shadow">
                <div className="text-5xl mb-4">{icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

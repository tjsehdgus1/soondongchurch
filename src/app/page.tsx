import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import HeroSlider from '@/components/HeroSlider'

const worshipSchedule = [
  { day: '주일', time: '오전 11:00', name: '주일오전예배', icon: '🛐' },
  { day: '주일', time: '오후 1:30', name: '주일오후예배', icon: '☀️' },
  { day: '수요일', time: '오후 7:00', name: '수요밤예배', icon: '✝️' },
  { day: '금요일', time: '오후 8:00', name: '금요기도회', icon: '🙏' },
  { day: '매일', time: '오전 5:00', name: '새벽예배', icon: '🌅' },
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
      <section className="relative text-white overflow-hidden bg-gray-900 min-h-[90vh] flex items-center justify-center">
        <HeroSlider />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 text-center w-full z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-medium px-5 py-2.5 rounded-full mb-8 shadow-xl">
            <span className="text-amber-400">✝</span>
            <span>하나님의 은혜 안에서 함께 성장하는 교회</span>
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-8 leading-tight drop-shadow-2xl">
            <span className="text-amber-400 drop-shadow-lg">하나님이</span> 기뻐하시는<br />
            행복한 교회
          </h1>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-xl md:text-2xl text-gray-100 max-w-4xl mx-auto mb-12 drop-shadow-md font-bold">
            <div className="flex items-center gap-2">
              <span className="text-amber-400 text-2xl">✧</span>
              <span>예배가 살아있는 교회</span>
            </div>
            <span className="hidden md:inline text-white/40">|</span>
            <div className="flex items-center gap-2">
              <span className="text-amber-400 text-2xl">✧</span>
              <span>기도가 살아있는 교회</span>
            </div>
            <span className="hidden md:inline text-white/40">|</span>
            <div className="flex items-center gap-2">
              <span className="text-amber-400 text-2xl">✧</span>
              <span>선교가 살아있는 교회</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="https://www.youtube.com/@%EC%88%9C%EC%B2%9C%EC%88%9C%EB%8F%99%EA%B5%90%ED%9A%8C"
              target="_blank" rel="noopener noreferrer"
              className="px-8 py-4 bg-red-600/90 text-white hover:bg-red-600 font-bold rounded-xl shadow-[0_4px_14px_0_rgba(220,38,38,0.39)] hover:shadow-[0_6px_20px_rgba(220,38,38,0.23)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 backdrop-blur-sm">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55a3.016 3.016 0 0 0-2.122 2.136C0 8.086 0 12 0 12s0 3.914.501 5.814a3.016 3.016 0 0 0 2.122 2.136c1.872.55 9.377.55 9.377.55s7.505 0 9.377-.55a3.016 3.016 0 0 0 2.122-2.136C24 15.914 24 12 24 12s0-3.914-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
              순동교회 유튜브
            </Link>
            <Link href="/events"
              className="px-8 py-4 bg-amber-500 text-white hover:bg-amber-600 font-bold rounded-xl shadow-[0_4px_14px_0_rgba(245,158,11,0.39)] hover:shadow-[0_6px_20px_rgba(245,158,11,0.23)] hover:-translate-y-0.5 transition-all flex items-center justify-center">
              예배 일정 보기
            </Link>
            <Link href="/auth/register"
              className="px-8 py-4 bg-white/10 border border-white/30 text-white font-bold rounded-xl hover:bg-white/20 transition-all backdrop-blur-md shadow-lg flex items-center justify-center">
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
              { icon: '🛐', title: '예배가 살아있는 교회', desc: '하나님이 기뻐하시는 온전한 예배를 통해 영적 회복을 경험하는 공동체입니다.' },
              { icon: '🙏', title: '기도가 살아있는 교회', desc: '쉬지 않고 깨어 기도하며 하나님의 뜻을 먼저 구하는 응답의 공동체입니다.' },
              { icon: '🌍', title: '선교가 살아있는 교회', desc: '지역 사회를 섬기고 열방을 향해 복음을 전파하는 사명의 공동체입니다.' },
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

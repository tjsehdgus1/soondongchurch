import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import HeroSlider from '@/components/HeroSlider'
import ScrollReveal from '@/components/ScrollReveal'

type Sermon = {
  id: number
  title: string
  sermon_date: string
  thumbnail_url: string | null
  summary: string | null
}

const worshipSchedule = [
  { day: '주일', time: '오전 11:00', name: '주일오전예배', gradient: ['#3b82f6', '#1d4ed8'], image: '/images/worships/sun_morning.png' },
  { day: '주일', time: '오후 1:30', name: '주일오후예배', gradient: ['#f59e0b', '#b45309'], image: '/images/worships/sun_afternoon.png' },
  { day: '수요일', time: '오후 7:00', name: '수요밤예배', gradient: ['#6366f1', '#3730a3'], image: '/images/worships/wed_night.png' },
  { day: '금요일', time: '오후 8:00', name: '금요기도회', gradient: ['#8b5cf6', '#5b21b6'], image: '/images/worships/fri_prayer.png' },
  { day: '매일', time: '오전 5:00', name: '새벽예배', gradient: ['#1e3a5f', '#0f172a'], image: '/images/worships/dawn_prayer.png' },
]

export default async function HomePage() {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const [
    { data: notices },
    { data: events },
    { data: sermons },
    { data: { user } },
  ] = await Promise.all([
    supabase
      .from('notices')
      .select('id, title, created_at, is_pinned')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(3),
    supabase
      .from('events')
      .select('id, title, event_date, event_time, event_type, location')
      .gte('event_date', today)
      .order('event_date', { ascending: true })
      .limit(3),
    supabase
      .from('sermons')
      .select('id, title, sermon_date, thumbnail_url, summary')
      .eq('status', 'published')
      .order('sermon_date', { ascending: false })
      .limit(2),
    supabase.auth.getUser(),
  ])

  return (
    <div>
      {/* ─── Hero Section ─── */}
      <section className="relative text-white overflow-hidden min-h-[90vh] flex items-center justify-center" style={{ background: '#2D2A26' }}>
        <HeroSlider />

        <div className="relative max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 text-center w-full z-10">
          <div className="inline-flex items-center gap-2 bg-[#FAF8F5]/15 backdrop-blur-md border border-[#B8860B]/30 text-white text-sm font-medium px-5 py-2.5 rounded-full mb-8 shadow-xl">
            <span style={{ color: '#B8860B' }}>✝</span>
            <span>하나님의 은혜 안에서 함께 성장하는 교회</span>
          </div>
          <h1
            className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-8 leading-tight drop-shadow-2xl"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            <span style={{ color: '#D4A843' }} className="drop-shadow-lg">하나님이</span> 기뻐하시는<br />
            행복한 교회
          </h1>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-base md:text-2xl text-gray-100 max-w-[1300px] mx-auto mb-12 drop-shadow-md font-bold">
            <div className="flex items-center gap-2">
              <span style={{ color: '#D4A843' }} className="text-2xl">✧</span>
              <span>예배가 살아있는 교회</span>
            </div>
            <span className="hidden md:inline text-white/40">|</span>
            <div className="flex items-center gap-2">
              <span style={{ color: '#D4A843' }} className="text-2xl">✧</span>
              <span>기도가 살아있는 교회</span>
            </div>
            <span className="hidden md:inline text-white/40">|</span>
            <div className="flex items-center gap-2">
              <span style={{ color: '#D4A843' }} className="text-2xl">✧</span>
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
            {!user && (
              <Link href="/auth/register"
                className="px-8 py-4 bg-white/10 border border-[#B8860B]/40 text-white font-bold rounded-xl hover:bg-[#B8860B]/20 transition-all backdrop-blur-md shadow-lg flex items-center justify-center">
                교인 등록하기
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ─── Worship Schedule ─── */}
      <section className="relative py-20 overflow-hidden" style={{ background: '#FAF8F5' }}>
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat mix-blend-multiply opacity-[0.04]"
          style={{ backgroundImage: "url('/images/worship_schedule_bg.png')" }}
        />
        <div className="relative max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <ScrollReveal className="text-center mb-12">
            <span className="font-semibold text-sm uppercase tracking-wider" style={{ color: '#B8860B', fontFamily: 'var(--font-serif)' }}>예배 안내</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-2" style={{ color: '#2D2A26', fontFamily: 'var(--font-serif)' }}>정기 예배 시간</h2>
            <p className="mt-3 max-w-lg mx-auto" style={{ color: '#8B7355' }}>함께 드리는 예배는 가장 큰 기쁨입니다</p>
          </ScrollReveal>
          <ScrollReveal className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4" stagger>
            {worshipSchedule.map((w) => (
              <div key={w.name}
                className="group relative overflow-hidden rounded-2xl hover:shadow-xl hover:-translate-y-1 transition-all cursor-default min-h-[160px] flex flex-col justify-end"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                  style={{ backgroundImage: `url('${w.image}')` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10 transition-opacity" />
                <div className="relative p-6 flex flex-col justify-end h-full z-10">
                  <p className="text-xs font-semibold text-white/90 uppercase tracking-widest mb-1">{w.day}</p>
                  <h3 className="font-bold text-white text-base leading-tight mb-2 drop-shadow-md">{w.name}</h3>
                  <p className="text-xl font-extrabold text-white drop-shadow-lg">{w.time}</p>
                </div>
              </div>
            ))}
          </ScrollReveal>
        </div>
      </section>

      {/* ─── Recent Sermons ─── */}
      <section className="py-20 bg-white border-y" style={{ borderColor: '#E8E4DE' }}>
        <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal className="flex items-center justify-between mb-10">
            <div>
              <span className="font-semibold text-sm uppercase tracking-wider" style={{ color: '#B8860B' }}>Sermons</span>
              <h2 className="text-3xl font-bold mt-2" style={{ color: '#2D2A26', fontFamily: 'var(--font-serif)' }}>목사님 설교</h2>
            </div>
            <Link href="/sermons" className="text-sm font-medium px-4 py-2 rounded-full border shadow-sm transition-all hover:shadow-md" style={{ color: '#B8860B', borderColor: '#E8E4DE', background: '#FAF8F5' }}>
              전체 설교 보기 →
            </Link>
          </ScrollReveal>

          {!sermons || sermons.length === 0 ? (
            <div className="py-20 text-center rounded-3xl border-2 border-dashed text-gray-400" style={{ borderColor: '#E8E4DE' }}>
              <p className="text-lg">설교 영상을 준비 중입니다.</p>
              <p className="text-sm mt-1">관리자 페이지에서 첫 설교 요약을 등록해 보세요!</p>
            </div>
          ) : (
            <ScrollReveal className="grid grid-cols-1 md:grid-cols-2 gap-6" stagger>
              {(sermons as Sermon[]).map((s) => (
                <Link key={s.id} href={`/sermons/${s.id}`} className="group bg-white rounded-2xl overflow-hidden border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col" style={{ borderColor: '#E8E4DE' }}>
                  <div className="relative aspect-video overflow-hidden bg-gray-100">
                    <img src={s.thumbnail_url ?? undefined} alt={s.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-white/90 shadow flex items-center justify-center opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all">
                        <svg className="w-5 h-5 translate-x-0.5" fill="currentColor" viewBox="0 0 24 24" style={{ color: '#B8860B' }}><path d="M8 5v14l11-7z" /></svg>
                      </div>
                    </div>
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <p className="text-xs font-semibold mb-2" style={{ color: '#B8860B' }}>
                      {new Date(s.sermon_date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                    <h3 className="font-bold text-base line-clamp-2 leading-snug transition-colors mb-3" style={{ color: '#2D2A26' }}>{s.title}</h3>
                    {s.summary && (
                      <p className="text-sm leading-relaxed line-clamp-2" style={{ color: '#8B7355' }}>{s.summary}</p>
                    )}
                    <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold group-hover:gap-2 transition-all" style={{ color: '#B8860B' }}>
                      말씀 보기
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </Link>
              ))}
            </ScrollReveal>
          )}
        </div>
      </section>

      {/* ─── Upcoming Events + Notices ─── */}
      <section className="py-20 bg-white">
        <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

            {/* Upcoming Events */}
            <ScrollReveal>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold" style={{ color: '#2D2A26', fontFamily: 'var(--font-serif)' }}>다가오는 행사</h2>
                <Link href="/events" className="text-sm font-medium hover:underline" style={{ color: '#B8860B' }}>
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
                    <div key={ev.id} className="flex items-center gap-4 bg-white rounded-xl p-4 shadow-sm border hover:shadow-md transition-shadow" style={{ borderColor: '#E8E4DE' }}>
                      <div className="text-center rounded-xl px-3 py-2 min-w-[56px]" style={{ background: '#B8860B1A' }}>
                        <p className="text-xs font-medium" style={{ color: '#B8860B' }}>
                          {new Date(ev.event_date + 'T00:00:00').toLocaleDateString('ko-KR', { month: 'short' })}
                        </p>
                        <p className="text-xl font-extrabold" style={{ color: '#B8860B' }}>
                          {new Date(ev.event_date + 'T00:00:00').getDate()}
                        </p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${typeColor}`}>{typeLabel}</span>
                        </div>
                        <p className="font-semibold truncate" style={{ color: '#2D2A26' }}>{ev.title}</p>
                        <p className="text-sm" style={{ color: '#8B7355' }}>{ev.event_time?.slice(0, 5)} · {ev.location}</p>
                      </div>
                    </div>
                  )
                }) : (
                  <p className="text-center py-8" style={{ color: '#8B7355' }}>등록된 행사가 없습니다.</p>
                )}
              </div>
            </ScrollReveal>

            {/* Latest Notices */}
            <ScrollReveal delay={120}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold" style={{ color: '#2D2A26', fontFamily: 'var(--font-serif)' }}>최신 공지사항</h2>
                <Link href="/notices" className="text-sm font-medium hover:underline" style={{ color: '#B8860B' }}>
                  전체 보기 →
                </Link>
              </div>
              <div className="space-y-3">
                {notices && notices.length > 0 ? notices.map((n) => (
                  <Link
                    key={n.id}
                    href={`/notices/${n.id}`}
                    className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm border hover:shadow-md transition-all group"
                    style={{ borderColor: '#E8E4DE' }}
                  >
                    {n.is_pinned && (
                      <span className="flex-shrink-0 bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">📌 중요</span>
                    )}
                    <span className="flex-1 font-medium truncate" style={{ color: '#2D2A26' }}>{n.title}</span>
                    <span className="text-xs flex-shrink-0" style={{ color: '#8B7355' }}>
                      {new Date(n.created_at).toLocaleDateString('ko-KR')}
                    </span>
                  </Link>
                )) : (
                  <p className="text-center py-8" style={{ color: '#8B7355' }}>등록된 공지사항이 없습니다.</p>
                )}
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ─── Church Vision — 비대칭 레이아웃 ─── */}
      <section className="py-20" style={{ background: '#FAF8F5' }}>
        <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal className="text-center mb-14">
            <span className="font-semibold text-sm uppercase tracking-wider" style={{ color: '#B8860B', fontFamily: 'var(--font-serif)' }}>교회 소개</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-2" style={{ color: '#2D2A26', fontFamily: 'var(--font-serif)' }}>우리 교회의 비전</h2>
          </ScrollReveal>

          {/* 3개 카드 — 왼쪽 넓은 카드 1 + 오른쪽 2개 세로 스택 (높이 자동 맞춤) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:items-stretch">
            {/* 왼쪽 — 예배 카드 */}
            <ScrollReveal className="rounded-2xl border p-8 flex flex-col hover:shadow-lg transition-shadow" style={{ background: '#FFFFFF', borderColor: '#E8E4DE' }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6" style={{ background: '#B8860B1A' }}>
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="#B8860B" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#B8860B' }}>Worship</span>
              <h3 className="text-2xl font-bold mb-3" style={{ color: '#2D2A26', fontFamily: 'var(--font-serif)' }}>예배가 살아있는 교회</h3>
              <p className="leading-relaxed" style={{ color: '#8B7355' }}>하나님이 기뻐하시는 온전한 예배를 통해 영적 회복을 경험하는 공동체입니다.</p>
            </ScrollReveal>

            {/* 오른쪽 — 2개 세로 스택 */}
            <div className="flex flex-col gap-6">
              <ScrollReveal delay={100} className="rounded-2xl border p-8 flex gap-5 items-start hover:shadow-lg transition-shadow flex-1" style={{ background: '#FFFFFF', borderColor: '#E8E4DE' }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: '#B8860B1A' }}>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="#B8860B" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2" style={{ color: '#2D2A26', fontFamily: 'var(--font-serif)' }}>기도가 살아있는 교회</h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#8B7355' }}>쉬지 않고 깨어 기도하며 하나님의 뜻을 먼저 구하는 응답의 공동체입니다.</p>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={200} className="rounded-2xl border p-8 flex gap-5 items-start hover:shadow-lg transition-shadow flex-1" style={{ background: '#FFFFFF', borderColor: '#E8E4DE' }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: '#B8860B1A' }}>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="#B8860B" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2" style={{ color: '#2D2A26', fontFamily: 'var(--font-serif)' }}>선교가 살아있는 교회</h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#8B7355' }}>지역 사회를 섬기고 열방을 향해 복음을 전파하는 사명의 공동체입니다.</p>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

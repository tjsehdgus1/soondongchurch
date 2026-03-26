import { createPublicClient } from '@/lib/supabase/public'

const eventTypeMap: Record<string, { label: string; color: string; bg: string }> = {
    worship: { label: '예배', color: 'text-blue-700', bg: 'bg-blue-100' },
    event: { label: '행사', color: 'text-purple-700', bg: 'bg-purple-100' },
    meeting: { label: '모임', color: 'text-green-700', bg: 'bg-green-100' },
}

function formatDate(dateStr: string) {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })
}

function formatTime(timeStr: string | null) {
    if (!timeStr) return ''
    return timeStr.slice(0, 5)
}

export const revalidate = 300 // 5분 캐시 — 행사 일정은 자주 바뀌지 않음

export const metadata = {
    title: '예배/행사 일정 | 순천순동교회',
    description: '순천순동교회의 예배 및 행사 일정 안내',
}

export default async function EventsPage() {
    const supabase = createPublicClient()

    const today = new Date().toISOString().split('T')[0]
    const [{ data: upcoming }, { data: past }] = await Promise.all([
        supabase
            .from('events')
            .select('id, title, event_date, event_time, event_type, location, description')
            .gte('event_date', today)
            .order('event_date', { ascending: true }),
        supabase
            .from('events')
            .select('id, title, event_date, event_time, event_type, location, description')
            .lt('event_date', today)
            .order('event_date', { ascending: false })
            .limit(5),
    ])

    return (
        <div className="min-h-screen" style={{ background: '#FAF8F5' }}>
        {/* 헤더 */}
        <div className="bg-white border-b" style={{ borderColor: '#E8E4DE' }}>
            <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <span className="font-semibold text-sm uppercase tracking-wider" style={{ color: '#B8860B' }}>Schedule</span>
                <h1 className="text-3xl md:text-4xl font-bold mt-2" style={{ color: '#2D2A26', fontFamily: 'var(--font-serif)' }}>행사일정</h1>
                <p className="mt-2" style={{ color: '#8B7355' }}>순천순동교회의 예배 및 다양한 행사 일정을 안내합니다.</p>
            </div>
        </div>
        <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 py-10">

            {/* Upcoming Events */}
            <section className="mb-12">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: '#2D2A26' }}>
                    <span className="w-2 h-6 rounded-full inline-block" style={{ background: '#B8860B' }} />
                    다가오는 일정
                </h2>

                {upcoming && upcoming.length > 0 ? (
                    <div className="space-y-4">
                        {upcoming.map((ev) => {
                            const type = eventTypeMap[ev.event_type] ?? eventTypeMap.event
                            return (
                                <div key={ev.id} className="bg-white rounded-2xl shadow-sm border p-5 flex gap-5 hover:shadow-md transition-shadow" style={{ borderColor: '#E8E4DE' }}>
                                    {/* Date badge */}
                                    <div className="flex-shrink-0 text-center rounded-2xl px-4 py-3 min-w-[64px]" style={{ background: '#B8860B14' }}>
                                        <p className="text-xs font-bold uppercase" style={{ color: '#B8860B' }}>
                                            {new Date(ev.event_date + 'T00:00:00').toLocaleDateString('ko-KR', { month: 'short' })}
                                        </p>
                                        <p className="text-3xl font-extrabold leading-none" style={{ color: '#B8860B' }}>
                                            {new Date(ev.event_date + 'T00:00:00').getDate()}
                                        </p>
                                        <p className="text-xs mt-0.5" style={{ color: '#8B7355' }}>
                                            {new Date(ev.event_date + 'T00:00:00').toLocaleDateString('ko-KR', { weekday: 'short' })}
                                        </p>
                                    </div>
                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${type.bg} ${type.color}`}>
                                                {type.label}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-lg leading-snug" style={{ color: '#2D2A26' }}>{ev.title}</h3>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm" style={{ color: '#8B7355' }}>
                                            {ev.event_time && (
                                                <span className="flex items-center gap-1">
                                                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    {formatTime(ev.event_time)}
                                                </span>
                                            )}
                                            {ev.location && (
                                                <span className="flex items-center gap-1">
                                                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                    {ev.location}
                                                </span>
                                            )}
                                        </div>
                                        {ev.description && (
                                            <p className="mt-2 text-sm leading-relaxed" style={{ color: '#8B7355' }}>{ev.description}</p>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-white rounded-2xl border" style={{ borderColor: '#E8E4DE' }}>
                        <p className="text-4xl mb-3">📅</p>
                        <p style={{ color: '#8B7355' }}>예정된 일정이 없습니다.</p>
                    </div>
                )}
            </section>

            {/* Past Events */}
            {past && past.length > 0 && (
                <section>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: '#2D2A26' }}>
                        <span className="w-2 h-6 rounded-full inline-block" style={{ background: '#C8C2B8' }} />
                        지난 일정
                    </h2>
                    <div className="space-y-3">
                        {past.map((ev) => {
                            const type = eventTypeMap[ev.event_type] ?? eventTypeMap.event
                            return (
                                <div key={ev.id} className="bg-white rounded-xl border p-4 flex items-center gap-4 opacity-60" style={{ borderColor: '#E8E4DE' }}>
                                    <div className="text-center min-w-[52px]">
                                        <p className="text-xs text-gray-400">{new Date(ev.event_date + 'T00:00:00').toLocaleDateString('ko-KR', { month: 'short' })}</p>
                                        <p className="text-xl font-bold text-gray-500">{new Date(ev.event_date + 'T00:00:00').getDate()}</p>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mr-2 ${type.bg} ${type.color}`}>{type.label}</span>
                                        <span className="font-medium text-gray-700">{ev.title}</span>
                                    </div>
                                    <span className="text-xs text-gray-400 flex-shrink-0">{ev.location}</span>
                                </div>
                            )
                        })}
                    </div>
                </section>
            )}
        </div>
        </div>
    )
}

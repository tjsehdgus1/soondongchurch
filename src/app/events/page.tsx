import { createClient } from '@/lib/supabase/server'

const eventTypeMap: Record<string, { label: string; color: string; bg: string }> = {
    worship: { label: '예배', color: 'text-blue-700', bg: 'bg-blue-100' },
    event: { label: '행사', color: 'text-purple-700', bg: 'bg-purple-100' },
    meeting: { label: '모임', color: 'text-green-700', bg: 'bg-green-100' },
}

function formatDate(dateStr: string) {
    const d = new Date(dateStr)
    return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })
}

function formatTime(timeStr: string | null) {
    if (!timeStr) return ''
    return timeStr.slice(0, 5)
}

export const metadata = {
    title: '예배/행사 일정 | 순천순동교회',
    description: '순천순동교회의 예배 및 행사 일정 안내',
}

export default async function EventsPage() {
    const supabase = await createClient()

    const { data: upcoming } = await supabase
        .from('events')
        .select('*')
        .gte('event_date', new Date().toISOString().split('T')[0])
        .order('event_date', { ascending: true })

    const { data: past } = await supabase
        .from('events')
        .select('*')
        .lt('event_date', new Date().toISOString().split('T')[0])
        .order('event_date', { ascending: false })
        .limit(5)

    return (
        <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Header */}
            <div className="mb-10">
                <span className="text-blue-600 font-semibold text-sm uppercase tracking-wider">Schedule</span>
                <h1 className="text-4xl font-extrabold text-gray-900 mt-1">예배 / 행사 일정</h1>
                <p className="text-gray-500 mt-2">순천순동교회의 예배 및 다양한 행사 일정을 안내합니다.</p>
            </div>

            {/* Upcoming Events */}
            <section className="mb-12">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="w-2 h-6 bg-blue-600 rounded-full inline-block" />
                    다가오는 일정
                </h2>

                {upcoming && upcoming.length > 0 ? (
                    <div className="space-y-4">
                        {upcoming.map((ev) => {
                            const type = eventTypeMap[ev.event_type] ?? eventTypeMap.event
                            return (
                                <div key={ev.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex gap-5 hover:shadow-md transition-shadow">
                                    {/* Date badge */}
                                    <div className="flex-shrink-0 text-center bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl px-4 py-3 min-w-[64px]">
                                        <p className="text-xs font-bold text-blue-500 uppercase">
                                            {new Date(ev.event_date).toLocaleDateString('ko-KR', { month: 'short' })}
                                        </p>
                                        <p className="text-3xl font-extrabold text-blue-700 leading-none">
                                            {new Date(ev.event_date).getDate()}
                                        </p>
                                        <p className="text-xs text-blue-400 mt-0.5">
                                            {new Date(ev.event_date).toLocaleDateString('ko-KR', { weekday: 'short' })}
                                        </p>
                                    </div>
                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${type.bg} ${type.color}`}>
                                                {type.label}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-gray-900 text-lg leading-snug">{ev.title}</h3>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-gray-500">
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
                                            <p className="mt-2 text-sm text-gray-500 leading-relaxed">{ev.description}</p>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                        <p className="text-4xl mb-3">📅</p>
                        <p className="text-gray-500">예정된 일정이 없습니다.</p>
                    </div>
                )}
            </section>

            {/* Past Events */}
            {past && past.length > 0 && (
                <section>
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <span className="w-2 h-6 bg-gray-300 rounded-full inline-block" />
                        지난 일정
                    </h2>
                    <div className="space-y-3">
                        {past.map((ev) => {
                            const type = eventTypeMap[ev.event_type] ?? eventTypeMap.event
                            return (
                                <div key={ev.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4 opacity-60">
                                    <div className="text-center min-w-[52px]">
                                        <p className="text-xs text-gray-400">{new Date(ev.event_date).toLocaleDateString('ko-KR', { month: 'short' })}</p>
                                        <p className="text-xl font-bold text-gray-500">{new Date(ev.event_date).getDate()}</p>
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
    )
}

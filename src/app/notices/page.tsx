import Link from 'next/link'
import { createPublicClient } from '@/lib/supabase/public'

export const revalidate = 60 // 1분 캐시

export const metadata = {
    title: '공지사항 | 순천순동교회',
    description: '순천순동교회 공지사항 목록',
}

function formatDate(dateStr: string) {
    const d = new Date(dateStr)
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`
}

export default async function NoticesPage() {
    const supabase = createPublicClient()

    const { data: notices } = await supabase
        .from('notices')
        .select('id, title, author_name, is_pinned, created_at')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })

    const pinned = notices?.filter((n) => n.is_pinned) ?? []
    const regular = notices?.filter((n) => !n.is_pinned) ?? []

    return (
        <div className="min-h-screen" style={{ background: '#FAF8F5' }}>
            {/* 헤더 */}
            <div className="bg-white border-b" style={{ borderColor: '#E8E4DE' }}>
                <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
                    <span className="font-semibold text-sm uppercase tracking-wider" style={{ color: '#B8860B' }}>Notice</span>
                    <h1 className="text-3xl md:text-4xl font-bold mt-2" style={{ color: '#2D2A26', fontFamily: 'var(--font-serif)' }}>공지사항</h1>
                    <p className="mt-2" style={{ color: '#8B7355' }}>순천순동교회의 새로운 소식을 확인하세요.</p>
                </div>
            </div>

            <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {notices?.length === 0 ? (
                    <div className="text-center py-24 text-gray-400">
                        <p className="text-4xl mb-3">📋</p>
                        <p className="font-medium">등록된 공지사항이 없습니다.</p>
                    </div>
                ) : (
                    <>
                        {/* 중요 공지 */}
                        {pinned.length > 0 && (
                            <div>
                                <h2 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: '#B8860B' }}>중요 공지</h2>
                                <div className="space-y-4">
                                    {pinned.map((n) => (
                                        <Link
                                            key={n.id}
                                            href={`/notices/${n.id}`}
                                            className="block bg-white rounded-2xl shadow-sm border hover:shadow-md transition-all p-6 group"
                                            style={{ borderColor: '#B8860B33' }}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-3" style={{ background: '#B8860B1A', color: '#B8860B' }}>📌 중요</span>
                                                    <h3 className="text-xl font-bold" style={{ color: '#2D2A26' }}>{n.title}</h3>
                                                    <p className="text-sm mt-1" style={{ color: '#8B7355' }}>{n.author_name} · {formatDate(n.created_at)}</p>
                                                </div>
                                                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#B8860B1A' }}>
                                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#B8860B' }}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 일반 공지 */}
                        {regular.length > 0 && (
                            <div>
                                <h2 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: '#8B7355' }}>
                                    {pinned.length > 0 ? '일반 공지' : '공지사항'}
                                </h2>
                                <div className="bg-white rounded-2xl shadow-sm border divide-y" style={{ borderColor: '#E8E4DE' }}>
                                    {regular.map((n) => (
                                        <Link
                                            key={n.id}
                                            href={`/notices/${n.id}`}
                                            className="flex items-center justify-between px-6 py-4 transition-colors group hover:bg-[#B8860B08]"
                                        >
                                            <div>
                                                <p className="font-semibold" style={{ color: '#2D2A26' }}>{n.title}</p>
                                                <p className="text-sm mt-0.5" style={{ color: '#8B7355' }}>{n.author_name} · {formatDate(n.created_at)}</p>
                                            </div>
                                            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#C8C2B8' }}>
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

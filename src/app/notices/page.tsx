import Link from 'next/link'
import { createPublicClient } from '@/lib/supabase/public'

export const revalidate = 60 // 1분 캐시

export const metadata = {
    title: '공지사항 | 순천순동교회',
    description: '순천순동교회 공지사항 목록',
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
        <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 py-10">

            {/* Pinned Notices */}
            {pinned.length > 0 && (
                <section className="mb-8">
                    <h2 className="text-sm font-bold text-red-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <span>📌</span> 중요 공지
                    </h2>
                    <div className="space-y-2">
                        {pinned.map((n) => (
                            <Link
                                key={n.id}
                                href={`/notices/${n.id}`}
                                className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl px-5 py-4 hover:bg-red-100/70 hover:shadow-sm transition-all group"
                            >
                                <span className="flex-shrink-0 bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">중요</span>
                                <span className="flex-1 font-semibold text-gray-800 group-hover:text-red-700 truncate">{n.title}</span>
                                <span className="text-xs text-gray-400 flex-shrink-0">
                                    {new Date(n.created_at).toLocaleDateString('ko-KR')}
                                </span>
                                <svg className="w-4 h-4 text-gray-400 group-hover:text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* Regular Notices */}
            <section>
                {pinned.length > 0 && (
                    <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">일반 공지</h2>
                )}

                {/* Table header */}
                <div className="hidden sm:grid grid-cols-[auto_1fr_auto_auto] gap-4 px-5 pb-2 text-xs font-semibold uppercase tracking-wider border-b" style={{ color: '#8B7355', borderColor: '#E8E4DE' }}>
                    <span>번호</span>
                    <span>제목</span>
                    <span>작성자</span>
                    <span>날짜</span>
                </div>

                {regular.length > 0 ? (
                    <div className="divide-y" style={{ borderColor: '#E8E4DE' }}>
                        {regular.map((n, idx) => (
                            <Link
                                key={n.id}
                                href={`/notices/${n.id}`}
                                className="group flex flex-col sm:grid sm:grid-cols-[auto_1fr_auto_auto] gap-1 sm:gap-4 px-5 py-4 transition-colors hover:bg-[#B8860B0D]"
                            >
                                <span className="text-sm hidden sm:block" style={{ color: '#8B7355' }}>{regular.length - idx}</span>
                                <span className="font-medium truncate" style={{ color: '#2D2A26' }}>{n.title}</span>
                                <span className="text-sm" style={{ color: '#8B7355' }}>{n.author_name}</span>
                                <span className="text-sm" style={{ color: '#8B7355' }}>{new Date(n.created_at).toLocaleDateString('ko-KR')}</span>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <p className="text-4xl mb-3">📋</p>
                        <p className="text-gray-500">등록된 공지사항이 없습니다.</p>
                    </div>
                )}
            </section>
        </div>
        </div>
    )
}

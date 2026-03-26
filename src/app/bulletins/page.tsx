import Link from 'next/link'
import { createPublicClient } from '@/lib/supabase/public'

interface Bulletin {
    id: string
    title: string
    bulletin_date: string
    file_url: string
    created_at: string
}

export const revalidate = 300 // 5분 캐시 — 주보는 주 1회 업로드

async function getBulletins(): Promise<Bulletin[]> {
    const supabase = createPublicClient()
    const { data } = await supabase
        .from('bulletins')
        .select('id, title, bulletin_date, file_url, created_at')
        .order('bulletin_date', { ascending: false })
    return data ?? []
}

function formatDate(dateStr: string) {
    const d = new Date(dateStr)
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`
}

export default async function BulletinsPage() {
    const bulletins = await getBulletins()
    const latest = bulletins[0]
    const previous = bulletins.slice(1)

    return (
        <div className="min-h-screen" style={{ background: '#FAF8F5' }}>
            {/* 헤더 */}
            <div className="bg-white border-b" style={{ borderColor: '#E8E4DE' }}>
                <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
                    <span className="font-semibold text-sm uppercase tracking-wider" style={{ color: '#B8860B' }}>Bulletin</span>
                    <h1 className="text-3xl md:text-4xl font-bold mt-2" style={{ color: '#2D2A26', fontFamily: 'var(--font-serif)' }}>주간예배일정 (주보)</h1>
                    <p className="mt-2" style={{ color: '#8B7355' }}>매주 주보를 확인하세요.</p>
                </div>
            </div>

            <div className="max-w-[1300px] mx-auto px-4 py-8 space-y-8">
                {bulletins.length === 0 ? (
                    <div className="text-center py-24 text-gray-400">
                        <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="font-medium">등록된 주보가 없습니다.</p>
                    </div>
                ) : (
                    <>
                        {/* 최신 주보 */}
                        <div>
                            <h2 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: '#B8860B' }}>이번 주 주보</h2>
                            <Link href={`/bulletins/${latest.id}`}
                                className="block bg-white rounded-2xl shadow-sm border hover:shadow-md transition-all p-6 group"
                                style={{ borderColor: '#B8860B33' }}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-3" style={{ background: '#B8860B1A', color: '#B8860B' }}>최신</span>
                                        <h3 className="text-xl font-bold transition-colors" style={{ color: '#2D2A26' }}>{latest.title}</h3>
                                        <p className="text-sm mt-1" style={{ color: '#8B7355' }}>{formatDate(latest.bulletin_date)}</p>
                                    </div>
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors" style={{ background: '#B8860B1A' }}>
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#B8860B' }}>
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                </div>
                            </Link>
                        </div>

                        {/* 이전 주보 목록 */}
                        {previous.length > 0 && (
                            <div>
                                <h2 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: '#8B7355' }}>이전 주보</h2>
                                <div className="bg-white rounded-2xl shadow-sm border divide-y" style={{ borderColor: '#E8E4DE', borderBottomColor: '#F2EFE9' }}>
                                    {previous.map(bulletin => (
                                        <Link key={bulletin.id} href={`/bulletins/${bulletin.id}`}
                                            className="flex items-center justify-between px-6 py-4 transition-colors group hover:bg-[#B8860B08]">
                                            <div>
                                                <p className="font-semibold transition-colors" style={{ color: '#2D2A26' }}>{bulletin.title}</p>
                                                <p className="text-sm mt-0.5" style={{ color: '#8B7355' }}>{formatDate(bulletin.bulletin_date)}</p>
                                            </div>
                                            <svg className="w-4 h-4 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#C8C2B8' }}>
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

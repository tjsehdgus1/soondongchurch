import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

interface Bulletin {
    id: string
    title: string
    bulletin_date: string
    file_url: string
    created_at: string
}

async function getBulletins(): Promise<Bulletin[]> {
    const supabase = await createClient()
    const { data } = await supabase
        .from('bulletins')
        .select('*')
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
        <div className="min-h-screen bg-gray-50">
            {/* 헤더 */}
            <div className="bg-white border-b border-gray-100">
                <div className="max-w-4xl mx-auto px-4 py-10">
                    <h1 className="text-3xl font-extrabold text-gray-900">주간예배일정 (주보)</h1>
                    <p className="text-gray-500 mt-2 text-sm">매주 주보를 확인하세요</p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
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
                            <h2 className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-3">이번 주 주보</h2>
                            <Link href={`/bulletins/${latest.id}`}
                                className="block bg-white rounded-2xl shadow-sm border border-blue-100 hover:border-blue-300 hover:shadow-md transition-all p-6 group">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="inline-block bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full mb-3">최신</span>
                                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{latest.title}</h3>
                                        <p className="text-gray-500 text-sm mt-1">{formatDate(latest.bulletin_date)}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                                        <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                </div>
                            </Link>
                        </div>

                        {/* 이전 주보 목록 */}
                        {previous.length > 0 && (
                            <div>
                                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">이전 주보</h2>
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
                                    {previous.map(bulletin => (
                                        <Link key={bulletin.id} href={`/bulletins/${bulletin.id}`}
                                            className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors group">
                                            <div>
                                                <p className="font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">{bulletin.title}</p>
                                                <p className="text-gray-400 text-sm mt-0.5">{formatDate(bulletin.bulletin_date)}</p>
                                            </div>
                                            <svg className="w-4 h-4 text-gray-300 group-hover:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

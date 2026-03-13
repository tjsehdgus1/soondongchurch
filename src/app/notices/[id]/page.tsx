import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()
    const { data } = await supabase.from('notices').select('title').eq('id', id).single()
    return { title: data ? `${data.title} | 순천순동교회` : '공지사항 | 순천순동교회' }
}

export default async function NoticeDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    const { data: notice } = await supabase
        .from('notices')
        .select('*')
        .eq('id', id)
        .single()

    if (!notice) notFound()

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Back */}
            <Link href="/notices"
                className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 mb-8 transition-colors group">
                <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                공지사항 목록
            </Link>

            {/* Article */}
            <article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="px-8 py-7 border-b border-gray-100">
                    {notice.is_pinned && (
                        <span className="inline-flex items-center gap-1 bg-red-100 text-red-600 text-xs font-bold px-2.5 py-1 rounded-full mb-3">
                            📌 중요 공지
                        </span>
                    )}
                    <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-snug">{notice.title}</h1>
                    <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1.5">
                            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            {notice.author_name || '관리자'}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {new Date(notice.created_at).toLocaleDateString('ko-KR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                            })}
                        </span>
                        {notice.updated_at !== notice.created_at && (
                            <span className="text-gray-400 text-xs">
                                (수정: {new Date(notice.updated_at).toLocaleDateString('ko-KR')})
                            </span>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="px-8 py-8">
                    <div className="prose prose-gray max-w-none text-gray-700 leading-loose whitespace-pre-wrap">
                        {notice.content}
                    </div>
                </div>
            </article>

            {/* Bottom nav */}
            <div className="mt-8 flex justify-between">
                <Link href="/notices"
                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:text-blue-600 transition-colors">
                    ← 목록으로
                </Link>
            </div>
        </div>
    )
}

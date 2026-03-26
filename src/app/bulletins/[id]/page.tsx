import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import PdfViewerClient from './PdfViewerClient'

async function getBulletin(id: string) {
    const supabase = await createClient()
    const { data } = await supabase.from('bulletins').select('*').eq('id', id).single()
    return data
}

function formatDate(dateStr: string) {
    const d = new Date(dateStr)
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`
}

export default async function BulletinViewerPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const bulletin = await getBulletin(id)
    if (!bulletin) notFound()

    return (
        <div className="min-h-screen" style={{ background: '#FAF8F5' }}>
            {/* 헤더 */}
            <div className="bg-white border-b" style={{ borderColor: '#E8E4DE' }}>
                <div className="max-w-[1300px] mx-auto px-4 py-5">
                    <Link href="/bulletins" className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors mb-3" style={{ color: '#B8860B' }}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        주보 목록
                    </Link>
                    <h1 className="text-2xl font-extrabold" style={{ color: '#2D2A26', fontFamily: 'var(--font-serif)' }}>{bulletin.title}</h1>
                    <p className="text-sm mt-1" style={{ color: '#8B7355' }}>{formatDate(bulletin.bulletin_date)}</p>
                </div>
            </div>

            {/* PDF 뷰어 */}
            <div className="max-w-[1300px] mx-auto px-4 py-6">
                <PdfViewerClient fileUrl={bulletin.file_url} />
            </div>
        </div>
    )
}

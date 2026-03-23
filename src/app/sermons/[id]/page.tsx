import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function SermonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: sermon } = await supabase
    .from('sermons')
    .select('*')
    .eq('id', id)
    .eq('status', 'published')
    .single()

  if (!sermon) notFound()

  const formattedDate = new Date(sermon.sermon_date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })

  return (
    <div className="min-h-screen bg-white">
      {/* 모바일 상단 뒤로가기 */}
      <div className="sticky top-16 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-100 px-4 py-3 md:hidden">
        <Link href="/sermons" className="inline-flex items-center gap-1.5 text-sm text-gray-600 font-medium">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          설교 목록
        </Link>
      </div>

      <div className="max-w-[860px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-14">
        {/* 데스크톱 뒤로가기 */}
        <Link
          href="/sermons"
          className="hidden md:inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 font-medium mb-8 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          설교 목록으로
        </Link>

        {/* 메타 정보 */}
        <div className="mb-5">
          <p className="text-blue-600 text-sm font-semibold mb-2">{formattedDate}</p>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight">
            {sermon.title}
          </h1>
          <p className="text-gray-400 text-sm mt-2">김광선 목사 · 순천순동교회</p>
        </div>

        {/* 유튜브 영상 임베드 */}
        <div className="rounded-2xl overflow-hidden shadow-lg mb-8 bg-black">
          <div className="aspect-video w-full">
            <iframe
              src={`https://www.youtube.com/embed/${sermon.youtube_id}?rel=0`}
              title={sermon.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        </div>

        {/* 핵심 요약 */}
        {sermon.summary && (
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 md:p-8 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="font-bold text-blue-900 text-base">이 설교의 핵심</h2>
            </div>
            <p className="text-blue-800 leading-relaxed text-[15px] whitespace-pre-wrap">
              {sermon.summary}
            </p>
          </div>
        )}

        {/* 하단 액션 */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <a
            href={`https://www.youtube.com/watch?v=${sermon.youtube_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors shadow-sm"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55a3.016 3.016 0 0 0-2.122 2.136C0 8.086 0 12 0 12s0 3.914.501 5.814a3.016 3.016 0 0 0 2.122 2.136c1.872.55 9.377.55 9.377.55s7.505 0 9.377-.55a3.016 3.016 0 0 0 2.122-2.136C24 15.914 24 12 24 12s0-3.914-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
            유튜브에서 보기
          </a>
          <Link
            href="/sermons"
            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
          >
            다른 설교 보기
          </Link>
        </div>
      </div>
    </div>
  )
}

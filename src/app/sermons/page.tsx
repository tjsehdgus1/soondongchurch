import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const metadata = {
  title: '목사님 설교 | 순천순동교회',
  description: '순천순동교회 목사님의 설교를 확인하세요.',
}

export default async function SermonsPage() {
  const supabase = await createClient()

  const { data: sermons } = await supabase
    .from('sermons')
    .select('id, title, sermon_date, summary, thumbnail_url, youtube_id')
    .eq('status', 'published')
    .order('sermon_date', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <span className="text-blue-600 font-semibold text-sm uppercase tracking-wider">Sermons</span>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">목사님 설교</h1>
          <p className="text-gray-500 mt-2">목사님의 말씀을 영상과 요약으로 만나보세요.</p>
        </div>
      </div>

      {/* 설교 목록 */}
      <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!sermons || sermons.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <p className="text-xl font-medium">등록된 설교가 없습니다.</p>
            <p className="text-sm mt-2">곧 업로드될 예정입니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sermons.map((s) => (
              <Link
                key={s.id}
                href={`/sermons/${s.id}`}
                className="group bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200"
              >
                {/* 썸네일 */}
                <div className="relative aspect-video overflow-hidden bg-gray-100">
                  <img
                    src={s.thumbnail_url ?? ''}
                    alt={s.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* 플레이 버튼 오버레이 */}
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-white/90 shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-200">
                      <svg className="w-6 h-6 text-blue-600 translate-x-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* 텍스트 */}
                <div className="p-5">
                  <p className="text-xs font-semibold text-blue-600 mb-2">
                    {new Date(s.sermon_date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                  <h2 className="font-bold text-gray-900 line-clamp-2 leading-snug group-hover:text-blue-700 transition-colors mb-3 text-[15px]">
                    {s.title}
                  </h2>
                  {s.summary && (
                    <p className="text-gray-500 text-xs leading-relaxed line-clamp-3">
                      {s.summary}
                    </p>
                  )}
                  <div className="mt-4 flex items-center text-blue-600 text-xs font-semibold gap-1 group-hover:gap-2 transition-all">
                    말씀 보기
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

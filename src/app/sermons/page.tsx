import Link from 'next/link'
import { createPublicClient } from '@/lib/supabase/public'

export const revalidate = 300 // 5분 캐시 — 설교는 자주 바뀌지 않음

export const metadata = {
  title: '목사님 설교 | 순천순동교회',
  description: '순천순동교회 목사님의 설교를 확인하세요.',
}

export default async function SermonsPage() {
  const supabase = createPublicClient()

  const { data: sermons } = await supabase
    .from('sermons')
    .select('id, title, sermon_date, summary, thumbnail_url, youtube_id')
    .eq('status', 'published')
    .order('sermon_date', { ascending: false })

  return (
    <div className="min-h-screen" style={{ background: '#FAF8F5' }}>
      {/* 헤더 */}
      <div className="bg-white border-b" style={{ borderColor: '#E8E4DE' }}>
        <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <span className="font-semibold text-sm uppercase tracking-wider" style={{ color: '#B8860B' }}>Sermons</span>
          <h1 className="text-3xl md:text-4xl font-bold mt-2" style={{ color: '#2D2A26', fontFamily: 'var(--font-serif)' }}>설교영상</h1>
          <p className="mt-2" style={{ color: '#8B7355' }}>목사님의 말씀을 영상과 요약으로 만나보세요.</p>
        </div>
      </div>

      {/* 설교 목록 */}
      <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
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
                className="group bg-white rounded-2xl overflow-hidden border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200"
                style={{ borderColor: '#E8E4DE' }}
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
                      <svg className="w-6 h-6 translate-x-0.5" fill="currentColor" viewBox="0 0 24 24" style={{ color: '#B8860B' }}>
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* 텍스트 */}
                <div className="p-5">
                  <p className="text-xs font-semibold mb-2" style={{ color: '#B8860B' }}>
                    {new Date(s.sermon_date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                  <h2 className="font-bold line-clamp-2 leading-snug transition-colors mb-3 text-[15px]" style={{ color: '#2D2A26' }}>
                    {s.title}
                  </h2>
                  {s.summary && (
                    <p className="text-xs leading-relaxed line-clamp-3" style={{ color: '#8B7355' }}>
                      {s.summary}
                    </p>
                  )}
                  <div className="mt-4 flex items-center text-xs font-semibold gap-1 group-hover:gap-2 transition-all" style={{ color: '#B8860B' }}>
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

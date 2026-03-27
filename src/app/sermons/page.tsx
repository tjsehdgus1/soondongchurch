import Link from 'next/link'
import { createPublicClient } from '@/lib/supabase/public'
import SermonFilters from '@/components/SermonFilters'

export const revalidate = 300 // 5분 캐시 — 설교는 자주 바뀌지 않음

export const metadata = {
  title: '목사님 설교 | 순천순동교회',
  description: '순천순동교회 목사님의 설교를 확인하세요.',
}

const PAGE_SIZE = 12

export default async function SermonsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tag?: string; page?: string }>
}) {
  const supabase = createPublicClient()
  const { q: rawQ = '', tag: rawTag = '', page: rawPage = '1' } = await searchParams
  const q = rawQ
  const tag = rawTag
  const page = parseInt(rawPage, 10)

  // 전체 태그 목록 조회
  const { data: tagRows } = await supabase
    .from('sermons')
    .select('tags')
    .eq('status', 'published')
  const allTags = [...new Set(tagRows?.flatMap((r) => r.tags ?? []) ?? [])]

  // 필터링된 설교 목록 조회
  let query = supabase
    .from('sermons')
    .select('id, title, sermon_date, summary, thumbnail_url, youtube_id, tags')
    .eq('status', 'published')

  // 태그 필터
  if (tag) {
    query = query.contains('tags', [tag])
  }

  // 텍스트 검색
  if (q) {
    query = query.or(`title.ilike.%${q}%,summary.ilike.%${q}%`)
  }

  // 총 개수 조회
  const { data: countData, count } = await query

  // 페이지네이션
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const { data: sermons } = await query
    .order('sermon_date', { ascending: false })
    .range(from, to)

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

      {/* 필터 및 검색 */}
      <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SermonFilters allTags={allTags} currentQ={q} currentTag={tag} />
      </div>

      {/* 결과 영역 */}
      <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        {!sermons || sermons.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <p className="text-xl font-medium">검색 결과가 없습니다.</p>
            <p className="text-sm mt-2">다른 검색어나 태그를 시도해보세요.</p>
          </div>
        ) : (
          <>
            {/* 설교 목록 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
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
                    {s.tags && s.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {s.tags.slice(0, 2).map((t) => (
                          <span key={t} className="inline-block text-[10px] px-1.5 py-0.5 rounded-full border" style={{ background: '#B8860B08', color: '#B8860B', borderColor: '#B8860B33' }}>
                            {t}
                          </span>
                        ))}
                        {s.tags.length > 2 && (
                          <span className="text-[10px] px-1.5 py-0.5" style={{ color: '#B8860B' }}>
                            +{s.tags.length - 2}
                          </span>
                        )}
                      </div>
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

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                {page > 1 && (
                  <Link
                    href={`?${new URLSearchParams({ ...(q && { q }), ...(tag && { tag }), page: String(page - 1) }).toString()}`}
                    className="px-4 py-2 rounded-lg border transition-colors"
                    style={{ borderColor: '#E8E4DE', color: '#B8860B' }}
                  >
                    ← 이전
                  </Link>
                )}

                {Array.from({ length: totalPages }, (_, i) => {
                  const pageNum = i + 1
                  const isActive = pageNum === page
                  return (
                    <Link
                      key={pageNum}
                      href={`?${new URLSearchParams({ ...(q && { q }), ...(tag && { tag }), page: String(pageNum) }).toString()}`}
                      className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                        isActive
                          ? 'bg-amber-100 text-amber-700 border border-amber-300'
                          : 'border hover:bg-gray-50'
                      }`}
                      style={isActive ? {} : { borderColor: '#E8E4DE', color: '#8B7355' }}
                    >
                      {pageNum}
                    </Link>
                  )
                })}

                {page < totalPages && (
                  <Link
                    href={`?${new URLSearchParams({ ...(q && { q }), ...(tag && { tag }), page: String(page + 1) }).toString()}`}
                    className="px-4 py-2 rounded-lg border transition-colors"
                    style={{ borderColor: '#E8E4DE', color: '#B8860B' }}
                  >
                    다음 →
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

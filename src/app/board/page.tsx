import { createClient } from '@/lib/supabase/server'
import BoardPostList from '@/components/BoardPostList'
import Pagination from '@/components/Pagination'
import { type BoardPostSummary, PAGE_SIZE, POST_SUMMARY_COLUMNS } from '@/lib/boards'

export const metadata = {
    title: '전체글 | 순천순동교회',
    description: '순천순동교회 게시판 전체 최신글',
}

export default async function AllPostsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
    const { page: pageParam } = await searchParams
    const page = Math.max(1, Number(pageParam) || 1)
    const supabase = await createClient()

    const from = (page - 1) * PAGE_SIZE
    const [{ data: posts, count }, { data: boards }] = await Promise.all([
        supabase
            .from('board_posts')
            .select(POST_SUMMARY_COLUMNS, { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, from + PAGE_SIZE - 1),
        supabase.from('boards').select('id, slug, name'),
    ])

    const boardById = new Map((boards ?? []).map((b) => [b.id, b]))
    const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

    return (
        <div className="min-h-screen" style={{ background: '#FAF8F5' }}>
            <div className="bg-white border-b" style={{ borderColor: '#E8E4DE' }}>
                <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
                    <span className="font-semibold text-sm uppercase tracking-wider" style={{ color: '#B8860B' }}>Board</span>
                    <h1 className="text-3xl md:text-4xl font-bold mt-2" style={{ color: '#2D2A26', fontFamily: 'var(--font-serif)' }}>전체글</h1>
                    <p className="mt-2" style={{ color: '#8B7355' }}>모든 게시판의 최신 글을 모아 봅니다.</p>
                </div>
            </div>

            <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <BoardPostList
                    posts={(posts ?? []) as BoardPostSummary[]}
                    kind="list"
                    slugOf={(p) => boardById.get(p.board_id)?.slug ?? ''}
                    boardNameOf={(p) => boardById.get(p.board_id)?.name ?? ''}
                />
                <Pagination page={page} totalPages={totalPages} hrefOf={(p) => (p > 1 ? `/board?page=${p}` : '/board')} />
            </div>
        </div>
    )
}

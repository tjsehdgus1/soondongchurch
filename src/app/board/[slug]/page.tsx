import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BoardPostList from '@/components/BoardPostList'
import Pagination from '@/components/Pagination'
import { type Board, type BoardPostSummary, PAGE_SIZE, POST_SUMMARY_COLUMNS } from '@/lib/boards'

type Params = { params: Promise<{ slug: string }>, searchParams: Promise<{ page?: string, category?: string }> }

export async function generateMetadata({ params }: Params) {
    const { slug } = await params
    const supabase = await createClient()
    const { data } = await supabase.from('boards').select('name').eq('slug', slug).maybeSingle()
    return { title: data ? `${data.name} | 순천순동교회` : '게시판 | 순천순동교회' }
}

export default async function BoardPage({ params, searchParams }: Params) {
    const { slug } = await params
    const { page: pageParam, category } = await searchParams
    const page = Math.max(1, Number(pageParam) || 1)
    const supabase = await createClient()

    const { data: board } = await supabase.from('boards').select('*').eq('slug', slug).maybeSingle<Board>()
    if (!board) notFound()

    let query = supabase
        .from('board_posts')
        .select(POST_SUMMARY_COLUMNS, { count: 'exact' })
        .eq('board_id', board.id)
    if (category && board.categories.includes(category)) query = query.eq('category', category)

    const from = (page - 1) * PAGE_SIZE
    const [{ data: posts, count }, { data: canWrite }] = await Promise.all([
        query
            .order('is_pinned', { ascending: false })
            .order('created_at', { ascending: false })
            .range(from, from + PAGE_SIZE - 1),
        supabase.rpc('can_write_board', { bid: board.id }),
    ])

    const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)
    const hrefOf = (p: number, c = category) => {
        const qs = new URLSearchParams()
        if (c) qs.set('category', c)
        if (p > 1) qs.set('page', String(p))
        const s = qs.toString()
        return `/board/${slug}${s ? `?${s}` : ''}`
    }

    return (
        <div className="min-h-screen" style={{ background: '#FAF8F5' }}>
            <div className="bg-white border-b" style={{ borderColor: '#E8E4DE' }}>
                <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <span className="font-semibold text-sm tracking-wider" style={{ color: '#B8860B' }}>{board.section}</span>
                        <h1 className="text-3xl md:text-4xl font-bold mt-2" style={{ color: '#2D2A26', fontFamily: 'var(--font-serif)' }}>{board.name}</h1>
                    </div>
                    {canWrite && (
                        <Link
                            href={`/board/${slug}/new`}
                            className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl shadow-sm"
                            style={{ background: '#B8860B' }}
                        >
                            글쓰기
                        </Link>
                    )}
                </div>
            </div>

            <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {board.categories.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                        {[undefined, ...board.categories].map((c) => {
                            const active = c === category || (!c && !category)
                            return (
                                <Link
                                    key={c ?? 'all'}
                                    href={hrefOf(1, c)}
                                    className="px-4 py-1.5 rounded-full text-sm font-medium border transition-colors"
                                    style={active
                                        ? { background: '#B8860B', color: '#fff', borderColor: '#B8860B' }
                                        : { background: '#fff', color: '#5C5650', borderColor: '#E8E4DE' }}
                                >
                                    {c ?? '전체'}
                                </Link>
                            )
                        })}
                    </div>
                )}

                <BoardPostList
                    posts={(posts ?? []) as BoardPostSummary[]}
                    kind={board.kind}
                    slugOf={() => slug}
                />
                <Pagination page={page} totalPages={totalPages} hrefOf={(p) => hrefOf(p)} />
            </div>
        </div>
    )
}

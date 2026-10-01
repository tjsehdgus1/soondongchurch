import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { HUBS, type HubKey } from '@/lib/hubs'
import { type Board, type BoardPostSummary, formatDate, PAGE_SIZE, POST_SUMMARY_COLUMNS } from '@/lib/boards'
import HubTabs from '@/components/hub/HubTabs'
import BoardPostList from '@/components/BoardPostList'
import Pagination from '@/components/Pagination'
import VideoCard from '@/components/video/VideoCard'
import Reveal from '@/components/motion/Reveal'

interface HubSectionProps {
    hub: HubKey
    tab?: string
    page?: string
}

// 허브의 탭(게시판) + 글 목록 — 영상 허브는 영상 카드(모달 재생), 그 외는 게시판 형태
export default async function HubSection({ hub, tab, page: pageParam }: HubSectionProps) {
    const supabase = await createClient()
    const { path, title, kind } = HUBS[hub]

    const { data: boards } = await supabase
        .from('boards')
        .select('*')
        .eq('hub', hub)
        .order('tab_order')
    const tabs = (boards ?? []) as Board[]
    if (tabs.length === 0) return null

    const board = tabs.find((b) => b.slug === tab) ?? tabs[0]
    const page = Math.max(1, Number(pageParam) || 1)
    const from = (page - 1) * PAGE_SIZE

    const [{ data: posts, count }, { data: canWrite }] = await Promise.all([
        supabase
            .from('board_posts')
            .select(POST_SUMMARY_COLUMNS, { count: 'exact' })
            .eq('board_id', board.id)
            .order('is_pinned', { ascending: false })
            .order('created_at', { ascending: false })
            .range(from, from + PAGE_SIZE - 1),
        supabase.rpc('can_write_board', { bid: board.id }),
    ])
    const list = (posts ?? []) as BoardPostSummary[]
    const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)
    const tabHref = (slug: string, p = 1) => `${path}?tab=${slug}${p > 1 ? `&page=${p}` : ''}`

    return (
        <section className="py-8 lg:py-12 bg-[#FAF8F5]">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                    <HubTabs
                        label={`${title} 게시판`}
                        active={board.slug}
                        tabs={tabs.map((b) => ({ slug: b.slug, label: b.name, href: tabHref(b.slug) }))}
                    />
                    {canWrite && (
                        <Link href={`/board/${board.slug}/new`} className="px-5 py-2.5 rounded-full bg-[#2D2A26] text-white text-sm font-semibold hover:bg-black transition-colors">
                            글쓰기
                        </Link>
                    )}
                </div>

                <div id="hub-panel" role="tabpanel" aria-label={board.name}>
                    {list.length === 0 ? (
                        <p className="py-10 text-center text-[#8B7355] border-y border-[#E8E4DE]">아직 올라온 {board.name} 소식이 없습니다.</p>
                    ) : kind === 'video' ? (
                        // key로 탭이 바뀔 때마다 등장 애니메이션 재생
                        <Reveal key={`${board.slug}-${page}`} stagger className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12">
                            {list.map((post, i) => post.youtube_id ? (
                                <VideoCard key={post.id} priority={i < 3} youtubeId={post.youtube_id} title={post.title}
                                    href={`/board/${board.slug}/${post.id}`} meta={formatDate(post.created_at)} />
                            ) : (
                                <Link key={post.id} href={`/board/${board.slug}/${post.id}`} className="block rounded-2xl bg-white border border-[#E8E4DE] p-6 hover:border-[#B8860B]">
                                    <p className="text-xs text-[#B8860B] mb-2">{formatDate(post.created_at)}</p>
                                    <p className="font-bold text-[#2D2A26]">{post.title}</p>
                                </Link>
                            ))}
                        </Reveal>
                    ) : (
                        <Reveal key={`${board.slug}-${page}`}>
                            <BoardPostList posts={list} kind={board.kind} slugOf={() => board.slug} />
                        </Reveal>
                    )}
                    <Pagination page={page} totalPages={totalPages} hrefOf={(p) => tabHref(board.slug, p)} />
                </div>
            </div>
        </section>
    )
}

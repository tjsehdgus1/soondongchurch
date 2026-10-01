import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DeleteBoardPostButton from '@/components/DeleteBoardPostButton'
import { type Board, formatDate, sanitizePostHtml } from '@/lib/boards'

type Params = { params: Promise<{ slug: string, id: string }> }

export async function generateMetadata({ params }: Params) {
    const { id } = await params
    const supabase = await createClient()
    const { data } = await supabase.from('board_posts').select('title').eq('id', id).maybeSingle()
    return { title: data ? `${data.title} | 순천순동교회` : '게시글 | 순천순동교회' }
}

export default async function BoardPostPage({ params }: Params) {
    const { slug, id } = await params
    const supabase = await createClient()

    const [{ data: board }, { data: post }, { data: { user } }] = await Promise.all([
        supabase.from('boards').select('*').eq('slug', slug).maybeSingle<Board>(),
        supabase.from('board_posts').select('*').eq('id', id).maybeSingle(),
        supabase.auth.getUser(),
    ])
    if (!board) notFound()

    // 회원 전용 글은 비로그인 시 RLS로 조회되지 않음
    if (!post || post.board_id !== board.id) {
        if (user) notFound()
        return (
            <div className="min-h-screen" style={{ background: '#FAF8F5' }}>
                <div className="max-w-[860px] mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
                    <p className="mb-4" style={{ color: '#8B7355' }}>게시글이 없거나 회원만 볼 수 있는 글입니다.</p>
                    <Link href="/auth/login" className="inline-block px-6 py-2.5 text-white text-sm font-semibold rounded-xl" style={{ background: '#B8860B' }}>
                        로그인
                    </Link>
                </div>
            </div>
        )
    }

    let canManage = !!user && post.author_id === user.id
    if (user && !canManage) {
        const { data: isAdmin } = await supabase.rpc('is_admin')
        canManage = !!isAdmin
    }

    return (
        <div className="min-h-screen" style={{ background: '#FAF8F5' }}>
            <div className="max-w-[960px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <Link href={`/board/${slug}`} className="inline-flex items-center gap-1.5 text-sm mb-8 group" style={{ color: '#8B7355' }}>
                    <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    {board.name} 목록
                </Link>

                <article className="bg-white rounded-2xl shadow-sm border overflow-hidden" style={{ borderColor: '#E8E4DE' }}>
                    <div className="px-6 sm:px-8 py-7 border-b" style={{ borderColor: '#E8E4DE' }}>
                        <div className="flex flex-wrap gap-1.5 mb-3">
                            {post.is_pinned && <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: '#B8860B1A', color: '#B8860B' }}>📌 고정</span>}
                            {post.members_only && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">🔒 회원 전용</span>}
                            {post.category && <span className="text-xs font-semibold px-2.5 py-1 rounded-full border" style={{ borderColor: '#E8E4DE', color: '#8B7355' }}>{post.category}</span>}
                        </div>
                        <h1 className="text-2xl md:text-3xl font-extrabold leading-snug" style={{ color: '#2D2A26', fontFamily: 'var(--font-serif)' }}>{post.title}</h1>
                        <p className="mt-4 text-sm" style={{ color: '#8B7355' }}>
                            {post.author_name || '관리자'} · {formatDate(post.created_at)}
                        </p>
                    </div>

                    <div className="px-6 sm:px-8 py-8">
                        {post.youtube_id && (
                            <div className="aspect-video mb-8 rounded-xl overflow-hidden bg-black">
                                <iframe
                                    src={`https://www.youtube.com/embed/${post.youtube_id}`}
                                    title={post.title}
                                    className="w-full h-full"
                                    allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    allowFullScreen
                                />
                            </div>
                        )}
                        <div
                            className="prose prose-lg max-w-none overflow-x-auto"
                            style={{ color: '#5C5650' }}
                            dangerouslySetInnerHTML={{ __html: sanitizePostHtml(post.content) }}
                        />
                    </div>
                </article>

                <div className="mt-8 flex justify-between gap-3">
                    <Link href={`/board/${slug}`}
                        className="px-5 py-2.5 text-sm font-medium bg-white border rounded-xl"
                        style={{ color: '#5C5650', borderColor: '#E8E4DE' }}
                    >
                        ← 목록으로
                    </Link>
                    {canManage && (
                        <div className="flex gap-2">
                            <Link href={`/board/${slug}/${post.id}/edit`}
                                className="px-5 py-2.5 text-sm font-medium bg-white border rounded-xl"
                                style={{ color: '#5C5650', borderColor: '#E8E4DE' }}
                            >
                                수정
                            </Link>
                            <DeleteBoardPostButton postId={post.id} redirectTo={`/board/${slug}`} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

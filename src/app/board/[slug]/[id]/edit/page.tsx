import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BoardPostForm from '@/components/BoardPostForm'
import type { Board } from '@/lib/boards'

export const metadata = { title: '글 수정 | 순천순동교회' }

export default async function EditBoardPostPage({ params }: { params: Promise<{ slug: string, id: string }> }) {
    const { slug, id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login')

    const [{ data: board }, { data: post }, { data: isAdmin }] = await Promise.all([
        supabase.from('boards').select('*').eq('slug', slug).maybeSingle<Board>(),
        supabase.from('board_posts').select('*').eq('id', id).maybeSingle(),
        supabase.rpc('is_admin'),
    ])
    if (!board || !post || post.board_id !== board.id) notFound()

    const canEdit = post.author_id === user.id || !!isAdmin

    return (
        <div className="min-h-screen" style={{ background: '#FAF8F5' }}>
            <div className="bg-white border-b" style={{ borderColor: '#E8E4DE' }}>
                <div className="max-w-[960px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
                    <Link href={`/board/${slug}/${post.id}`} className="text-sm font-medium" style={{ color: '#B8860B' }}>← 게시글로 돌아가기</Link>
                    <h1 className="text-2xl font-bold mt-3" style={{ color: '#2D2A26', fontFamily: 'var(--font-serif)' }}>게시글 수정</h1>
                </div>
            </div>
            <div className="max-w-[960px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {canEdit ? (
                    <div className="bg-white rounded-2xl shadow-sm border p-6 sm:p-8" style={{ borderColor: '#E8E4DE' }}>
                        <BoardPostForm
                            board={board}
                            isAdmin={!!isAdmin}
                            initial={{
                                id: post.id,
                                title: post.title,
                                content: post.content,
                                category: post.category,
                                youtube_id: post.youtube_id,
                                is_pinned: post.is_pinned,
                                members_only: post.members_only,
                            }}
                        />
                    </div>
                ) : (
                    <p className="text-center py-24" style={{ color: '#8B7355' }}>이 게시글을 수정할 권한이 없습니다.</p>
                )}
            </div>
        </div>
    )
}

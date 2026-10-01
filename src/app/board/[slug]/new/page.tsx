import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BoardPostForm from '@/components/BoardPostForm'
import type { Board } from '@/lib/boards'

export const metadata = { title: '글쓰기 | 순천순동교회' }

export default async function NewBoardPostPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login')

    const { data: board } = await supabase.from('boards').select('*').eq('slug', slug).maybeSingle<Board>()
    if (!board) notFound()

    const [{ data: canWrite }, { data: isAdmin }] = await Promise.all([
        supabase.rpc('can_write_board', { bid: board.id }),
        supabase.rpc('is_admin'),
    ])

    return (
        <div className="min-h-screen" style={{ background: '#FAF8F5' }}>
            <div className="bg-white border-b" style={{ borderColor: '#E8E4DE' }}>
                <div className="max-w-[960px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
                    <Link href={`/board/${slug}`} className="text-sm font-medium" style={{ color: '#B8860B' }}>← {board.name}</Link>
                    <h1 className="text-2xl font-bold mt-3" style={{ color: '#2D2A26', fontFamily: 'var(--font-serif)' }}>새 게시글 작성</h1>
                </div>
            </div>
            <div className="max-w-[960px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {canWrite ? (
                    <div className="bg-white rounded-2xl shadow-sm border p-6 sm:p-8" style={{ borderColor: '#E8E4DE' }}>
                        <BoardPostForm board={board} isAdmin={!!isAdmin} />
                    </div>
                ) : (
                    <p className="text-center py-24" style={{ color: '#8B7355' }}>이 게시판에 글을 쓸 권한이 없습니다.</p>
                )}
            </div>
        </div>
    )
}

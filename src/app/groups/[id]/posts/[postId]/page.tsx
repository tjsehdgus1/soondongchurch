'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Post = {
  id: number
  title: string
  content: string
  author_id: string | null
  author_name: string
  created_at: string
  image_url: string | null
}

type Comment = {
  id: number
  content: string
  author_id: string | null
  author_name: string
  created_at: string
}

export default function PostDetailPage() {
  const { id, postId } = useParams<{ id: string; postId: string }>()
  const groupId = Number(id)
  const postIdNum = Number(postId)
  const router = useRouter()

  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [access, setAccess] = useState<'checking' | 'allowed' | 'denied' | 'notLoggedIn' | 'error'>('checking')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  const [commentText, setCommentText] = useState('')
  const [commentLoading, setCommentLoading] = useState(false)

  const fetchData = useCallback(async (supabase: ReturnType<typeof createClient>) => {
    const [{ data: postData }, { data: commentData }] = await Promise.all([
      supabase.from('group_posts').select('*').eq('id', postIdNum).single(),
      supabase.from('group_post_comments').select('*').eq('post_id', postIdNum).order('created_at', { ascending: true }),
    ])
    if (postData) setPost(postData as Post)
    if (commentData) setComments(commentData as Comment[])
  }, [postIdNum])

  useEffect(() => {
    const supabase = createClient()
    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setAccess('notLoggedIn'); setLoading(false); return }
        setCurrentUserId(user.id)

        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        const admin = profile?.role === 'admin'
        setIsAdmin(admin)

        if (!admin) {
          const { data: membership } = await supabase
            .from('group_members').select('id')
            .eq('group_id', groupId).eq('user_id', user.id).maybeSingle()
          if (!membership) { setAccess('denied'); setLoading(false); return }
        }

        setAccess('allowed')
        await fetchData(supabase)
      } catch (e) {
        console.error(e)
        setAccess('error')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [groupId, postIdNum, fetchData])

  const handleDeletePost = async () => {
    if (!confirm('이 게시글을 삭제하시겠습니까?')) return
    const supabase = createClient()
    const { error } = await supabase.from('group_posts').delete().eq('id', postIdNum)
    if (error) { alert('삭제 실패: ' + error.message); return }
    router.push(`/groups/${groupId}`)
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentText.trim()) return
    setCommentLoading(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { alert('로그인이 필요합니다.'); return }

      const { data: profile } = await supabase.from('profiles').select('name').eq('id', user.id).single()
      const authorName = (profile as any)?.name ?? '알 수 없음'

      const { error } = await supabase.from('group_post_comments').insert([{
        post_id: postIdNum,
        group_id: groupId,
        author_id: user.id,
        author_name: authorName,
        content: commentText.trim(),
      }])

      if (error) {
        alert('댓글 등록 실패: ' + error.message)
      } else {
        setCommentText('')
        await fetchData(supabase)
      }
    } catch (e: any) {
      alert('오류: ' + (e.message ?? e))
    } finally {
      setCommentLoading(false)
    }
  }

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('댓글을 삭제하시겠습니까?')) return
    const supabase = createClient()
    const { error } = await supabase.from('group_post_comments').delete().eq('id', commentId)
    if (error) { alert('삭제 실패: ' + error.message); return }
    await fetchData(supabase)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 pt-20 pb-16 flex items-center justify-center">
        <p className="text-gray-400">불러오는 중...</p>
      </main>
    )
  }

  if (access === 'notLoggedIn') {
    return (
      <main className="min-h-screen bg-gray-50 pt-20 pb-16">
        <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <p className="text-gray-500 mb-4">로그인 후 이용할 수 있습니다.</p>
          <Link href="/auth/login" className="inline-block px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
            로그인
          </Link>
        </div>
      </main>
    )
  }

  if (access === 'denied') {
    return (
      <main className="min-h-screen bg-gray-50 pt-20 pb-16">
        <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <p className="text-gray-500 mb-2">이 소그룹에 소속되어 있지 않습니다.</p>
          <Link href="/groups" className="inline-block mt-4 px-6 py-2.5 bg-gray-100 text-gray-700 text-sm rounded-lg">
            내 소그룹으로 돌아가기
          </Link>
        </div>
      </main>
    )
  }

  if (access === 'error' || !post) {
    return (
      <main className="min-h-screen bg-gray-50 pt-20 pb-16">
        <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <p className="text-red-500">게시글을 불러올 수 없습니다.</p>
          <Link href={`/groups/${groupId}`} className="inline-block mt-4 px-6 py-2.5 bg-gray-100 text-gray-700 text-sm rounded-lg">
            게시판으로 돌아가기
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 pt-20 pb-16">
      <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* 뒤로 가기 */}
        <div className="mb-5">
          <Link href={`/groups/${groupId}`} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            ← 게시판으로 돌아가기
          </Link>
        </div>

        {/* 게시글 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-5">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">{post.title}</h1>
          <div className="flex items-center gap-3 text-base text-gray-400 pb-5 border-b border-gray-100">
            <span>👤 {post.author_name}</span>
            <span>
              {new Date(post.created_at).toLocaleDateString('ko-KR', {
                year: 'numeric', month: 'long', day: 'numeric',
              })}
            </span>
            {(post.author_id === currentUserId || isAdmin) && (
              <div className="ml-auto flex items-center gap-1">
                {post.author_id === currentUserId && (
                  <Link
                    href={`/groups/${groupId}/posts/${postIdNum}/edit`}
                    className="text-xs text-indigo-400 hover:text-indigo-600 px-2 py-1 rounded hover:bg-indigo-50 transition-colors"
                  >
                    수정
                  </Link>
                )}
                <button
                  onClick={handleDeletePost}
                  className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                >
                  삭제
                </button>
              </div>
            )}
          </div>

          {post.image_url && (
            <div className="mt-5 mb-5">
              <img
                src={post.image_url}
                alt="첨부 이미지"
                className="max-w-full rounded-xl border border-gray-100"
              />
            </div>
          )}

          <div
            className="prose prose-lg max-w-none text-gray-700 mt-5"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>

        {/* 댓글 섹션 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-5">
            댓글{comments.length > 0 ? ` (${comments.length})` : ''}
          </h2>

          {/* 댓글 목록 */}
          {comments.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6 mb-2">아직 댓글이 없습니다.</p>
          ) : (
            <div className="space-y-5 mb-6">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-sm font-bold">
                    {comment.author_name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base font-semibold text-gray-800">{comment.author_name}</span>
                      <span className="text-sm text-gray-400">
                        {new Date(comment.created_at).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
                      </span>
                      {(comment.author_id === currentUserId || isAdmin) && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="ml-auto text-xs text-red-400 hover:text-red-600 px-1.5 py-0.5 rounded hover:bg-red-50 transition-colors"
                        >
                          삭제
                        </button>
                      )}
                    </div>
                    <p className="text-base text-gray-600 whitespace-pre-wrap leading-relaxed">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 댓글 작성 */}
          <form onSubmit={handleAddComment} className="flex gap-3 pt-4 border-t border-gray-100">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="댓글을 입력하세요..."
              rows={2}
              className="flex-1 px-3 py-2 text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 resize-none"
            />
            <button
              type="submit"
              disabled={commentLoading || !commentText.trim()}
              className="px-4 py-2 bg-indigo-600 text-white text-base font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors self-end"
            >
              {commentLoading ? '...' : '등록'}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}

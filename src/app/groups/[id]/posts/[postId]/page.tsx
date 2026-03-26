'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import DOMPurify from 'isomorphic-dompurify'

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
  const supabase = createClient()

  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [access, setAccess] = useState<'checking' | 'allowed' | 'denied' | 'notLoggedIn' | 'error'>('checking')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  const [commentText, setCommentText] = useState('')
  const [commentLoading, setCommentLoading] = useState(false)

  const fetchData = useCallback(async () => {
    const [{ data: postData }, { data: commentData }] = await Promise.all([
      supabase.from('group_posts').select('*').eq('id', postIdNum).single(),
      supabase.from('group_post_comments').select('*').eq('post_id', postIdNum).order('created_at', { ascending: true }),
    ])
    if (postData) setPost(postData as Post)
    if (commentData) setComments(commentData as Comment[])
  }, [postIdNum]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
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
        await fetchData()
      } catch (e) {
        console.error(e)
        setAccess('error')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [groupId, postIdNum, fetchData]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleDeletePost = async () => {
    if (!confirm('이 게시글을 삭제하시겠습니까?')) return
    const { error } = await supabase.from('group_posts').delete().eq('id', postIdNum)
    if (error) { alert('삭제 실패: ' + error.message); return }
    router.push(`/groups/${groupId}`)
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentText.trim()) return
    setCommentLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { alert('로그인이 필요합니다.'); return }

      const { data: profile } = await supabase.from('profiles').select('name').eq('id', user.id).single()
      const authorName = (profile as { name?: string })?.name ?? '알 수 없음'

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
        await fetchData()
      }
    } catch (e: unknown) {
      alert('오류: ' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setCommentLoading(false)
    }
  }

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('댓글을 삭제하시겠습니까?')) return
    const { error } = await supabase.from('group_post_comments').delete().eq('id', commentId)
    if (error) { alert('삭제 실패: ' + error.message); return }
    await fetchData()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#FAF8F5' }}>
        <p style={{ color: '#A09890' }}>불러오는 중...</p>
      </div>
    )
  }

  if (access === 'notLoggedIn') {
    return (
      <div className="min-h-screen" style={{ background: '#FAF8F5' }}>
        <div className="max-w-[860px] mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <p className="mb-4" style={{ color: '#8B7355' }}>로그인 후 이용할 수 있습니다.</p>
          <Link href="/auth/login" className="inline-block px-6 py-2.5 text-white text-sm font-semibold rounded-xl" style={{ background: '#B8860B' }}>
            로그인
          </Link>
        </div>
      </div>
    )
  }

  if (access === 'denied') {
    return (
      <div className="min-h-screen" style={{ background: '#FAF8F5' }}>
        <div className="max-w-[860px] mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <p className="mb-2" style={{ color: '#8B7355' }}>이 소그룹에 소속되어 있지 않습니다.</p>
          <Link href={`/groups/${groupId}`} className="inline-block mt-4 px-6 py-2.5 text-sm rounded-xl border" style={{ background: '#FAF8F5', color: '#5C5650', borderColor: '#E8E4DE' }}>
            내 소그룹으로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  if (access === 'error' || !post) {
    return (
      <div className="min-h-screen" style={{ background: '#FAF8F5' }}>
        <div className="max-w-[860px] mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <p className="text-red-500">게시글을 불러올 수 없습니다.</p>
          <Link href={`/groups/${groupId}`} className="inline-block mt-4 px-6 py-2.5 text-sm rounded-xl border" style={{ background: '#FAF8F5', color: '#5C5650', borderColor: '#E8E4DE' }}>
            게시판으로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#FAF8F5' }}>
      {/* 모바일 뒤로가기 */}
      <div className="sticky top-16 z-10 backdrop-blur-sm border-b px-4 py-3 md:hidden" style={{ background: 'rgba(250,248,245,0.9)', borderColor: '#E8E4DE' }}>
        <Link href={`/groups/${groupId}`} className="inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: '#5C5650' }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          게시판
        </Link>
      </div>

      <div className="max-w-[860px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* 데스크톱 뒤로가기 */}
        <Link href={`/groups/${groupId}`} className="hidden md:inline-flex items-center gap-1.5 text-sm font-medium mb-8 transition-colors" style={{ color: '#8B7355' }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          게시판으로
        </Link>

        {/* 게시글 */}
        <div className="bg-white rounded-2xl shadow-sm border p-8 mb-5" style={{ borderColor: '#E8E4DE' }}>
          <h1 className="text-2xl md:text-3xl font-extrabold leading-tight mb-3" style={{ color: '#2D2A26', fontFamily: 'var(--font-serif)' }}>{post.title}</h1>
          <div className="flex items-center gap-3 text-sm pb-5 border-b" style={{ color: '#A09890', borderColor: '#E8E4DE' }}>
            <span style={{ color: '#8B7355' }}>{post.author_name}</span>
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
                    className="text-xs px-2 py-1 rounded transition-colors"
                    style={{ color: '#B8860B' }}
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
                className="max-w-full rounded-xl border"
                style={{ borderColor: '#E8E4DE' }}
              />
            </div>
          )}

          <div
            className="prose prose-lg max-w-none mt-5"
            style={{ color: '#5C5650' }}
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
          />
        </div>

        {/* 댓글 섹션 */}
        <div className="bg-white rounded-2xl shadow-sm border p-6" style={{ borderColor: '#E8E4DE' }}>
          <h2 className="text-base font-bold mb-5" style={{ color: '#2D2A26' }}>
            댓글{comments.length > 0 ? ` (${comments.length})` : ''}
          </h2>

          {comments.length === 0 ? (
            <p className="text-sm text-center py-6 mb-2" style={{ color: '#A09890' }}>아직 댓글이 없습니다.</p>
          ) : (
            <div className="space-y-5 mb-6">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: '#B8860B1A', color: '#B8860B' }}>
                    {comment.author_name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold" style={{ color: '#2D2A26' }}>{comment.author_name}</span>
                      <span className="text-xs" style={{ color: '#A09890' }}>
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
                    <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: '#5C5650' }}>{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 댓글 작성 */}
          <form onSubmit={handleAddComment} className="flex gap-3 pt-4 border-t" style={{ borderColor: '#E8E4DE' }}>
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="댓글을 입력하세요..."
              rows={2}
              className="flex-1 px-3 py-2 text-sm border rounded-xl focus:ring-2 focus:ring-[#B8860B] focus:border-transparent resize-none outline-none"
              style={{ borderColor: '#E8E4DE', color: '#2D2A26' }}
            />
            <button
              type="submit"
              disabled={commentLoading || !commentText.trim()}
              className="px-4 py-2 text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-colors self-end"
              style={{ background: '#B8860B' }}
            >
              {commentLoading ? '...' : '등록'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

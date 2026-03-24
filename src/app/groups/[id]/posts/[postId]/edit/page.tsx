'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'

const TiptapEditor = dynamic(() => import('@/components/TiptapEditor'), { ssr: false })

const MAX_BYTES = 204800 // 200KB

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function EditPostPage() {
  const { id, postId } = useParams<{ id: string; postId: string }>()
  const groupId = Number(id)
  const postIdNum = Number(postId)
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [contentSizeExceeded, setContentSizeExceeded] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [access, setAccess] = useState<'checking' | 'allowed' | 'denied' | 'notLoggedIn'>('checking')

  useEffect(() => {
    const supabase = createClient()
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setAccess('notLoggedIn'); return }

      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      const admin = profile?.role === 'admin'

      const { data: post, error } = await supabase
        .from('group_posts').select('*').eq('id', postIdNum).single()

      if (error || !post) { setAccess('denied'); return }

      if (post.author_id !== user.id && !admin) { setAccess('denied'); return }

      setTitle(post.title)
      setContent(post.content)
      setAccess('allowed')
    }
    init()
  }, [postIdNum])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !content || content === '<p></p>') {
      alert('제목과 내용을 입력해주세요.')
      return
    }
    if (contentSizeExceeded) {
      alert(`내용이 너무 큽니다. ${formatSize(MAX_BYTES)} 이하로 작성해주세요.`)
      return
    }
    setSubmitting(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { alert('로그인이 필요합니다.'); return }

      const { error } = await supabase.from('group_posts')
        .update({ title, content, updated_at: new Date().toISOString() })
        .eq('id', postIdNum)

      if (error) {
        alert('수정 실패: ' + error.message)
      } else {
        router.push(`/groups/${groupId}/posts/${postIdNum}`)
      }
    } catch (e: any) {
      alert('오류가 발생했습니다: ' + (e.message ?? e))
    } finally {
      setSubmitting(false)
    }
  }

  if (access === 'checking') {
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
          <p className="text-gray-500 mb-4">수정 권한이 없습니다.</p>
          <Link href={`/groups/${groupId}`} className="inline-block px-6 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg">
            게시판으로 돌아가기
          </Link>
        </div>
      </main>
    )
  }

  const contentBytes = new Blob([content]).size

  return (
    <main className="min-h-screen bg-gray-50 pt-20 pb-16">
      <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link href={`/groups/${groupId}/posts/${postIdNum}`} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            ← 게시글로 돌아가기
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">게시글 수정</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-base font-medium text-gray-700 mb-1.5">
                제목 <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="게시글 제목"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-base font-medium text-gray-700">
                  내용 <span className="text-red-500">*</span>
                </label>
                <span className={`text-sm ${contentSizeExceeded ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                  {formatSize(contentBytes)} / {formatSize(MAX_BYTES)}
                </span>
              </div>
              {content !== '' && (
                <TiptapEditor
                  content={content}
                  onChange={setContent}
                  onSizeError={setContentSizeExceeded}
                />
              )}
              {contentSizeExceeded && (
                <p className="mt-1.5 text-sm text-red-500">내용이 너무 큽니다. 텍스트를 줄여주세요.</p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Link
                href={`/groups/${groupId}/posts/${postIdNum}`}
                className="flex-1 text-center px-4 py-3 border border-gray-200 text-gray-600 text-base font-medium rounded-xl hover:bg-gray-50 transition-colors"
              >
                취소
              </Link>
              <button
                type="submit"
                disabled={submitting || contentSizeExceeded}
                className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-sm text-base"
              >
                {submitting ? '저장 중...' : '수정 완료'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}

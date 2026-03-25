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

export default function NewPostPage() {
  const { id } = useParams<{ id: string }>()
  const groupId = Number(id)
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [contentSizeExceeded, setContentSizeExceeded] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [access, setAccess] = useState<'checking' | 'allowed' | 'denied' | 'notLoggedIn'>('checking')

  useEffect(() => {
    const supabase = createClient()
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setAccess('notLoggedIn'); return }

      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      const admin = profile?.role === 'admin'
      if (!admin) {
        const { data: membership } = await supabase
          .from('group_members').select('id')
          .eq('group_id', groupId).eq('user_id', user.id).maybeSingle()
        if (!membership) { setAccess('denied'); return }
      }
      setAccess('allowed')
    }
    check()
  }, [groupId])

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

      const { data: profile } = await supabase.from('profiles').select('name').eq('id', user.id).single()
      const authorName = (profile as any)?.name ?? '알 수 없음'

      const { error } = await supabase.from('group_posts').insert([{
        group_id: groupId,
        author_id: user.id,
        author_name: authorName,
        title,
        content,
      }])

      if (error) {
        alert('게시글 등록 실패: ' + error.message)
      } else {
        router.push(`/groups/${groupId}`)
      }
    } catch (e: unknown) {
      alert('오류가 발생했습니다: ' + (e instanceof Error ? e.message : String(e)))
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
          <p className="text-gray-500 mb-4">이 소그룹에 소속되어 있지 않습니다.</p>
          <Link href="/groups" className="inline-block px-6 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg">
            내 소그룹으로 돌아가기
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
          <Link href={`/groups/${groupId}`} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            ← 게시판으로 돌아가기
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">새 게시글 작성</h1>
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
              <TiptapEditor
                content={content}
                onChange={setContent}
                onSizeError={setContentSizeExceeded}
              />
              {contentSizeExceeded && (
                <p className="mt-1.5 text-sm text-red-500">내용이 너무 큽니다. 텍스트를 줄여주세요.</p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Link
                href={`/groups/${groupId}`}
                className="flex-1 text-center px-4 py-3 border border-gray-200 text-gray-600 text-base font-medium rounded-xl hover:bg-gray-50 transition-colors"
              >
                취소
              </Link>
              <button
                type="submit"
                disabled={submitting || contentSizeExceeded}
                className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-sm text-base"
              >
                {submitting ? '등록 중...' : '게시글 올리기'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}

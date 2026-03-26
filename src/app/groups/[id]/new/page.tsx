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
  const supabase = createClient()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [contentSizeExceeded, setContentSizeExceeded] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [access, setAccess] = useState<'checking' | 'allowed' | 'denied' | 'notLoggedIn'>('checking')

  useEffect(() => {
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
  }, [groupId]) // eslint-disable-line react-hooks/exhaustive-deps

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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { alert('로그인이 필요합니다.'); return }

      const { data: profile } = await supabase.from('profiles').select('name').eq('id', user.id).single()
      const authorName = (profile as { name?: string })?.name ?? '알 수 없음'

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
          <p className="mb-4" style={{ color: '#8B7355' }}>이 소그룹에 소속되어 있지 않습니다.</p>
          <Link href="/groups" className="inline-block px-6 py-2.5 text-sm font-medium rounded-xl border" style={{ background: '#FAF8F5', color: '#5C5650', borderColor: '#E8E4DE' }}>
            내 소그룹으로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  const contentBytes = new Blob([content]).size

  return (
    <div className="min-h-screen" style={{ background: '#FAF8F5' }}>
      {/* 헤더 */}
      <div className="bg-white border-b" style={{ borderColor: '#E8E4DE' }}>
        <div className="max-w-[860px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Link href={`/groups/${groupId}`} className="text-sm font-medium transition-colors" style={{ color: '#B8860B' }}>
            ← 게시판으로 돌아가기
          </Link>
          <h1 className="text-2xl font-bold mt-3" style={{ color: '#2D2A26', fontFamily: 'var(--font-serif)' }}>새 게시글 작성</h1>
        </div>
      </div>

      <div className="max-w-[860px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-sm border p-8" style={{ borderColor: '#E8E4DE' }}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#5C5650' }}>
                제목 <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="게시글 제목"
                className="w-full px-4 py-3 border rounded-xl text-base outline-none focus:ring-2 focus:ring-[#B8860B] focus:border-transparent"
                style={{ borderColor: '#E8E4DE', color: '#2D2A26' }}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold" style={{ color: '#5C5650' }}>
                  내용 <span className="text-red-500">*</span>
                </label>
                <span className={`text-sm ${contentSizeExceeded ? 'text-red-500 font-medium' : ''}`} style={!contentSizeExceeded ? { color: '#A09890' } : undefined}>
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
                className="flex-1 text-center px-4 py-3 border text-sm font-medium rounded-xl transition-colors"
                style={{ borderColor: '#E8E4DE', color: '#5C5650' }}
              >
                취소
              </Link>
              <button
                type="submit"
                disabled={submitting || contentSizeExceeded}
                className="flex-1 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 shadow-sm text-sm"
                style={{ background: '#B8860B' }}
              >
                {submitting ? '등록 중...' : '게시글 올리기'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

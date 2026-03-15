'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type Notice = {
  id: number
  title: string
  content: string
  author_name: string
  is_pinned: boolean
  created_at: string
}

export default function AdminNoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)
  const [formLoading, setFormLoading] = useState(false)
  const supabase = createClient()

  // 폼 상태
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isPinned, setIsPinned] = useState(false)

  const fetchNotices = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('notices')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
    
    if (data) setNotices(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchNotices()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !content) return

    setFormLoading(true)
    
    // 현재 로그인된 관리자 프로필 가져오기
    const { data: { user } } = await supabase.auth.getUser()
    let authorName = '관리자'
    
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('name').eq('id', user.id).single()
      if (profile) authorName = profile.name
    }

    const { error } = await supabase.from('notices').insert([
      { 
        title, 
        content,
        is_pinned: isPinned,
        author_id: user?.id,
        author_name: authorName
      }
    ])

    if (error) {
      alert('오류가 발생했습니다: ' + error.message)
    } else {
      alert('공지사항이 등록되었습니다.')
      setTitle('')
      setContent('')
      setIsPinned(false)
      fetchNotices()
    }
    setFormLoading(false)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('이 공지사항을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) return

    const { error } = await supabase.from('notices').delete().eq('id', id)
    if (error) {
      alert('삭제 중 오류 발생: ' + error.message)
    } else {
      fetchNotices()
    }
  }

  const togglePin = async (id: number, currentPinned: boolean) => {
    const { error } = await supabase.from('notices').update({ is_pinned: !currentPinned }).eq('id', id)
    if (error) {
      alert('업데이트 중 오류 발생: ' + error.message)
    } else {
      fetchNotices()
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">공지사항 관리</h1>
          <p className="mt-1 text-gray-500">교회 주요 소식과 알림을 작성하고 메인 화면에 고정할 수 있습니다.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 새 공지 등록 폼 */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
               <span className="text-blue-500">✍️</span> 새 공지사항 작성
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">제목 <span className="text-red-500">*</span></label>
                <input required type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="공지 제목 입력" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">본문 내용 <span className="text-red-500">*</span></label>
                <textarea required rows={8} value={content} onChange={e => setContent(e.target.value)} placeholder="공지 상세 내용을 입력하세요." className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-y" />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer group bg-gray-50 border border-gray-200 p-3 rounded-lg hover:bg-gray-100 transition-colors">
                  <input type="checkbox" checked={isPinned} onChange={e => setIsPinned(e.target.checked)} className="w-4 h-4 text-indigo-600 rounded bg-white border-gray-300 focus:ring-indigo-500 cursor-pointer" />
                  <div className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                    <span className="text-red-500 mr-1">📌</span>
                    중요 공지로 맨 위에 고정하기
                  </div>
                </label>
              </div>

              <button disabled={formLoading} type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 mt-4 shadow-sm hover:shadow-md">
                {formLoading ? '등록 중...' : '새 공지사항 올리기'}
              </button>
            </form>
          </div>
        </div>

        {/* 공지 목록 */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="p-12 text-center text-gray-500 bg-white rounded-2xl border border-gray-100">
              목록을 불러오는 중...
            </div>
          ) : (
            <div className="space-y-4">
              {notices.length === 0 ? (
                <div className="p-12 text-center text-gray-400 bg-white rounded-2xl border border-gray-100">
                  작성된 공지사항이 없습니다.
                </div>
              ) : (
                notices.map(notice => (
                  <div key={notice.id} className={`bg-white rounded-2xl shadow-sm border p-6 transition-all hover:shadow-md ${notice.is_pinned ? 'border-indigo-100' : 'border-gray-100'}`}>
                    <div className="flex justify-between items-start gap-4 mb-3">
                      <div>
                        {notice.is_pinned && (
                          <span className="inline-block bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-md mb-2">📌 중요 공지</span>
                        )}
                        <h3 className="text-lg font-bold text-gray-900">{notice.title}</h3>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => togglePin(notice.id, notice.is_pinned)}
                          title="고정 상태 변경"
                          className={`p-1.5 rounded-md transition-colors ${notice.is_pinned ? 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600'}`}
                        >
                          📌
                        </button>
                        <button 
                          onClick={() => handleDelete(notice.id)}
                          title="영구 삭제"
                          className="p-1.5 text-red-500 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 text-sm whitespace-pre-wrap leading-relaxed mb-4">
                      {notice.content}
                    </p>

                    <div className="flex items-center justify-between text-xs text-gray-400 pt-4 border-t border-gray-100">
                      <span className="flex items-center gap-1">
                        👤 {notice.author_name || '관리자'}
                      </span>
                      <span className="flex items-center gap-1">
                        🕒 {new Date(notice.created_at).toLocaleDateString('ko-KR', {
                          year: 'numeric', month: 'long', day: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

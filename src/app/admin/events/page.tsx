'use client'

import { useState, useEffect } from 'react'

type Event = {
  id: number
  title: string
  event_type: 'worship' | 'event' | 'meeting'
  event_date: string
  event_time: string | null
  location: string | null
  description: string | null
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [formLoading, setFormLoading] = useState(false)

  const [title, setTitle] = useState('')
  const [eventType, setEventType] = useState<'worship' | 'event' | 'meeting'>('event')
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')

  const fetchEvents = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/events')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '목록 조회 실패')
      setEvents(data.events ?? [])
    } catch (e) {
      console.error('일정 조회 오류:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !eventDate) return
    setFormLoading(true)
    try {
      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, event_type: eventType, event_date: eventDate, event_time: eventTime || null, location, description }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '등록 실패')
      alert('일정이 등록되었습니다.')
      setTitle('')
      setEventType('event')
      setEventDate('')
      setEventTime('')
      setLocation('')
      setDescription('')
      fetchEvents()
    } catch (e) {
      alert('등록 중 오류가 발생했습니다: ' + (e instanceof Error ? e.message : '알 수 없는 오류'))
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('정말 이 일정을 삭제하시겠습니까?')) return
    try {
      const res = await fetch(`/api/admin/events?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('삭제 실패')
      fetchEvents()
    } catch (e) {
      alert('삭제 중 오류 발생: ' + (e instanceof Error ? e.message : '알 수 없는 오류'))
    }
  }

  return (
    <div className="max-w-[1300px] mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">예배 및 행사 일정 관리</h1>
        <p className="mt-1 text-gray-500">교회의 다가오는 일정이나 예배 스케줄을 추가하고 관리합니다.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* 새 일정 등록 폼 */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-blue-500">➕</span> 새 일정 등록
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">일정 제목 <span className="text-red-500">*</span></label>
                <input required type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="예: 봄 수련회" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">분류</label>
                <select value={eventType} onChange={e => setEventType(e.target.value as 'worship' | 'event' | 'meeting')} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="worship">정규 예배</option>
                  <option value="event">특별 행사</option>
                  <option value="meeting">모임/회의</option>
                </select>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">날짜 <span className="text-red-500">*</span></label>
                  <input required type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 min-h-[42px]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">시간</label>
                  <input type="time" value={eventTime} onChange={e => setEventTime(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 min-h-[42px]" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">장소</label>
                <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="예: 본당, 친교실" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">상세 설명</label>
                <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="일정에 대한 간단한 안내" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <button disabled={formLoading} type="submit" className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 mt-2">
                {formLoading ? '등록 중...' : '등록하기'}
              </button>
            </form>
          </div>
        </div>

        {/* 일정 목록 */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="p-12 text-center text-gray-500">목록을 불러오는 중...</div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100">
              {events.length === 0 ? (
                <div className="p-12 text-center text-gray-400">등록된 일정이 없습니다.</div>
              ) : (
                events.map(ev => {
                  const typeLabel = ev.event_type === 'worship' ? '예배' : ev.event_type === 'event' ? '행사' : '모임'
                  const typeColor = ev.event_type === 'worship' ? 'bg-blue-100 text-blue-700' : ev.event_type === 'event' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
                  return (
                    <div key={ev.id} className="p-5 flex items-start gap-4 hover:bg-gray-50 transition-colors">
                      <div className="text-center bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 min-w-[64px]">
                        <p className="text-xs text-gray-500 font-medium">
                          {new Date(ev.event_date).toLocaleDateString('ko-KR', { month: 'short' })}
                        </p>
                        <p className="text-xl font-extrabold text-gray-900">
                          {new Date(ev.event_date).getDate()}
                        </p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${typeColor}`}>{typeLabel}</span>
                          <h3 className="font-bold text-gray-900 truncate">{ev.title}</h3>
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-3">
                          {ev.event_time && <span>🕒 {ev.event_time.slice(0, 5)}</span>}
                          {ev.location && <span>📍 {ev.location}</span>}
                        </div>
                        {ev.description && (
                          <p className="mt-2 text-sm text-gray-600 leading-relaxed bg-gray-50 p-2 rounded-lg border border-gray-100">
                            {ev.description}
                          </p>
                        )}
                      </div>
                      <div>
                        <button onClick={() => handleDelete(ev.id)} className="text-xs font-medium text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors">
                          삭제
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

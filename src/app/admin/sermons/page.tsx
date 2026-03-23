'use client'

import { useState, useEffect } from 'react'

type Sermon = {
    id: string
    title: string
    youtube_id: string
    sermon_date: string
    summary: string | null
    thumbnail_url: string | null
    status: 'draft' | 'published'
}

export default function AdminSermonPage() {
    const [youtubeUrl, setYoutubeUrl] = useState('')
    const [sermonDate, setSermonDate] = useState(new Date().toISOString().split('T')[0])
    const [loading, setLoading] = useState(false)
    const [listLoading, setListLoading] = useState(true)
    const [sermons, setSermons] = useState<Sermon[]>([])

    // 모달 상태
    const [modalSermon, setModalSermon] = useState<Sermon | null>(null)
    const [modalTitle, setModalTitle] = useState('')
    const [modalDate, setModalDate] = useState('')
    const [modalSummary, setModalSummary] = useState('')
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetchSermons()
    }, [])

    const fetchSermons = async () => {
        setListLoading(true)
        try {
            const res = await fetch('/api/sermons/manage')
            const result = await res.json()
            setSermons(result.data ?? [])
        } catch (e) {
            console.error('fetchSermons error:', e)
        } finally {
            setListLoading(false)
        }
    }

    const handleParseSermon = async () => {
        if (!youtubeUrl) return alert('유튜브 URL을 입력해주세요.')
        setLoading(true)
        try {
            const res = await fetch('/api/sermons/parse', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ youtubeUrl, sermonDate })
            })
            const result = await res.json()
            if (result.success) {
                alert('AI 요약본이 임시저장되었습니다. 아래 목록에서 검토 후 발행해주세요!')
                setYoutubeUrl('')
                fetchSermons()
            } else {
                alert(result.error || '요약 실패')
            }
        } catch (err) {
            console.error(err)
            alert('오류가 발생했습니다.')
        } finally {
            setLoading(false)
        }
    }

    const openModal = (s: Sermon) => {
        setModalSermon(s)
        setModalTitle(s.title)
        setModalDate(s.sermon_date)
        setModalSummary(s.summary ?? '')
    }

    const closeModal = () => {
        setModalSermon(null)
    }

    const handleSave = async () => {
        if (!modalSermon) return
        if (!modalTitle.trim()) return alert('제목을 입력해주세요.')
        setSaving(true)
        try {
            const res = await fetch('/api/sermons/manage', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: modalSermon.id,
                    title: modalTitle.trim(),
                    sermon_date: modalDate,
                    summary: modalSummary,
                }),
            })
            const result = await res.json()
            if (result.success) {
                await fetchSermons()
                closeModal()
            } else {
                alert(`저장에 실패했습니다: ${result.error}`)
            }
        } catch (e) {
            alert('저장 중 오류가 발생했습니다.')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`"${title}" 설교를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return
        try {
            const res = await fetch('/api/sermons/manage', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            })
            const result = await res.json()
            if (result.success) {
                fetchSermons()
                if (modalSermon?.id === id) closeModal()
            } else {
                alert(`삭제에 실패했습니다: ${result.error}`)
            }
        } catch (e) {
            alert('삭제 중 오류가 발생했습니다.')
        }
    }

    const togglePublish = async (id: string, currentStatus: string) => {
        const nextStatus = currentStatus === 'draft' ? 'published' : 'draft'
        try {
            const res = await fetch('/api/sermons/manage', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: nextStatus }),
            })
            const result = await res.json()
            if (result.success) {
                fetchSermons()
                if (modalSermon?.id === id) {
                    setModalSermon({ ...modalSermon, status: nextStatus as 'draft' | 'published' })
                }
            } else {
                alert(`상태 변경 실패: ${result.error}`)
            }
        } catch (e) {
            alert('상태 변경 중 오류가 발생했습니다.')
        }
    }

    return (
        <div className="max-w-4xl mx-auto p-8">
            <h1 className="text-3xl font-bold mb-8">📽️ 설교 자동 요약 및 관리</h1>

            {/* 신규 등록 섹션 */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-10">
                <h2 className="text-xl font-semibold mb-4">새 설교 분석하기</h2>
                <div className="flex flex-col gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">유튜브 주소</label>
                        <input
                            type="text"
                            className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="https://www.youtube.com/watch?v=..."
                            value={youtubeUrl}
                            onChange={(e) => setYoutubeUrl(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">설교 날짜</label>
                        <input
                            type="date"
                            className="w-full border rounded-lg p-2.5 outline-none"
                            value={sermonDate}
                            onChange={(e) => setSermonDate(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={handleParseSermon}
                        disabled={loading}
                        className={`w-full py-3 rounded-lg font-bold text-white transition-all ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                        {loading ? 'AI 분석 및 요약 중 (약 30초 소요)...' : 'AI 설교 요약 시작'}
                    </button>
                </div>
            </div>

            {/* 설교 리스트 */}
            <div>
                <h2 className="text-xl font-semibold mb-4">최근 등록된 설교 내역</h2>

                {listLoading ? (
                    <div className="text-center py-10 text-gray-400">목록 불러오는 중...</div>
                ) : (
                    <div className="space-y-3">
                        {sermons.map((s) => (
                            <div key={s.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
                                {/* 썸네일 */}
                                <img
                                    src={s.thumbnail_url ?? ''}
                                    className="w-28 h-[4.5rem] object-cover rounded-lg shadow-sm flex-shrink-0"
                                    alt="썸네일"
                                />

                                {/* 정보 */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-gray-400 mb-0.5">{s.sermon_date}</p>
                                    <h3 className="font-bold text-gray-900 truncate text-sm">{s.title}</h3>
                                    {s.summary && (
                                        <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                                            {s.summary}
                                        </p>
                                    )}
                                    <span className={`inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${s.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {s.status === 'published' ? '공개중' : '검토 대기중'}
                                    </span>
                                </div>

                                {/* 버튼 */}
                                <div className="flex flex-col gap-2 flex-shrink-0">
                                    <button
                                        onClick={() => openModal(s)}
                                        className="px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-sm font-semibold hover:bg-blue-100 transition-colors"
                                    >
                                        내용 보기 / 수정
                                    </button>
                                    <button
                                        onClick={() => togglePublish(s.id, s.status)}
                                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${s.status === 'published'
                                            ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            : 'bg-green-600 text-white hover:bg-green-700'}`}
                                    >
                                        {s.status === 'published' ? '내리기' : '최종 발행'}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(s.id, s.title)}
                                        className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-semibold hover:bg-red-100 transition-colors"
                                    >
                                        삭제
                                    </button>
                                </div>
                            </div>
                        ))}
                        {sermons.length === 0 && (
                            <p className="text-center py-10 text-gray-400">등록된 설교가 없습니다.</p>
                        )}
                    </div>
                )}
            </div>

            {/* 요약 내용 보기/수정 모달 */}
            {modalSermon && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                    onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}
                >
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                        {/* 모달 헤더 */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-gray-900">설교 내용 보기 / 수정</h2>
                            <button
                                onClick={closeModal}
                                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        {/* 모달 본문 (스크롤) */}
                        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
                            {/* 썸네일 + 유튜브 링크 */}
                            <a
                                href={`https://www.youtube.com/watch?v=${modalSermon.youtube_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-200 transition-colors group"
                            >
                                <img
                                    src={modalSermon.thumbnail_url ?? ''}
                                    className="w-24 h-16 object-cover rounded-lg shadow-sm flex-shrink-0"
                                    alt="썸네일"
                                />
                                <div>
                                    <p className="text-xs text-gray-400 mb-0.5">유튜브 영상 바로가기</p>
                                    <p className="text-sm font-medium text-blue-600 group-hover:underline">
                                        youtube.com/watch?v={modalSermon.youtube_id}
                                    </p>
                                </div>
                            </a>

                            {/* 제목 */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">설교 제목</label>
                                <input
                                    type="text"
                                    value={modalTitle}
                                    onChange={(e) => setModalTitle(e.target.value)}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    placeholder="설교 제목을 입력하세요"
                                />
                            </div>

                            {/* 날짜 */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">설교 날짜</label>
                                <input
                                    type="date"
                                    value={modalDate}
                                    onChange={(e) => setModalDate(e.target.value)}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                />
                            </div>

                            {/* AI 요약 내용 */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    AI 요약 내용
                                    <span className="ml-2 text-xs font-normal text-gray-400">직접 수정 가능합니다</span>
                                </label>
                                <textarea
                                    value={modalSummary}
                                    onChange={(e) => setModalSummary(e.target.value)}
                                    rows={12}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                                    placeholder="AI가 생성한 요약 내용이 여기에 표시됩니다."
                                />
                            </div>
                        </div>

                        {/* 모달 푸터 */}
                        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
                            <button
                                onClick={() => handleDelete(modalSermon.id, modalSermon.title)}
                                className="px-4 py-2 text-sm font-semibold bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                            >
                                삭제
                            </button>
                            <div className="flex gap-2">
                                <button
                                    onClick={closeModal}
                                    className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                                >
                                    닫기
                                </button>
                                <button
                                    onClick={() => togglePublish(modalSermon.id, modalSermon.status)}
                                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${modalSermon.status === 'published'
                                        ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        : 'bg-green-600 text-white hover:bg-green-700'}`}
                                >
                                    {modalSermon.status === 'published' ? '내리기' : '발행하기'}
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className={`px-5 py-2 text-sm font-bold rounded-lg text-white transition-colors ${saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                                >
                                    {saving ? '저장 중...' : '저장'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Bulletin {
    id: string
    title: string
    bulletin_date: string
    file_url: string
    created_at: string
}

function formatDate(dateStr: string) {
    const d = new Date(dateStr)
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`
}

export default function AdminBulletinsPage() {
    const [bulletins, setBulletins] = useState<Bulletin[]>([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [title, setTitle] = useState('')
    const [bulletinDate, setBulletinDate] = useState('')
    const [file, setFile] = useState<File | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const fileRef = useRef<HTMLInputElement>(null)

    const fetchBulletins = async () => {
        const res = await fetch('/api/admin/bulletins')
        const data = await res.json()
        setBulletins(data.bulletins ?? [])
        setLoading(false)
    }

    useEffect(() => { fetchBulletins() }, [])

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!file || !title || !bulletinDate) {
            setError('모든 항목을 입력해 주세요.')
            return
        }
        setError(null)
        setSuccess(null)
        setUploading(true)

        const filePath = `${bulletinDate}_${Date.now()}.pdf`

        // 1단계: 서버에서 서명된 업로드 URL 발급
        const presignRes = await fetch('/api/admin/bulletins/presign', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filePath }),
        })
        const presignData = await presignRes.json()
        if (!presignRes.ok) {
            setError(presignData.error || '업로드 URL 생성에 실패했습니다.')
            setUploading(false)
            return
        }

        // 2단계: 브라우저에서 Supabase Storage로 직접 업로드 (Vercel 크기/시간 제한 없음)
        const supabase = createClient()
        const { error: uploadError } = await supabase.storage
            .from('bulletins')
            .uploadToSignedUrl(filePath, presignData.token, file, { contentType: 'application/pdf' })

        if (uploadError) {
            setError(uploadError.message || '파일 업로드에 실패했습니다.')
            setUploading(false)
            return
        }

        // 3단계: DB에 메타데이터 저장
        const res = await fetch('/api/admin/bulletins', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, bulletinDate, filePath }),
        })
        const data = await res.json()

        if (!res.ok) {
            setError(data.error || '저장에 실패했습니다.')
        } else {
            setSuccess('주보가 업로드되었습니다.')
            setTitle('')
            setBulletinDate('')
            setFile(null)
            if (fileRef.current) fileRef.current.value = ''
            fetchBulletins()
        }
        setUploading(false)
    }

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`"${title}" 주보를 삭제하시겠습니까?`)) return
        const res = await fetch(`/api/admin/bulletins/${id}`, { method: 'DELETE' })
        if (res.ok) {
            setBulletins(prev => prev.filter(b => b.id !== id))
        }
    }

    return (
        <div className="p-6 max-w-3xl mx-auto space-y-8">
            <h1 className="text-2xl font-extrabold text-gray-900">주보 관리</h1>

            {/* 업로드 폼 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-5">새 주보 업로드</h2>
                <form onSubmit={handleUpload} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">제목</label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="예) 2024년 3월 24일 주보"
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">주일 날짜</label>
                        <input
                            type="date"
                            value={bulletinDate}
                            onChange={e => setBulletinDate(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">PDF 파일</label>
                        <input
                            ref={fileRef}
                            type="file"
                            accept="application/pdf"
                            onChange={e => setFile(e.target.files?.[0] ?? null)}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 file:font-medium hover:file:bg-blue-100"
                        />
                    </div>

                    {error && <p className="text-sm text-red-500 bg-red-50 px-4 py-2.5 rounded-xl">{error}</p>}
                    {success && <p className="text-sm text-green-600 bg-green-50 px-4 py-2.5 rounded-xl">{success}</p>}

                    <button
                        type="submit"
                        disabled={uploading}
                        className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {uploading ? '업로드 중...' : '업로드'}
                    </button>
                </form>
            </div>

            {/* 주보 목록 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="px-6 py-4 border-b border-gray-50">
                    <h2 className="text-lg font-bold text-gray-800">업로드된 주보</h2>
                </div>
                {loading ? (
                    <div className="flex items-center justify-center py-12 text-gray-400">불러오는 중...</div>
                ) : bulletins.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 text-sm">등록된 주보가 없습니다.</div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {bulletins.map(bulletin => (
                            <div key={bulletin.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                                <div>
                                    <p className="font-semibold text-gray-800">{bulletin.title}</p>
                                    <p className="text-gray-400 text-sm mt-0.5">{formatDate(bulletin.bulletin_date)}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <a
                                        href={`/bulletins/${bulletin.id}`}
                                        target="_blank"
                                        className="px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                                    >
                                        보기
                                    </a>
                                    <button
                                        onClick={() => handleDelete(bulletin.id, bulletin.title)}
                                        className="px-3 py-1.5 text-xs font-medium text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                                    >
                                        삭제
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

'use client'

import { useState } from 'react'

interface ImageUploadFieldProps {
  value: string | null
  onChange: (url: string | null) => void
  scope: 'pages' | 'timeline' | 'people' | 'missions'
  // true면 비공개 버킷 (회원 전용 사진)
  isPrivate?: boolean
}

export default function ImageUploadField({ value, onChange, scope, isPrivate = false }: ImageUploadFieldProps) {
  const [uploading, setUploading] = useState(false)

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('scope', scope)
      form.append('private', String(isPrivate))
      const res = await fetch('/api/admin/upload', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '업로드 실패')
      onChange(data.url)
    } catch (e) {
      alert(e instanceof Error ? e.message : '업로드 실패')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" className="w-16 h-16 rounded-lg object-cover border border-gray-200 bg-gray-50" />
      ) : (
        <div className="w-16 h-16 rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-400">없음</div>
      )}
      <div className="flex flex-col gap-1">
        <label className="px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg cursor-pointer text-center">
          {uploading ? '올리는 중...' : value ? '바꾸기' : '사진 올리기'}
          <input type="file" accept="image/*" className="sr-only" disabled={uploading}
            onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = '' }} />
        </label>
        {value && (
          <button type="button" onClick={() => onChange(null)} className="px-3 py-1 text-xs text-red-500 hover:bg-red-50 rounded-lg">
            제거
          </button>
        )}
      </div>
    </div>
  )
}

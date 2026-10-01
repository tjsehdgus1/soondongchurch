'use client'

import { useEffect, useMemo, useState } from 'react'
import ImageUploadField from '@/components/admin/ImageUploadField'

type Row = Record<string, unknown>

export type EditorColumn = {
  name: string
  label: string
  type: 'text' | 'textarea' | 'int' | 'number' | 'checkbox' | 'image'
  // 넓은 칸 (줄 전체)
  wide?: boolean
  placeholder?: string
  uploadScope?: 'pages' | 'timeline' | 'people' | 'missions'
  // 이 boolean 필드가 true면 사진을 비공개 버킷에 올림
  privateFlag?: string
}

interface AdminRecordEditorProps {
  title: string
  description?: string
  endpoint: string
  idColumn: 'id' | 'key'
  columns: EditorColumn[]
  // 행 카드 머리글
  headerOf: (row: Row) => string
  // 검색창 (없으면 숨김)
  matches?: (row: Row, query: string) => boolean
  newDefaults?: Row
}

function toInputValue(value: unknown) {
  return value === null || value === undefined ? '' : String(value)
}

export default function AdminRecordEditor({
  title, description, endpoint, idColumn, columns, headerOf, matches, newDefaults,
}: AdminRecordEditorProps) {
  const [rows, setRows] = useState<Row[]>([])
  const [drafts, setDrafts] = useState<Record<string, Row>>({})
  const [newRow, setNewRow] = useState<Row | null>(null)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)

  const idOf = (row: Row) => String(row[idColumn])

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(endpoint)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '목록 조회 실패')
      setRows(data.data)
      setDrafts({})
    } catch (e) {
      alert(e instanceof Error ? e.message : '목록 조회 실패')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const visible = useMemo(
    () => (matches && query.trim() ? rows.filter((r) => matches(r, query.trim())) : rows),
    [rows, query, matches],
  )

  const request = async (url: string, method: string, body?: Row) => {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? '요청 실패')
  }

  // 폼 값 → API 값 (숫자 칸 빈 값은 null)
  const payloadOf = (row: Row) => Object.fromEntries(columns.map((c) => {
    const v = row[c.name]
    if ((c.type === 'int' || c.type === 'number') && v !== null && v !== '' && v !== undefined) return [c.name, Number(v)]
    return [c.name, v ?? null]
  }))

  const save = async (id: string) => {
    setBusy(id)
    try {
      await request(`${endpoint}?${idColumn}=${encodeURIComponent(id)}`, 'PATCH', payloadOf(drafts[id]))
      await load()
    } catch (e) {
      alert(e instanceof Error ? e.message : '저장 실패')
    } finally {
      setBusy(null)
    }
  }

  const remove = async (row: Row) => {
    if (!confirm(`'${headerOf(row)}' 항목을 삭제하시겠습니까?`)) return
    try {
      await request(`${endpoint}?${idColumn}=${encodeURIComponent(idOf(row))}`, 'DELETE')
      await load()
    } catch (e) {
      alert(e instanceof Error ? e.message : '삭제 실패')
    }
  }

  const create = async () => {
    if (!newRow) return
    setBusy('new')
    try {
      await request(endpoint, 'POST', { ...payloadOf(newRow), ...(idColumn === 'key' ? { key: newRow.key } : {}) })
      setNewRow(null)
      await load()
    } catch (e) {
      alert(e instanceof Error ? e.message : '추가 실패')
    } finally {
      setBusy(null)
    }
  }

  const fieldClass = 'w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm bg-white'

  const renderFields = (row: Row, onChange: (patch: Row) => void) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {columns.map((c) => {
        const wrap = c.wide || c.type === 'textarea' ? 'sm:col-span-2 lg:col-span-4' : ''
        if (c.type === 'checkbox') {
          return (
            <label key={c.name} className={`flex items-center gap-2 text-sm text-gray-600 ${wrap}`}>
              <input type="checkbox" checked={!!row[c.name]} onChange={(e) => onChange({ [c.name]: e.target.checked })} className="w-4 h-4" />
              {c.label}
            </label>
          )
        }
        if (c.type === 'image') {
          return (
            <div key={c.name} className={`text-xs text-gray-500 ${wrap}`}>
              <p className="mb-1">{c.label}</p>
              <ImageUploadField
                value={(row[c.name] as string | null) ?? null}
                onChange={(url) => onChange({ [c.name]: url })}
                scope={c.uploadScope ?? 'pages'}
                isPrivate={c.privateFlag ? !!row[c.privateFlag] : false}
              />
            </div>
          )
        }
        return (
          <label key={c.name} className={`text-xs text-gray-500 ${wrap}`}>
            {c.label}
            {c.type === 'textarea' ? (
              <textarea rows={5} className={`${fieldClass} font-mono`} placeholder={c.placeholder}
                value={toInputValue(row[c.name])} onChange={(e) => onChange({ [c.name]: e.target.value })} />
            ) : (
              <input className={fieldClass} placeholder={c.placeholder}
                type={c.type === 'int' || c.type === 'number' ? 'number' : 'text'}
                step={c.type === 'number' ? 'any' : undefined}
                value={toInputValue(row[c.name])} onChange={(e) => onChange({ [c.name]: e.target.value })} />
            )}
          </label>
        )
      })}
    </div>
  )

  return (
    <div className="max-w-[1300px] mx-auto space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
        </div>
        <div className="flex gap-2">
          {matches && (
            <input type="search" placeholder="검색" value={query} onChange={(e) => setQuery(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm" aria-label="검색" />
          )}
          {newDefaults && !newRow && (
            <button onClick={() => setNewRow({ ...newDefaults })}
              className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg">
              추가
            </button>
          )}
        </div>
      </div>

      {newRow && (
        <div className="bg-indigo-50/50 rounded-2xl border border-indigo-100 p-5 space-y-3">
          <p className="font-semibold text-gray-800">새 항목</p>
          {idColumn === 'key' && (
            <label className="block text-xs text-gray-500">key (영문 소문자·숫자·점)
              <input className={fieldClass} value={toInputValue(newRow.key)} onChange={(e) => setNewRow({ ...newRow, key: e.target.value })} />
            </label>
          )}
          {renderFields(newRow, (patch) => setNewRow({ ...newRow, ...patch }))}
          <div className="flex gap-2">
            <button onClick={create} disabled={busy === 'new'} className="px-4 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg disabled:opacity-50">
              {busy === 'new' ? '추가 중...' : '저장'}
            </button>
            <button onClick={() => setNewRow(null)} className="px-4 py-1.5 text-sm text-gray-500 border border-gray-200 rounded-lg">취소</button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-center py-12 text-gray-400">불러오는 중...</p>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-gray-400">{visible.length}개 항목</p>
          {visible.map((row) => {
            const id = idOf(row)
            const draft = drafts[id] ?? row
            const dirty = !!drafts[id]
            return (
              <div key={id} className={`bg-white rounded-2xl border shadow-sm p-5 ${dirty ? 'border-indigo-300' : 'border-gray-100'}`}>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <p className="font-semibold text-gray-800 truncate">{headerOf(row)}</p>
                  <div className="flex gap-2">
                    <button onClick={() => save(id)} disabled={!dirty || busy === id}
                      className="px-4 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-40">
                      {busy === id ? '저장 중...' : '저장'}
                    </button>
                    <button onClick={() => remove(row)} className="px-4 py-1.5 text-sm font-medium text-red-500 border border-red-200 rounded-lg hover:bg-red-50">
                      삭제
                    </button>
                  </div>
                </div>
                {renderFields(draft, (patch) => setDrafts((prev) => ({ ...prev, [id]: { ...(prev[id] ?? row), ...patch } })))}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

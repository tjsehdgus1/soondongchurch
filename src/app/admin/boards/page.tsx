'use client'

import { useEffect, useState } from 'react'
import { type Board, SECTION_ORDER } from '@/lib/boards'

type Group = { id: number, name: string }
type Draft = Omit<Board, 'id' | 'categories'> & { categories: string }

const LEVEL_LABEL = { admin: '관리자만', group: '부서 멤버', member: '로그인 회원' }
const KIND_LABEL = { list: '목록형', card: '카드형(사진·영상)' }

const emptyDraft: Draft = {
  slug: '', name: '', section: SECTION_ORDER[0], kind: 'list', write_level: 'admin',
  group_id: null, categories: '', sort_order: 100,
}

function toPayload(d: Draft) {
  return {
    name: d.name, section: d.section, kind: d.kind, write_level: d.write_level,
    group_id: d.group_id, sort_order: Number(d.sort_order) || 0,
    categories: d.categories.split(',').map((c) => c.trim()).filter(Boolean),
  }
}

export default function AdminBoardsPage() {
  const [boards, setBoards] = useState<Board[]>([])
  const [drafts, setDrafts] = useState<Record<number, Draft>>({})
  const [groups, setGroups] = useState<Group[]>([])
  const [postCounts, setPostCounts] = useState<Record<number, number>>({})
  const [newBoard, setNewBoard] = useState<Draft>(emptyDraft)
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<number | 'new' | null>(null)

  const fetchBoards = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/boards')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '목록 조회 실패')
      setBoards(data.boards)
      setGroups(data.groups)
      setPostCounts(data.postCounts)
      setDrafts(Object.fromEntries((data.boards as Board[]).map((b) => [b.id, { ...b, categories: b.categories.join(', ') }])))
    } catch (e) {
      alert(e instanceof Error ? e.message : '목록 조회 실패')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchBoards() }, [])

  const updateDraft = (id: number, patch: Partial<Draft>) =>
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }))

  const request = async (url: string, method: string, body?: unknown) => {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? '요청 실패')
  }

  const handleSave = async (id: number) => {
    setSavingId(id)
    try {
      await request(`/api/admin/boards?id=${id}`, 'PATCH', toPayload(drafts[id]))
      await fetchBoards()
    } catch (e) {
      alert(e instanceof Error ? e.message : '저장 실패')
    } finally {
      setSavingId(null)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingId('new')
    try {
      await request('/api/admin/boards', 'POST', { ...toPayload(newBoard), slug: newBoard.slug.trim() })
      setNewBoard(emptyDraft)
      await fetchBoards()
    } catch (e) {
      alert(e instanceof Error ? e.message : '추가 실패')
    } finally {
      setSavingId(null)
    }
  }

  const handleDelete = async (board: Board) => {
    if (!confirm(`'${board.name}' 게시판을 삭제하시겠습니까?`)) return
    try {
      await request(`/api/admin/boards?id=${board.id}`, 'DELETE')
      await fetchBoards()
    } catch (e) {
      alert(e instanceof Error ? e.message : '삭제 실패')
    }
  }

  const fieldClass = 'w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm bg-white'

  const fields = (d: Draft, onChange: (patch: Partial<Draft>) => void) => (
    <>
      <label className="text-xs text-gray-500">이름
        <input className={fieldClass} value={d.name} onChange={(e) => onChange({ name: e.target.value })} />
      </label>
      <label className="text-xs text-gray-500">메뉴 그룹
        <select className={fieldClass} value={d.section} onChange={(e) => onChange({ section: e.target.value })}>
          {SECTION_ORDER.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </label>
      <label className="text-xs text-gray-500">목록 형태
        <select className={fieldClass} value={d.kind} onChange={(e) => onChange({ kind: e.target.value as Draft['kind'] })}>
          {Object.entries(KIND_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </label>
      <label className="text-xs text-gray-500">글쓰기
        <select className={fieldClass} value={d.write_level} onChange={(e) => onChange({ write_level: e.target.value as Draft['write_level'] })}>
          {Object.entries(LEVEL_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </label>
      <label className="text-xs text-gray-500">글쓰기 부서
        <select className={fieldClass} value={d.group_id ?? ''} disabled={d.write_level !== 'group'}
          onChange={(e) => onChange({ group_id: e.target.value ? Number(e.target.value) : null })}>
          <option value="">(미지정 — 관리자만)</option>
          {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </label>
      <label className="text-xs text-gray-500">말머리 (쉼표 구분)
        <input className={fieldClass} value={d.categories} onChange={(e) => onChange({ categories: e.target.value })} />
      </label>
      <label className="text-xs text-gray-500">순서
        <input type="number" className={fieldClass} value={d.sort_order} onChange={(e) => onChange({ sort_order: Number(e.target.value) })} />
      </label>
    </>
  )

  return (
    <div className="max-w-[1300px] mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">게시판 관리</h1>
        <p className="mt-1 text-sm text-gray-500">
          상단 메뉴에 표시되는 게시판입니다. &lsquo;부서 멤버&rsquo; 권한은 지정한 소그룹 멤버와 관리자만 글을 쓸 수 있습니다 (부서 멤버는 소그룹 관리에서 지정).
        </p>
      </div>

      <form onSubmit={handleCreate} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-gray-800 mb-3">게시판 추가</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 items-end">
          <label className="text-xs text-gray-500">주소 (영문)
            <input className={fieldClass} placeholder="예: choir" value={newBoard.slug}
              onChange={(e) => setNewBoard({ ...newBoard, slug: e.target.value })} />
          </label>
          {fields(newBoard, (patch) => setNewBoard({ ...newBoard, ...patch }))}
        </div>
        <button type="submit" disabled={savingId === 'new'}
          className="mt-4 px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50">
          {savingId === 'new' ? '추가 중...' : '추가'}
        </button>
      </form>

      {loading ? (
        <p className="text-center py-12 text-gray-400">불러오는 중...</p>
      ) : (
        <div className="space-y-3">
          {boards.map((b) => drafts[b.id] && (
            <div key={b.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <p className="font-semibold text-gray-800">
                  {b.name} <span className="text-xs font-normal text-gray-400">/board/{b.slug} · 글 {postCounts[b.id] ?? 0}개</span>
                </p>
                <div className="flex gap-2">
                  <button onClick={() => handleSave(b.id)} disabled={savingId === b.id}
                    className="px-4 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50">
                    {savingId === b.id ? '저장 중...' : '저장'}
                  </button>
                  <button onClick={() => handleDelete(b)}
                    className="px-4 py-1.5 text-sm font-medium text-red-500 border border-red-200 rounded-lg hover:bg-red-50">
                    삭제
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {fields(drafts[b.id], (patch) => updateDraft(b.id, patch))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

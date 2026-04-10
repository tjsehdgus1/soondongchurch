'use client'

import { useState, useEffect } from 'react'

type GroupInfo = { id: number; name: string }

type Member = {
  id: string
  username: string
  name: string
  email: string
  phone_number: string
  role: string
  is_blocked: boolean
  created_at: string
  group_members: { groups: GroupInfo }[]
}

type EditForm = {
  name: string
  email: string
  phone_number: string
  role: string
}

export default function AdminMembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  // 수정 모달
  const [editTarget, setEditTarget] = useState<Member | null>(null)
  const [editForm, setEditForm] = useState<EditForm>({ name: '', email: '', phone_number: '', role: 'member' })
  const [saving, setSaving] = useState(false)

  const fetchMembers = async () => {
    setLoading(true)
    setFetchError(null)
    try {
      const res = await fetch('/api/admin/members')
      if (!res.ok) throw new Error(`서버 오류 (${res.status})`)
      const json = await res.json()
      if (json.data) setMembers(json.data)
    } catch (e: unknown) {
      setFetchError(e instanceof Error ? e.message : '데이터를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchMembers() }, [])

  const openEdit = (member: Member) => {
    setEditTarget(member)
    setEditForm({
      name: member.name,
      email: member.email || '',
      phone_number: member.phone_number || '',
      role: member.role,
    })
  }

  const handleSave = async () => {
    if (!editTarget) return
    setSaving(true)
    const res = await fetch('/api/admin/members', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editTarget.id, ...editForm }),
    })
    const json = await res.json()
    if (json.error) {
      alert('오류: ' + json.error)
    } else {
      setEditTarget(null)
      fetchMembers()
    }
    setSaving(false)
  }

  const handleToggleBlock = async (member: Member) => {
    const action = member.is_blocked ? '차단을 해제' : '차단'
    if (!confirm(`${member.name} 교인을 ${action}하시겠습니까?`)) return
    const res = await fetch('/api/admin/members', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: member.id, is_blocked: !member.is_blocked }),
    })
    const json = await res.json()
    if (json.error) alert('오류: ' + json.error)
    else fetchMembers()
  }

  const filtered = members.filter((m) =>
    m.name.includes(search) ||
    m.username?.includes(search) ||
    m.email?.includes(search) ||
    m.phone_number?.includes(search)
  )

  return (
    <div className="max-w-[1300px] mx-auto px-4 py-6 md:px-0 md:py-0">
      {/* 헤더 */}
      <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between md:mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">교인 관리</h1>
          <p className="mt-1 text-sm text-gray-500">교인 정보 수정, 소그룹 확인, 차단 관리를 할 수 있습니다.</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="이름·아이디·전화번호 검색"
            className="flex-1 min-w-0 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 md:w-56 md:flex-none"
          />
          <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-semibold border border-blue-100 text-sm whitespace-nowrap flex-shrink-0">
            총 {members.length}명
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center text-gray-400 bg-white rounded-2xl border border-gray-100">
          불러오는 중...
        </div>
      ) : fetchError ? (
        <div className="py-12 text-center bg-white rounded-2xl border border-red-100">
          <p className="text-red-500 font-medium">데이터를 불러오지 못했습니다.</p>
          <p className="text-sm text-gray-400 mt-1">{fetchError}</p>
          <button onClick={fetchMembers} className="mt-4 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">
            다시 시도
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-gray-400 bg-white rounded-2xl border border-gray-100">
          {search ? '검색 결과가 없습니다.' : '등록된 교인이 없습니다.'}
        </div>
      ) : (
        <>
          {/* 모바일: 카드 레이아웃 */}
          <div className="flex flex-col gap-3 md:hidden">
            {filtered.map((member) => {
              const groups = member.group_members?.map((gm) => gm.groups) ?? []
              return (
                <div
                  key={member.id}
                  className={`bg-white rounded-xl border border-gray-100 shadow-sm p-4 ${member.is_blocked ? 'opacity-60' : ''}`}
                >
                  {/* 상단: 아바타 + 이름 + 배지 */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${member.is_blocked ? 'bg-red-100 text-red-500' : 'bg-blue-100 text-blue-600'}`}>
                      {member.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-900">{member.name}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          member.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {member.role === 'admin' ? '관리자' : '일반 교인'}
                        </span>
                        {member.is_blocked && (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-600">
                            🚫 차단됨
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">{member.username}</p>
                    </div>
                  </div>

                  {/* 연락처 */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mb-3">
                    <div>
                      <span className="text-xs text-gray-400">휴대폰</span>
                      <p className="text-gray-700">{member.phone_number || '-'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400">가입일</span>
                      <p className="text-gray-700 text-xs">
                        {new Date(member.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  {/* 소그룹 */}
                  {groups.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {groups.map((g) => (
                        <span key={g.id} className="inline-block bg-indigo-50 text-indigo-600 text-xs px-2 py-0.5 rounded-md font-medium">
                          {g.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* 버튼 */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEdit(member)}
                      className="flex-1 py-2 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleToggleBlock(member)}
                      className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
                        member.is_blocked
                          ? 'text-green-600 bg-green-50 hover:bg-green-100'
                          : 'text-red-500 bg-red-50 hover:bg-red-100'
                      }`}
                    >
                      {member.is_blocked ? '차단 해제' : '차단'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* 데스크탑: 테이블 레이아웃 */}
          <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-100 text-gray-500">
                  <tr>
                    <th className="px-5 py-4 font-semibold">이름</th>
                    <th className="px-5 py-4 font-semibold">아이디</th>
                    <th className="px-5 py-4 font-semibold">이메일</th>
                    <th className="px-5 py-4 font-semibold">휴대폰</th>
                    <th className="px-5 py-4 font-semibold">권한</th>
                    <th className="px-5 py-4 font-semibold">소속 소그룹</th>
                    <th className="px-5 py-4 font-semibold">상태</th>
                    <th className="px-5 py-4 font-semibold">가입일</th>
                    <th className="px-5 py-4 font-semibold">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((member) => {
                    const groups = member.group_members?.map((gm) => gm.groups) ?? []
                    return (
                      <tr
                        key={member.id}
                        className={`hover:bg-gray-50 transition-colors ${member.is_blocked ? 'opacity-50' : ''}`}
                      >
                        <td className="px-5 py-4 font-medium text-gray-900 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${member.is_blocked ? 'bg-red-100 text-red-500' : 'bg-blue-100 text-blue-600'}`}>
                              {member.name.charAt(0)}
                            </div>
                            {member.name}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-gray-600 whitespace-nowrap font-mono text-xs">
                          {member.username || <span className="text-gray-400">-</span>}
                        </td>
                        <td className="px-5 py-4 text-gray-600 whitespace-nowrap">
                          {member.email || <span className="text-gray-400">미등록</span>}
                        </td>
                        <td className="px-5 py-4 text-gray-600 whitespace-nowrap">
                          {member.phone_number || <span className="text-gray-400">미등록</span>}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            member.role === 'admin'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {member.role === 'admin' ? '관리자' : '일반 교인'}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {groups.length === 0 ? (
                            <span className="text-gray-400 text-xs">없음</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {groups.map((g) => (
                                <span key={g.id} className="inline-block bg-indigo-50 text-indigo-600 text-xs px-2 py-0.5 rounded-md font-medium whitespace-nowrap">
                                  {g.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          {member.is_blocked ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-600">
                              🚫 차단됨
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
                              ✅ 정상
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-gray-500 whitespace-nowrap text-xs">
                          {new Date(member.created_at).toLocaleDateString('ko-KR', {
                            year: 'numeric', month: 'short', day: 'numeric',
                          })}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openEdit(member)}
                              className="px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                            >
                              수정
                            </button>
                            <button
                              onClick={() => handleToggleBlock(member)}
                              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                                member.is_blocked
                                  ? 'text-green-600 bg-green-50 hover:bg-green-100'
                                  : 'text-red-500 bg-red-50 hover:bg-red-100'
                              }`}
                            >
                              {member.is_blocked ? '차단 해제' : '차단'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* 수정 모달 */}
      {editTarget && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/40 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setEditTarget(null) }}
        >
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md mx-0 sm:mx-4 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">교인 정보 수정</h2>
              <button onClick={() => setEditTarget(null)} className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100">✕</button>
            </div>

            <p className="text-sm text-gray-500 -mt-2">아이디: <span className="font-mono font-medium text-gray-700">{editTarget.username}</span></p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  이메일 <span className="text-gray-400 font-normal">(선택)</span>
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder="you@example.com"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">휴대폰 번호</label>
                <input
                  type="text"
                  value={editForm.phone_number}
                  onChange={(e) => setEditForm({ ...editForm, phone_number: e.target.value })}
                  placeholder="010-0000-0000"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">권한</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="member">일반 교인</option>
                  <option value="admin">관리자</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setEditTarget(null)}
                className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !editForm.name.trim()}
                className="flex-1 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

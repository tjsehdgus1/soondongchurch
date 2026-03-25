'use client'

import { useState, useEffect } from 'react'

type Group = {
  id: number
  name: string
  description: string
  created_at: string
  member_count: number
}

type GroupMember = {
  id: number
  user_id: string
  profiles: {
    name: string
    email: string
  }
}

type Profile = {
  id: string
  name: string
  email: string
}

export default function AdminGroupsPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  // 멤버 관리 모달
  const [modalGroup, setModalGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<GroupMember[]>([])
  const [allProfiles, setAllProfiles] = useState<Profile[]>([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [memberLoading, setMemberLoading] = useState(false)
  const [memberError, setMemberError] = useState<string | null>(null)

  const fetchGroups = async () => {
    setLoading(true)
    setFetchError(null)
    try {
      const res = await fetch('/api/admin/groups')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? '소그룹 목록 조회 실패')
      setGroups(json.groups)
    } catch (e: unknown) {
      setFetchError(e instanceof Error ? e.message : '알 수 없는 오류')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGroups()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) return
    setFormLoading(true)
    try {
      const res = await fetch('/api/admin/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? '소그룹 생성 실패')
      setName('')
      setDescription('')
      fetchGroups()
    } catch (e: unknown) {
      alert('오류가 발생했습니다: ' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('이 소그룹을 삭제하시겠습니까?\n게시글과 멤버십이 모두 삭제됩니다.')) return
    try {
      const res = await fetch(`/api/admin/groups?id=${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? '삭제 실패')
      fetchGroups()
    } catch (e: unknown) {
      alert('삭제 중 오류: ' + (e instanceof Error ? e.message : String(e)))
    }
  }

  const openMemberModal = async (group: Group) => {
    setModalGroup(group)
    setMemberLoading(true)
    setMemberError(null)
    try {
      const [membersRes, profilesRes] = await Promise.all([
        fetch(`/api/admin/groups/members?group_id=${group.id}`),
        fetch('/api/admin/groups/members?all=1'),
      ])
      const [membersJson, profilesJson] = await Promise.all([
        membersRes.json(),
        profilesRes.json(),
      ])
      if (!membersRes.ok) throw new Error(membersJson.error ?? '멤버 목록 조회 실패')
      if (!profilesRes.ok) throw new Error(profilesJson.error ?? '교인 목록 조회 실패')
      setMembers(membersJson.members)
      setAllProfiles(profilesJson.profiles)
      setSelectedUserId('')
    } catch (e: unknown) {
      setMemberError(e instanceof Error ? e.message : '데이터 조회 실패')
    } finally {
      setMemberLoading(false)
    }
  }

  const handleAddMember = async () => {
    if (!selectedUserId || !modalGroup) return
    const already = members.some((m) => m.user_id === selectedUserId)
    if (already) {
      alert('이미 소속된 멤버입니다.')
      return
    }
    try {
      const res = await fetch('/api/admin/groups/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group_id: modalGroup.id, user_id: selectedUserId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? '멤버 추가 실패')
      setSelectedUserId('')
      await openMemberModal(modalGroup)
      fetchGroups()
    } catch (e: unknown) {
      alert('추가 중 오류: ' + (e instanceof Error ? e.message : String(e)))
    }
  }

  const handleRemoveMember = async (memberId: number) => {
    if (!confirm('이 멤버를 소그룹에서 제외하시겠습니까?')) return
    try {
      const res = await fetch(`/api/admin/groups/members?id=${memberId}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? '멤버 제거 실패')
      if (modalGroup) {
        await openMemberModal(modalGroup)
        fetchGroups()
      }
    } catch (e: unknown) {
      alert('삭제 중 오류: ' + (e instanceof Error ? e.message : String(e)))
    }
  }

  const availableProfiles = allProfiles.filter(
    (p) => !members.some((m) => m.user_id === p.id)
  )

  return (
    <div className="max-w-[1300px] mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">소그룹 관리</h1>
        <p className="mt-1 text-gray-500">소그룹을 만들고 교인을 배정합니다.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* 새 소그룹 폼 */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-blue-500">🏘️</span> 새 소그룹 만들기
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  그룹 이름 <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="예: 청년부, 구역 1조"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="소그룹 소개 (선택)"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-y"
                />
              </div>
              <button
                disabled={formLoading}
                type="submit"
                className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-sm"
              >
                {formLoading ? '생성 중...' : '소그룹 만들기'}
              </button>
            </form>
          </div>
        </div>

        {/* 그룹 목록 */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="p-12 text-center text-gray-500 bg-white rounded-2xl border border-gray-100">
              목록을 불러오는 중...
            </div>
          ) : fetchError ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-red-100">
              <p className="text-red-500 font-medium">데이터를 불러오지 못했습니다.</p>
              <p className="text-sm text-gray-400 mt-1">{fetchError}</p>
              <button onClick={fetchGroups} className="mt-4 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">
                다시 시도
              </button>
            </div>
          ) : groups.length === 0 ? (
            <div className="p-12 text-center text-gray-400 bg-white rounded-2xl border border-gray-100">
              생성된 소그룹이 없습니다.
            </div>
          ) : (
            <div className="space-y-4">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900">{group.name}</h3>
                      {group.description && (
                        <p className="text-sm text-gray-500 mt-1">{group.description}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        👥 멤버 {group.member_count}명
                      </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => openMemberModal(group)}
                        className="px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                      >
                        멤버 관리
                      </button>
                      <button
                        onClick={() => handleDelete(group.id)}
                        className="p-1.5 text-red-500 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
                        title="삭제"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 멤버 관리 모달 */}
      {modalGroup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setModalGroup(null) }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {modalGroup.name} — 멤버 관리
              </h2>
              <button
                onClick={() => setModalGroup(null)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            {memberError ? (
              <div className="py-6 text-center">
                <p className="text-red-500 text-sm">{memberError}</p>
                <button
                  onClick={() => openMemberModal(modalGroup)}
                  className="mt-3 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
                >
                  다시 시도
                </button>
              </div>
            ) : (
              <>
                {/* 멤버 추가 */}
                <div className="flex gap-2">
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">교인 선택...</option>
                    {availableProfiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.email})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleAddMember}
                    disabled={!selectedUserId}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition-colors"
                  >
                    추가
                  </button>
                </div>

                {/* 현재 멤버 목록 */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    현재 멤버 ({members.length}명)
                  </p>
                  {memberLoading ? (
                    <p className="text-sm text-gray-400 py-4 text-center">불러오는 중...</p>
                  ) : members.length === 0 ? (
                    <p className="text-sm text-gray-400 py-4 text-center">
                      소속된 멤버가 없습니다.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {members.map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg"
                        >
                          <div>
                            <span className="text-sm font-medium text-gray-800">
                              {m.profiles.name}
                            </span>
                            <span className="text-xs text-gray-400 ml-2">{m.profiles.email}</span>
                          </div>
                          <button
                            onClick={() => handleRemoveMember(m.id)}
                            className="text-red-400 hover:text-red-600 text-sm px-2 py-0.5 rounded hover:bg-red-50 transition-colors"
                          >
                            제거
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

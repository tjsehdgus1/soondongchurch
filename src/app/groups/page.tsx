'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type GroupRow = {
  id: number
  name: string
  description: string
  member_count: number
}

export default function GroupsPage() {
  const [myGroups, setMyGroups] = useState<GroupRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          setLoggedIn(false)
          return
        }
        setLoggedIn(true)

        // 1단계: 내가 속한 group_id 목록 조회
        const { data: memberships, error: mErr } = await supabase
          .from('group_members')
          .select('group_id')
          .eq('user_id', user.id)

        if (mErr) throw new Error('멤버십 조회 실패: ' + mErr.message)
        if (!memberships || memberships.length === 0) {
          setMyGroups([])
          return
        }

        const groupIds = memberships.map((m: any) => m.group_id)

        // 2단계: 해당 그룹 정보 조회
        const { data: groupData, error: gErr } = await supabase
          .from('groups')
          .select('id, name, description')
          .in('id', groupIds)
          .order('name')

        if (gErr) throw new Error('그룹 정보 조회 실패: ' + gErr.message)

        // 3단계: 각 그룹의 멤버 수
        const withCount = await Promise.all(
          (groupData ?? []).map(async (g: any) => {
            const { count } = await supabase
              .from('group_members')
              .select('*', { count: 'exact', head: true })
              .eq('group_id', g.id)
            return { ...g, member_count: count ?? 0 }
          })
        )

        setMyGroups(withCount as GroupRow[])
      } catch (e: any) {
        console.error('소그룹 페이지 오류:', e)
        setError(e.message ?? '데이터를 불러오는 중 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [])

  return (
    <main className="min-h-screen bg-gray-50 pt-20 pb-16">
      <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">내 소그룹</h1>
          <p className="mt-2 text-gray-500">소속된 소그룹 게시판을 확인하세요.</p>
        </div>

        {loading ? (
          <div className="py-24 text-center text-gray-400">불러오는 중...</div>
        ) : error ? (
          <div className="py-24 text-center bg-white rounded-2xl border border-red-100 shadow-sm">
            <p className="text-red-500 mb-2">오류가 발생했습니다.</p>
            <p className="text-sm text-gray-400">{error}</p>
          </div>
        ) : loggedIn === false ? (
          <div className="py-24 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-gray-500 mb-4">로그인 후 소그룹을 확인할 수 있습니다.</p>
            <Link
              href="/auth/login"
              className="inline-block px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              로그인
            </Link>
          </div>
        ) : myGroups.length === 0 ? (
          <div className="py-24 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-gray-400">소속된 소그룹이 없습니다.</p>
            <p className="text-sm text-gray-400 mt-1">관리자에게 문의하세요.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {myGroups.map((g) => (
              <Link
                key={g.id}
                href={`/groups/${g.id}`}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md hover:border-blue-100 transition-all group"
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl">🏘️</span>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold text-gray-900 group-hover:text-blue-700 transition-colors truncate">
                      {g.name}
                    </h2>
                    {g.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{g.description}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-3">👥 멤버 {g.member_count}명</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

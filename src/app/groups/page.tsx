'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type GroupRow = {
  id: number
  name: string
  description: string
}

export default function GroupsPage() {
  const supabase = createClient()
  const [myGroups, setMyGroups] = useState<GroupRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          setLoggedIn(false)
          return
        }
        setLoggedIn(true)

        const { data: memberships, error: mErr } = await supabase
          .from('group_members')
          .select('group_id')
          .eq('user_id', user.id)

        if (mErr) throw new Error('멤버십 조회 실패: ' + mErr.message)
        if (!memberships || memberships.length === 0) {
          setMyGroups([])
          return
        }

        const groupIds = memberships.map((m: { group_id: number }) => m.group_id)

        const { data: groupData, error: gErr } = await supabase
          .from('groups')
          .select('id, name, description')
          .in('id', groupIds)
          .order('name')

        if (gErr) throw new Error('그룹 정보 조회 실패: ' + gErr.message)

        setMyGroups((groupData ?? []) as GroupRow[])
      } catch (e: unknown) {
        console.error('소그룹 페이지 오류:', e)
        setError(e instanceof Error ? e.message : '데이터를 불러오는 중 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }

    init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen" style={{ background: '#FAF8F5' }}>
      {/* 헤더 */}
      <div className="bg-white border-b" style={{ borderColor: '#E8E4DE' }}>
        <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <span className="font-semibold text-sm uppercase tracking-wider" style={{ color: '#B8860B' }}>Community</span>
          <h1 className="text-3xl md:text-4xl font-bold mt-2" style={{ color: '#2D2A26', fontFamily: 'var(--font-serif)' }}>소그룹</h1>
          <p className="mt-2" style={{ color: '#8B7355' }}>소속된 소그룹 게시판을 확인하세요.</p>
        </div>
      </div>

      <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loading ? (
          <div className="py-24 text-center" style={{ color: '#A09890' }}>불러오는 중...</div>
        ) : error ? (
          <div className="py-24 text-center bg-white rounded-2xl border shadow-sm" style={{ borderColor: '#E8E4DE' }}>
            <p className="text-red-500 mb-2">오류가 발생했습니다.</p>
            <p className="text-sm" style={{ color: '#A09890' }}>{error}</p>
          </div>
        ) : loggedIn === false ? (
          <div className="py-24 text-center bg-white rounded-2xl border shadow-sm" style={{ borderColor: '#E8E4DE' }}>
            <p className="mb-4" style={{ color: '#8B7355' }}>로그인 후 소그룹을 확인할 수 있습니다.</p>
            <Link
              href="/auth/login"
              className="inline-block px-6 py-2.5 text-white text-sm font-semibold rounded-xl transition-colors"
              style={{ background: '#B8860B' }}
            >
              로그인
            </Link>
          </div>
        ) : myGroups.length === 0 ? (
          <div className="py-24 text-center bg-white rounded-2xl border shadow-sm" style={{ borderColor: '#E8E4DE' }}>
            <p style={{ color: '#8B7355' }}>소속된 소그룹이 없습니다.</p>
            <p className="text-sm mt-1" style={{ color: '#A09890' }}>관리자에게 문의하세요.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {myGroups.map((g) => (
              <Link
                key={g.id}
                href={`/groups/${g.id}`}
                className="bg-white rounded-2xl border shadow-sm p-6 hover:shadow-md transition-all group"
                style={{ borderColor: '#E8E4DE' }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#B8860B1A' }}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#B8860B' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold truncate transition-colors" style={{ color: '#2D2A26', fontFamily: 'var(--font-serif)' }}>
                      {g.name}
                    </h2>
                    {g.description && (
                      <p className="text-sm mt-1 line-clamp-2" style={{ color: '#8B7355' }}>{g.description}</p>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex items-center text-xs font-semibold gap-1" style={{ color: '#B8860B' }}>
                  게시판 보기
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

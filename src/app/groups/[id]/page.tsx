'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

type Group = { id: number; name: string; description: string }
type Post = {
  id: number
  title: string
  content: string
  author_id: string | null
  author_name: string
  created_at: string
  image_url: string | null
}

export default function GroupBoardPage() {
  const { id } = useParams<{ id: string }>()
  const groupId = Number(id)
  const supabase = createClient()

  const [group, setGroup] = useState<Group | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [access, setAccess] = useState<'checking' | 'allowed' | 'denied' | 'notLoggedIn' | 'error'>('checking')

  const fetchAll = useCallback(async () => {
    const [{ data: groupData }, { data: postData }] = await Promise.all([
      supabase.from('groups').select('id, name, description').eq('id', groupId).single(),
      supabase.from('group_posts').select('*').eq('group_id', groupId).order('created_at', { ascending: false }),
    ])
    if (groupData) setGroup(groupData as Group)
    if (postData) setPosts(postData as Post[])
  }, [groupId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          setAccess('notLoggedIn')
          setLoading(false)
          return
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        const admin = profile?.role === 'admin'

        if (!admin) {
          const { data: membership } = await supabase
            .from('group_members')
            .select('id')
            .eq('group_id', groupId)
            .eq('user_id', user.id)
            .maybeSingle()

          if (!membership) {
            setAccess('denied')
            setLoading(false)
            return
          }
        }

        setAccess('allowed')
        await fetchAll()
      } catch (e) {
        console.error('그룹 게시판 오류:', e)
        setAccess('error')
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [groupId, fetchAll]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#FAF8F5' }}>
        <p style={{ color: '#A09890' }}>불러오는 중...</p>
      </div>
    )
  }

  if (access === 'notLoggedIn') {
    return (
      <div className="min-h-screen" style={{ background: '#FAF8F5' }}>
        <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <p className="mb-4" style={{ color: '#8B7355' }}>로그인 후 소그룹 게시판을 이용할 수 있습니다.</p>
          <Link href="/auth/login" className="inline-block px-6 py-2.5 text-white text-sm font-semibold rounded-xl transition-colors" style={{ background: '#B8860B' }}>
            로그인
          </Link>
        </div>
      </div>
    )
  }

  if (access === 'denied') {
    return (
      <div className="min-h-screen" style={{ background: '#FAF8F5' }}>
        <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <p className="mb-2" style={{ color: '#8B7355' }}>이 소그룹에 소속되어 있지 않습니다.</p>
          <p className="text-sm mb-6" style={{ color: '#A09890' }}>관리자에게 문의하세요.</p>
          <Link href="/groups" className="inline-block px-6 py-2.5 text-sm font-medium rounded-xl border transition-colors" style={{ background: '#FAF8F5', color: '#5C5650', borderColor: '#E8E4DE' }}>
            내 소그룹으로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  if (access === 'error') {
    return (
      <div className="min-h-screen" style={{ background: '#FAF8F5' }}>
        <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <p className="text-red-500 mb-4">데이터를 불러오는 중 오류가 발생했습니다.</p>
          <Link href="/groups" className="inline-block px-6 py-2.5 text-sm font-medium rounded-xl border transition-colors" style={{ background: '#FAF8F5', color: '#5C5650', borderColor: '#E8E4DE' }}>
            돌아가기
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#FAF8F5' }}>
      {/* 헤더 */}
      <div className="bg-white border-b" style={{ borderColor: '#E8E4DE' }}>
        <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Link href="/groups" className="text-sm font-medium transition-colors" style={{ color: '#B8860B' }}>
            ← 소그룹 목록
          </Link>
          <h1 className="text-3xl font-bold mt-3" style={{ color: '#2D2A26', fontFamily: 'var(--font-serif)' }}>{group?.name}</h1>
          {group?.description && (
            <p className="mt-1" style={{ color: '#8B7355' }}>{group.description}</p>
          )}
        </div>
      </div>

      <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 글쓰기 버튼 */}
        <div className="flex justify-end mb-5">
          <Link
            href={`/groups/${groupId}/new`}
            className="flex items-center gap-2 px-5 py-2.5 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
            style={{ background: '#B8860B' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            글쓰기
          </Link>
        </div>

        {/* 게시글 목록 */}
        {posts.length === 0 ? (
          <div className="py-24 text-center bg-white rounded-2xl border shadow-sm" style={{ borderColor: '#E8E4DE' }}>
            <p style={{ color: '#8B7355' }}>아직 게시글이 없습니다.</p>
            <p className="text-sm mt-1" style={{ color: '#A09890' }}>첫 번째 글을 작성해보세요!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/groups/${groupId}/posts/${post.id}`}
                className="block bg-white rounded-2xl shadow-sm border px-6 py-4 hover:shadow-md transition-all"
                style={{ borderColor: '#E8E4DE' }}
              >
                <div className="flex items-center gap-4">
                  {post.image_url && (
                    <img
                      src={post.image_url}
                      alt=""
                      className="w-16 h-16 rounded-xl object-cover flex-shrink-0 border"
                      style={{ borderColor: '#E8E4DE' }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold truncate" style={{ color: '#2D2A26' }}>{post.title}</h3>
                    <p className="text-sm mt-0.5 line-clamp-1" style={{ color: '#8B7355' }}>{stripHtml(post.content)}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs" style={{ color: '#A09890' }}>
                      <span>{post.author_name}</span>
                      <span>{new Date(post.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                  </div>
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#C8C2B8' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
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

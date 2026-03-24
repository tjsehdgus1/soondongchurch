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

  const [group, setGroup] = useState<Group | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [access, setAccess] = useState<'checking' | 'allowed' | 'denied' | 'notLoggedIn' | 'error'>('checking')

  const fetchAll = useCallback(async (supabase: ReturnType<typeof createClient>) => {
    const [{ data: groupData }, { data: postData }] = await Promise.all([
      supabase.from('groups').select('id, name, description').eq('id', groupId).single(),
      supabase.from('group_posts').select('*').eq('group_id', groupId).order('created_at', { ascending: false }),
    ])
    if (groupData) setGroup(groupData as Group)
    if (postData) setPosts(postData as Post[])
  }, [groupId])

  useEffect(() => {
    const supabase = createClient()

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
        await fetchAll(supabase)
      } catch (e) {
        console.error('그룹 게시판 오류:', e)
        setAccess('error')
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [groupId, fetchAll])

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 pt-20 pb-16 flex items-center justify-center">
        <p className="text-gray-400">불러오는 중...</p>
      </main>
    )
  }

  if (access === 'notLoggedIn') {
    return (
      <main className="min-h-screen bg-gray-50 pt-20 pb-16">
        <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <p className="text-gray-500 mb-4">로그인 후 소그룹 게시판을 이용할 수 있습니다.</p>
          <Link href="/auth/login" className="inline-block px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
            로그인
          </Link>
        </div>
      </main>
    )
  }

  if (access === 'denied') {
    return (
      <main className="min-h-screen bg-gray-50 pt-20 pb-16">
        <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <p className="text-gray-500 mb-2">이 소그룹에 소속되어 있지 않습니다.</p>
          <p className="text-sm text-gray-400 mb-6">관리자에게 문의하세요.</p>
          <Link href="/groups" className="inline-block px-6 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors">
            내 소그룹으로 돌아가기
          </Link>
        </div>
      </main>
    )
  }

  if (access === 'error') {
    return (
      <main className="min-h-screen bg-gray-50 pt-20 pb-16">
        <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <p className="text-red-500 mb-2">데이터를 불러오는 중 오류가 발생했습니다.</p>
          <Link href="/groups" className="inline-block mt-4 px-6 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors">
            돌아가기
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 pt-20 pb-16">
      <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <Link href="/groups" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
              ← 내 소그룹
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mt-2">{group?.name}</h1>
            {group?.description && (
              <p className="mt-1 text-gray-500">{group.description}</p>
            )}
          </div>
          <Link
            href={`/groups/${groupId}/new`}
            className="mt-7 flex-shrink-0 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
          >
            ✍️ 글쓰기
          </Link>
        </div>

        {/* 게시글 목록 */}
        {posts.length === 0 ? (
          <div className="py-24 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-gray-400">아직 게시글이 없습니다.</p>
            <p className="text-sm text-gray-400 mt-1">첫 번째 글을 작성해보세요!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/groups/${groupId}/posts/${post.id}`}
                className="block bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-4 hover:shadow-md hover:border-indigo-100 transition-all"
              >
                <div className="flex items-center gap-4">
                  {post.image_url && (
                    <img
                      src={post.image_url}
                      alt=""
                      className="w-16 h-16 rounded-xl object-cover flex-shrink-0 border border-gray-100"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-gray-900 truncate">{post.title}</h3>
                    <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{stripHtml(post.content)}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                      <span>👤 {post.author_name}</span>
                      <span>{new Date(post.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                  </div>
                  <span className="text-gray-300 flex-shrink-0 text-lg">›</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

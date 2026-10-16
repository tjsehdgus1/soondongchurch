import type { MetadataRoute } from 'next'
import { createPublicClient } from '@/lib/supabase/public'
import { SITE_URL } from '@/lib/site'

export const revalidate = 3600 // 1시간마다 새 글 반영

// 검색엔진에 알려 줄 주소 목록: 메뉴 화면 + 공개 게시글(메뉴에 있는 게시판) + 공지 + 주보
const STATIC: { path: string, priority: number, changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
    { path: '/', priority: 1, changeFrequency: 'weekly' },
    { path: '/worship', priority: 0.9, changeFrequency: 'monthly' },
    { path: '/directions', priority: 0.9, changeFrequency: 'yearly' },
    { path: '/about', priority: 0.8, changeFrequency: 'yearly' },
    { path: '/about/history', priority: 0.7, changeFrequency: 'yearly' },
    { path: '/about/people', priority: 0.6, changeFrequency: 'yearly' },
    { path: '/sermons', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/praise', priority: 0.6, changeFrequency: 'weekly' },
    { path: '/next-gen', priority: 0.6, changeFrequency: 'weekly' },
    { path: '/mission', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/fellowship', priority: 0.5, changeFrequency: 'monthly' },
    { path: '/discipleship', priority: 0.5, changeFrequency: 'monthly' },
    { path: '/notices', priority: 0.7, changeFrequency: 'weekly' },
    { path: '/events', priority: 0.6, changeFrequency: 'weekly' },
    { path: '/bulletins', priority: 0.6, changeFrequency: 'weekly' },
    { path: '/board', priority: 0.5, changeFrequency: 'daily' },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const supabase = createPublicClient()
    const [{ data: posts }, { data: notices }, { data: bulletins }] = await Promise.all([
        // 회원 전용 글은 제외, 메뉴에서 숨긴 게시판(hub 없음)도 제외
        supabase.from('board_posts')
            .select('id, updated_at, boards!inner(slug, hub)')
            .eq('members_only', false).not('boards.hub', 'is', null)
            .order('created_at', { ascending: false }).limit(1000),
        supabase.from('notices').select('id, updated_at').order('created_at', { ascending: false }).limit(500),
        supabase.from('bulletins').select('id, bulletin_date').order('bulletin_date', { ascending: false }).limit(200),
    ])

    const now = new Date()
    return [
        ...STATIC.map(({ path, priority, changeFrequency }) => ({ url: `${SITE_URL}${path}`, lastModified: now, changeFrequency, priority })),
        ...(posts ?? []).map((p) => ({
            url: `${SITE_URL}/board/${(p.boards as unknown as { slug: string }).slug}/${p.id}`,
            lastModified: new Date(p.updated_at),
            priority: 0.5,
        })),
        ...(notices ?? []).map((n) => ({ url: `${SITE_URL}/notices/${n.id}`, lastModified: new Date(n.updated_at), priority: 0.4 })),
        ...(bulletins ?? []).map((b) => ({ url: `${SITE_URL}/bulletins/${b.id}`, lastModified: new Date(b.bulletin_date + 'T00:00:00+09:00'), priority: 0.3 })),
    ]
}

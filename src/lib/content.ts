// 콘텐츠 페이지 데이터 조회 (서버 컴포넌트 전용)
import { createClient } from '@/lib/supabase/server'
import { createPublicClient } from '@/lib/supabase/public'
import { getServiceClient } from '@/lib/admin'

export type PageBlock = {
    key: string
    title: string | null
    subtitle: string | null
    body: string | null
    image_url: string | null
}

export type TimelineItem = {
    id: number
    year: number
    date_label: string | null
    title: string
    description: string | null
    image_url: string | null
    sort_order: number
}

export type Person = {
    id: number
    category: string
    name: string
    role: string | null
    period: string | null
    photo_url: string | null
    members_only: boolean
    sort_order: number
}

export type MissionField = {
    id: number
    country: string
    region: string | null
    lat: number
    lng: number
    missionaries: string | null
    summary: string | null
    image_url: string | null
    board_slug: string | null
    category: string | null
    sort_order: number
}

// prefix 예: 'about' → { 'about.greeting': ..., 'about.vision': ... }
export async function getBlocks(prefix: string): Promise<Record<string, PageBlock>> {
    const { data } = await createPublicClient()
        .from('page_blocks')
        .select('key, title, subtitle, body, image_url')
        .like('key', `${prefix}.%`)
    return Object.fromEntries((data ?? []).map((b) => [b.key, b as PageBlock]))
}

export async function getBlock(key: string): Promise<PageBlock | null> {
    const { data } = await createPublicClient()
        .from('page_blocks')
        .select('key, title, subtitle, body, image_url')
        .eq('key', key)
        .maybeSingle()
    return (data as PageBlock | null) ?? null
}

export async function getTimeline(): Promise<TimelineItem[]> {
    const { data } = await createPublicClient()
        .from('timeline_items')
        .select('*')
        .order('year')
        .order('sort_order')
    return (data ?? []) as TimelineItem[]
}

// 회원 전용 항목은 RLS로 걸러짐. 비로그인일 때 숨겨진 구분 이름만 따로 알려줌 (이름·사진 비노출)
export async function getPeople(): Promise<{ items: Person[], hiddenCategories: string[] }> {
    const supabase = await createClient()
    const { data } = await supabase.from('people').select('*').order('sort_order')
    const items = (data ?? []) as Person[]

    const { data: isMember } = await supabase.rpc('is_active_member')
    if (isMember) return { items, hiddenCategories: [] }

    const { data: hidden } = await getServiceClient()
        .from('people')
        .select('category, sort_order')
        .eq('members_only', true)
        .order('sort_order')
    const hiddenCategories = [...new Set((hidden ?? []).map((p) => p.category as string))]
    return { items, hiddenCategories }
}

export async function getMissionFields(): Promise<MissionField[]> {
    const { data } = await createPublicClient()
        .from('mission_fields')
        .select('*')
        .order('sort_order')
    return (data ?? []) as MissionField[]
}

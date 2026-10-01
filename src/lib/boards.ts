import DOMPurify from 'isomorphic-dompurify'

export type Board = {
    id: number
    slug: string
    name: string
    section: string
    kind: 'list' | 'card'
    write_level: 'admin' | 'group' | 'member'
    group_id: number | null
    categories: string[]
    sort_order: number
}

export type BoardPostSummary = {
    id: number
    board_id: number
    title: string
    author_name: string
    category: string | null
    youtube_id: string | null
    thumbnail_url: string | null
    is_pinned: boolean
    members_only: boolean
    created_at: string
}

export const POST_SUMMARY_COLUMNS =
    'id, board_id, title, author_name, category, youtube_id, thumbnail_url, is_pinned, members_only, created_at'

// 상단 메뉴 순서 — boards.section 값과 일치해야 함
export const SECTION_ORDER = ['교회소개', '말씀', '예배·소식', '전도회', '교회학교', '선교·교육', '찬양', '커뮤니티']

export const PAGE_SIZE = 20

// 유튜브 URL 또는 11자리 ID → 영상 ID
export function parseYoutubeId(input: string): string | null {
    const value = input.trim()
    if (/^[\w-]{11}$/.test(value)) return value
    const match = value.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([\w-]{11})/)
    return match ? match[1] : null
}

export function postThumbnail(post: Pick<BoardPostSummary, 'thumbnail_url' | 'youtube_id'>): string | null {
    if (post.thumbnail_url) return post.thumbnail_url
    if (post.youtube_id) return `https://img.youtube.com/vi/${post.youtube_id}/hqdefault.jpg`
    return null
}

// 본문 첫 이미지 → 카드 대표 이미지
export function firstImageSrc(html: string): string | null {
    const match = html.match(/<img[^>]+src="([^"]+)"/)
    return match ? match[1] : null
}

export function sanitizePostHtml(html: string): string {
    return DOMPurify.sanitize(html)
}

// 서버(UTC)에서 렌더해도 한국 날짜로 표시
const KST_DATE = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
})

export function formatDate(dateStr: string) {
    const parts = Object.fromEntries(KST_DATE.formatToParts(new Date(dateStr)).map(p => [p.type, p.value]))
    return `${parts.year}.${parts.month}.${parts.day}`
}

// 허브: 여러 게시판을 탭으로 묶어 보여주는 화면 (boards.hub 값과 일치)

export type HubKey = 'sermons' | 'praise' | 'next-gen' | 'mission' | 'fellowship' | 'discipleship' | 'community'

export type Hub = {
    path: string
    title: string
    eyebrow: string
    // page_blocks 소개 문구 key
    introKey?: string
    // video: 영상 카드 위주, mixed: 사진·글 혼합
    kind: 'video' | 'mixed'
}

export const HUBS: Record<HubKey, Hub> = {
    sermons: { path: '/sermons', title: '말씀', eyebrow: 'Sermons', kind: 'video' },
    praise: { path: '/praise', title: '찬양', eyebrow: 'Praise', kind: 'video' },
    'next-gen': { path: '/next-gen', title: '다음세대', eyebrow: 'Next Generation', introKey: 'nextgen.intro', kind: 'mixed' },
    mission: { path: '/mission', title: '선교', eyebrow: 'Mission', introKey: 'mission.intro', kind: 'mixed' },
    fellowship: { path: '/fellowship', title: '전도회', eyebrow: 'Fellowship', introKey: 'fellowship.intro', kind: 'mixed' },
    discipleship: { path: '/discipleship', title: '양육', eyebrow: 'Discipleship', introKey: 'discipleship.intro', kind: 'mixed' },
    // 소식·나눔 게시판은 허브 화면 없이 각 게시판으로 바로 이동
    community: { path: '/board', title: '소식·나눔', eyebrow: 'Community', kind: 'mixed' },
}

export function isHubKey(value: string | null | undefined): value is HubKey {
    return !!value && value in HUBS
}

// 게시판 목록 주소: 허브 소속이면 허브 탭, 아니면 게시판 자체
export function hubPathForBoard(board: { slug: string, hub: string | null }): string {
    if (isHubKey(board.hub) && board.hub !== 'community') return `${HUBS[board.hub].path}?tab=${board.slug}`
    return `/board/${board.slug}`
}

// 리디자인 초기 데이터: 이관된 카페 '교회 소개' 글 → 콘텐츠 테이블
//
// 선행: supabase/20261001_redesign.sql 실행
// 실행: node --env-file=.env.local scripts/redesign-seed.mjs [--dry-run]
// 각 테이블이 비어 있을 때만 넣음 → 관리자가 수정한 내용은 다시 실행해도 보존

import { createClient } from '@supabase/supabase-js'
import { parsePastor, parseStaff, parseTimeline } from './lib/parse-about.mjs'

const DRY_RUN = process.argv.includes('--dry-run')

// 카페 원본 글 번호 (board_posts.cafe_article_id)
const ARTICLE = { history: 69, vision: 70, staff: 71, pastors: 75 }

const PAGE_BLOCKS = [
    { key: 'home.hero', title: '하나님이 기뻐하시는\n행복한 교회', subtitle: '하나님의 은혜 안에서 함께 성장하는 교회' },
    // 인사말 본문은 비워 둠 → 관리자가 넣으면 교회 소개 페이지에 표시
    { key: 'about.greeting', title: '순천순동교회에 오신 것을 환영합니다', subtitle: '1946년부터 순천과 함께한 교회' },
    { key: 'about.vision', title: '비전과 목표', subtitle: '하나님이 기뻐하시는 행복한 교회' },
    { key: 'worship.intro', title: '함께 드리는 예배', subtitle: '함께 드리는 예배는 가장 큰 기쁨입니다' },
    { key: 'nextgen.intro', title: '다음세대', subtitle: '말씀 안에서 자라나는 아이들과 청년들', body: '<p>유아 유치반부터 청년회까지, 각 부서 소식을 전합니다.</p>' },
    { key: 'mission.intro', title: '땅 끝까지 이르러', subtitle: '사도행전 1:8', body: '<p>순천에서 열방으로 — 순동교회가 함께하는 선교지와 선교 이야기입니다.</p>' },
    { key: 'fellowship.intro', title: '전도회', subtitle: '함께 섬기고 함께 나누는 공동체', body: '<p>백합전도회와 남·여전도회의 소식입니다.</p>' },
    { key: 'discipleship.intro', title: '양육', subtitle: '모든 성도가 제자가 되는 비전', body: '<p>새가족반과 제자대학을 통해 함께 자라갑니다.</p>' },
    { key: 'directions.guide', title: '오시는 길', subtitle: '전라남도 순천시 남신월 4길 3-13' },
]

const MISSION_FIELDS = [
    { country: '캄보디아', region: '깜퐁츠낭', lat: 12.25, lng: 104.67, missionaries: '김영대 · 조정아 선교사', summary: '단기선교 1~4차와 교회 건축을 함께한 선교지입니다.', board_slug: 'mission-trip', sort_order: 1 },
    { country: '태국', region: '방콕', lat: 13.75, lng: 100.5, missionaries: null, summary: null, board_slug: 'mission-news', sort_order: 2 },
    { country: '튀르키예', region: '이스탄불', lat: 41.01, lng: 28.98, missionaries: null, summary: null, board_slug: 'mission-news', sort_order: 3 },
    { country: '탄자니아', region: '잔지바르', lat: -6.16, lng: 39.19, missionaries: '오영금 선교사', summary: null, board_slug: 'mission-news', sort_order: 4 },
]

function requireEnv(name) {
    const value = process.env[name]
    if (!value) throw new Error(`환경변수 ${name} 가 없습니다. --env-file=.env.local 로 실행하세요.`)
    return value
}

async function main() {
    const supabase = createClient(requireEnv('NEXT_PUBLIC_SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'))

    const { data: posts, error } = await supabase
        .from('board_posts')
        .select('cafe_article_id, content')
        .in('cafe_article_id', Object.values(ARTICLE))
    if (error) throw error
    const contentOf = (id) => {
        const post = posts.find((p) => p.cafe_article_id === id)
        if (!post) throw new Error(`카페 글 ${id} 가 board_posts 에 없습니다. cafe-import 를 먼저 실행하세요.`)
        return post.content
    }

    const timeline = parseTimeline(contentOf(ARTICLE.history))
    const people = [
        ...parsePastor(contentOf(ARTICLE.pastors)),
        ...parseStaff(contentOf(ARTICLE.staff)).map(({ photo_src, ...p }) => ({ ...p, photo_url: photo_src })),
    ].map((p, i) => ({ ...p, sort_order: i }))
    const blocks = PAGE_BLOCKS.map((b) => (b.key === 'about.vision' ? { ...b, body: contentOf(ARTICLE.vision) } : b))

    const plan = [
        ['page_blocks', blocks],
        ['timeline_items', timeline],
        ['people', people],
        ['mission_fields', MISSION_FIELDS],
    ]

    for (const [table, rows] of plan) {
        if (DRY_RUN) {
            console.log(`[dry-run] ${table}: ${rows.length}건`, rows.slice(0, 2))
            continue
        }
        const { count, error: countError } = await supabase.from(table).select('*', { count: 'exact', head: true })
        if (countError) throw new Error(`${table} 조회 실패: ${countError.message} (20261001_redesign.sql 실행 여부 확인)`)
        if (count) {
            console.log(`- ${table}: 이미 ${count}건 있음 → 건너뜀`)
            continue
        }
        const { error: insertError } = await supabase.from(table).insert(rows)
        if (insertError) throw new Error(`${table} 저장 실패: ${insertError.message}`)
        console.log(`✓ ${table}: ${rows.length}건`)
    }
}

main().catch((err) => {
    console.error('시드 실패:', err.message)
    process.exit(1)
})

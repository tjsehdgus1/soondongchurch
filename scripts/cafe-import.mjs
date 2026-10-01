// 네이버 카페 내보내기(scsdc-cafe-export) → Supabase 게시판 이관
//
// 선행: supabase/20261001_boards.sql 실행 (boards 초기 데이터, 버킷 생성)
// 실행: node --env-file=.env.local scripts/cafe-import.mjs [--dry-run] [내보내기 폴더]
//   --dry-run  업로드·DB 저장 없이 이관 계획만 출력
// 여러 번 실행해도 안전: 이미지는 같은 경로에 덮어쓰고, 글은 cafe_article_id 기준 upsert

import { readFileSync } from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { createClient } from '@supabase/supabase-js'

const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const EXPORT_DIR = path.resolve(args.find((a) => !a.startsWith('--')) ?? 'scsdc-cafe-export')

// 카페 menuId → 홈페이지 게시판 slug (간증 3개는 말머리로 통합)
const MENU_TO_BOARD = {
    46: { slug: 'about' },
    1: { slug: 'free' },
    12: { slug: 'baekhap' },
    2: { slug: 'men-1' }, 3: { slug: 'men-2' }, 4: { slug: 'men-3' },
    5: { slug: 'women-1' }, 6: { slug: 'women-2' }, 7: { slug: 'women-3' },
    8: { slug: 'kids' }, 9: { slug: 'sunday-school' }, 10: { slug: 'youth' }, 11: { slug: 'young-adults' },
    15: { slug: 'mission-trip' }, 16: { slug: 'mission-news' }, 30: { slug: 'missionary-sermon' },
    28: { slug: 'newcomers' }, 13: { slug: 'discipleship' },
    24: { slug: 'sermon-senior' }, 26: { slug: 'sermon-associate' }, 25: { slug: 'sermon-guest' }, 29: { slug: 'sermon-festival' },
    38: { slug: 'praise-coramdeo' }, 39: { slug: 'praise-neul' }, 40: { slug: 'praise-special' },
    32: { slug: 'testimony', category: '제자대학 간증' },
    33: { slug: 'testimony', category: '단기선교 간증' },
    34: { slug: 'testimony', category: '기타 간증' },
    41: { slug: 'events-gallery' },
}

// 네이버 자동 생성 환영글 (본문 없음)
const SKIP_ARTICLES = new Set([1])
// 교인 사진이 들어 있어 로그인 회원만 보는 글 → 이미지도 비공개 버킷
const MEMBERS_ONLY_ARTICLES = new Set([71])

const MAX_DIM = 1920

function requireEnv(name) {
    const value = process.env[name]
    if (!value) throw new Error(`환경변수 ${name} 가 없습니다. --env-file=.env.local 로 실행하세요.`)
    return value
}

// 본문의 유튜브 임베드·주소 단락 제거 → youtube_id 컬럼으로 상세 화면 상단에 표시
function stripVideos(html) {
    return html
        .replace(/<figure class="video">[\s\S]*?<\/figure>/g, '')
        .replace(/<p>\s*https?:\/\/(?:www\.|m\.)?(?:youtube\.com|youtu\.be)\/[^<\s]*\s*<\/p>/g, '')
        .trim()
}

async function main() {
    const posts = JSON.parse(readFileSync(path.join(EXPORT_DIR, 'posts.json'), 'utf8'))
    const supabase = DRY_RUN ? null : createClient(requireEnv('NEXT_PUBLIC_SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'))

    let boardIdBySlug = new Map()
    if (supabase) {
        const { data: boards, error } = await supabase.from('boards').select('id, slug')
        if (error) throw error
        boardIdBySlug = new Map(boards.map((b) => [b.slug, b.id]))
    }

    const summary = {}
    let imageBytesBefore = 0
    let imageBytesAfter = 0

    for (const post of posts) {
        if (SKIP_ARTICLES.has(post.articleId)) {
            console.log(`- 건너뜀 #${post.articleId} ${post.title}`)
            continue
        }
        const target = MENU_TO_BOARD[post.boardId]
        if (!target) throw new Error(`매핑 없는 게시판: ${post.boardId} ${post.boardName}`)
        const boardId = supabase ? boardIdBySlug.get(target.slug) : 0
        if (supabase && !boardId) throw new Error(`boards 에 '${target.slug}' 가 없습니다. 20261001_boards.sql 을 먼저 실행하세요.`)

        const membersOnly = MEMBERS_ONLY_ARTICLES.has(post.articleId)
        const bucket = membersOnly ? 'board-private' : 'board-images'
        let content = stripVideos(post.bodyHtml)
        let thumbnail = null

        for (const image of post.images) {
            const original = readFileSync(path.join(EXPORT_DIR, image.file))
            const resized = await sharp(original)
                .rotate() // EXIF 회전 반영
                .resize({ width: MAX_DIM, height: MAX_DIM, fit: 'inside', withoutEnlargement: true })
                .webp({ quality: 82 })
                .toBuffer()
            imageBytesBefore += original.length
            imageBytesAfter += resized.length

            const storagePath = `cafe/${post.articleId}/${path.parse(image.file).name}.webp`
            let url = `/api/board-images/${storagePath}`
            if (supabase) {
                const { error } = await supabase.storage.from(bucket)
                    .upload(storagePath, resized, { contentType: 'image/webp', upsert: true })
                if (error) throw new Error(`이미지 업로드 실패 ${image.file}: ${error.message}`)
                if (!membersOnly) url = supabase.storage.from(bucket).getPublicUrl(storagePath).data.publicUrl
            }
            content = content.split(`src="${image.file}"`).join(`src="${url}"`)
            thumbnail ??= url
        }

        const row = {
            cafe_article_id: post.articleId,
            board_id: boardId,
            author_name: post.writer,
            category: target.category ?? null,
            title: post.title,
            content,
            youtube_id: post.videos[0]?.youtubeId ?? null,
            thumbnail_url: thumbnail,
            members_only: membersOnly,
            created_at: post.createdAt,
            updated_at: post.createdAt,
        }

        if (supabase) {
            const { error } = await supabase.from('board_posts').upsert(row, { onConflict: 'cafe_article_id' })
            if (error) throw new Error(`글 저장 실패 #${post.articleId}: ${error.message}`)
        }

        summary[target.slug] = (summary[target.slug] ?? 0) + 1
        console.log(`✓ #${post.articleId} → ${target.slug}${membersOnly ? ' (회원 전용)' : ''} | ${post.title} | 이미지 ${post.images.length}${row.youtube_id ? ' | 영상' : ''}`)
    }

    const mb = (n) => (n / 1024 / 1024).toFixed(1)
    console.log('\n게시판별 이관 수:', summary)
    console.log(`총 ${Object.values(summary).reduce((a, b) => a + b, 0)}건, 이미지 ${mb(imageBytesBefore)}MB → ${mb(imageBytesAfter)}MB`)
    if (DRY_RUN) console.log('(--dry-run: 업로드·저장하지 않았습니다)')
}

main().catch((err) => {
    console.error('이관 실패:', err.message)
    process.exit(1)
})

import type { Metadata } from 'next'
import { SITE_NAME } from '@/lib/site'

interface PageMetaOptions {
    title: string
    description: string
    // 대표 주소 (쿼리 없이, 예: '/sermons') — 검색엔진이 같은 내용의 여러 주소를 하나로 묶음
    path: string
    // 공유 미리보기 사진 (없으면 /og.jpg)
    image?: string | null
    // 검색 결과에서 빼기 (로그인·관리·글쓰기 화면, 회원 전용 글)
    noindex?: boolean
}

// 페이지별 검색·공유 정보 — Next.js는 페이지 제목으로 공유 카드 제목을 만들지 않으므로 함께 지정
export function pageMetadata({ title, description, path, image, noindex }: PageMetaOptions): Metadata {
    const fullTitle = `${title} | ${SITE_NAME}`
    const images = image ? [{ url: image }] : [{ url: '/og.jpg', width: 1200, height: 630 }]
    return {
        title,
        description,
        alternates: { canonical: path },
        openGraph: { type: 'website', locale: 'ko_KR', siteName: SITE_NAME, title: fullTitle, description, url: path, images },
        twitter: { card: 'summary_large_image', title: fullTitle, description, images: images.map((i) => i.url) },
        ...(noindex ? { robots: { index: false, follow: false } } : {}),
    }
}

export const NOINDEX: Metadata = { robots: { index: false, follow: false } }

import type { NextConfig } from "next";
import path from "path";

const securityHeaders = [
    // 클릭재킹 방지
    { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
    // MIME 스니핑 방지
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    // XSS 필터 활성화 (구형 브라우저용)
    { key: 'X-XSS-Protection', value: '1; mode=block' },
    // Referrer 정보 제한
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    // HTTPS 강제 (1년, 서브도메인 포함)
    { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
    // 불필요한 브라우저 기능 차단
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]

const nextConfig: NextConfig = {
    // 페이지 전환 크로스페이드 (layout.tsx의 <ViewTransition>)
    experimental: {
        viewTransition: true,
    },
    turbopack: {
        resolveAlias: {
            canvas: path.resolve('./src/lib/empty-module.js'),
        },
    },
    webpack: (config) => {
        config.resolve.alias.canvas = false
        return config
    },
    // 허브로 옮긴 게시판 목록 → 허브 탭 (글 상세 /board/[slug]/[id] 는 그대로)
    async redirects() {
        const hubBoards: Record<string, string> = {
            'sermon-senior': '/sermons', 'sermon-associate': '/sermons', 'sermon-guest': '/sermons',
            'sermon-festival': '/sermons', 'missionary-sermon': '/sermons',
            'praise-coramdeo': '/praise', 'praise-neul': '/praise', 'praise-special': '/praise',
            kids: '/next-gen', 'sunday-school': '/next-gen', youth: '/next-gen', 'young-adults': '/next-gen',
            'mission-trip': '/mission', 'mission-news': '/mission',
            baekhap: '/fellowship', 'men-1': '/fellowship', 'men-2': '/fellowship', 'men-3': '/fellowship',
            'women-1': '/fellowship', 'women-2': '/fellowship', 'women-3': '/fellowship',
            discipleship: '/discipleship', newcomers: '/discipleship',
        }
        return [
            { source: '/board/about', destination: '/about', permanent: true },
            { source: '/board/about/:id', destination: '/about', permanent: true },
            ...Object.entries(hubBoards).map(([slug, path]) => ({
                source: `/board/${slug}`,
                destination: `${path}?tab=${slug}`,
                permanent: true,
            })),
        ]
    },
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: securityHeaders,
            },
        ]
    },
}

export default nextConfig;

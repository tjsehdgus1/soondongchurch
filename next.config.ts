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
    // 교회 소개 게시판 → 콘텐츠 페이지 (허브 소속 게시판은 /board/[slug] 페이지에서 허브 탭으로 이동)
    async redirects() {
        return [
            { source: '/board/about', destination: '/about', permanent: true },
            { source: '/board/about/:id', destination: '/about', permanent: true },
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

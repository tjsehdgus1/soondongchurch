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
    turbopack: {
        resolveAlias: {
            canvas: path.resolve('./src/lib/empty-module.js'),
        },
    },
    webpack: (config) => {
        config.resolve.alias.canvas = false
        return config
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

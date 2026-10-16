import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

// 검색엔진 안내: 관리·로그인·내 정보·API는 수집하지 않음
export default function robots(): MetadataRoute.Robots {
    return {
        rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/auth', '/account', '/api/'] }],
        sitemap: `${SITE_URL}/sitemap.xml`,
        host: SITE_URL,
    }
}

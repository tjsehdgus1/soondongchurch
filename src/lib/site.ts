// 사이트 주소·교회 기본 정보 — 검색(SEO)·공유 미리보기·구조화 데이터 공통
// 도메인을 바꾸면 Vercel 환경변수 NEXT_PUBLIC_SITE_URL 하나만 바꾸면 됨 (끝에 / 없이, 예: https://soondong.church)

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://church.seonso.com').replace(/\/+$/, '')
export const SITE_NAME = '순천순동교회'
export const SITE_TAGLINE = '하나님이 기뻐하시는 행복한 교회'
export const SITE_DESCRIPTION =
    '1946년부터 순천과 함께한 순천순동교회입니다. 주일·수요·금요·새벽 예배 시간과 오시는 길, 말씀·찬양 영상, 다음세대와 선교 소식을 전합니다.'

export const CHURCH = {
    telephone: '+82-61-721-6707',
    faxNumber: '+82-61-725-3927',
    streetAddress: '남신월4길 3-13',
    addressLocality: '순천시',
    addressRegion: '전라남도',
    addressCountry: 'KR',
    youtube: 'https://www.youtube.com/@%EC%88%9C%EC%B2%9C%EC%88%9C%EB%8F%99%EA%B5%90%ED%9A%8C',
} as const

// 검색 결과·공유 미리보기에 쓰는 요약: 태그·공백 정리 후 자르기 — tests/site.test.ts
export function summarize(html: string | null | undefined, max = 120): string {
    const text = (html ?? '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim()
    return text.length > max ? text.slice(0, max - 1).trimEnd() + '…' : text
}

// 구글이 교회로 알아보도록 하는 구조화 데이터 (홈에 넣음)
export function churchJsonLd() {
    return {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'Church',
                '@id': `${SITE_URL}/#church`,
                name: SITE_NAME,
                alternateName: ['순동교회', 'Suncheon Sundong Church'],
                description: SITE_DESCRIPTION,
                slogan: SITE_TAGLINE,
                url: SITE_URL,
                logo: `${SITE_URL}/images/logo.svg`,
                image: `${SITE_URL}/og.jpg`,
                telephone: CHURCH.telephone,
                faxNumber: CHURCH.faxNumber,
                foundingDate: '1946-07-15',
                address: {
                    '@type': 'PostalAddress',
                    streetAddress: CHURCH.streetAddress,
                    addressLocality: CHURCH.addressLocality,
                    addressRegion: CHURCH.addressRegion,
                    addressCountry: CHURCH.addressCountry,
                },
                sameAs: [CHURCH.youtube],
            },
            {
                '@type': 'WebSite',
                '@id': `${SITE_URL}/#website`,
                name: SITE_NAME,
                url: SITE_URL,
                inLanguage: 'ko-KR',
                publisher: { '@id': `${SITE_URL}/#church` },
            },
        ],
    }
}

// 사진 갤러리 글: 본문의 사진들을 꺼내 넘겨 보는 슬라이드로 보여 주고, 나머지 글만 본문에 남김
// 입력은 sanitizeHtml을 거친 HTML (속성은 큰따옴표로 정리되어 있음) — tests/gallery.test.ts

export type GalleryImage = { src: string, alt: string, width?: number, height?: number }

const IMG = /<img\b[^>]*>/gi

function attr(tag: string, name: string): string | undefined {
    const match = tag.match(new RegExp(`\\s${name}="([^"]*)"`, 'i'))
    return match ? match[1] : undefined
}

function size(tag: string, name: string): number | undefined {
    const value = Number(attr(tag, name))
    return Number.isFinite(value) && value > 0 ? value : undefined
}

// 사진이 2장 이상일 때만 갤러리로 봄 (1장이면 본문 그대로)
export function splitGallery(html: string): { images: GalleryImage[], rest: string } | null {
    const tags = html.match(IMG) ?? []
    const images = tags
        .map((tag) => ({ src: attr(tag, 'src') ?? '', alt: attr(tag, 'alt') ?? '', width: size(tag, 'width'), height: size(tag, 'height') }))
        .filter((img) => img.src)
    if (images.length < 2) return null

    const rest = html
        .replace(IMG, '')
        // 사진만 들어 있던 figure·p, 빈 문단 제거
        .replace(/<figure[^>]*>\s*(<figcaption>\s*<\/figcaption>)?\s*<\/figure>/gi, '')
        .replace(/<p[^>]*>\s*(<br\s*\/?>\s*)*<\/p>/gi, '')
        .trim()
    return { images, rest }
}

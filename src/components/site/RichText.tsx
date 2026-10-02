import { sanitizeHtml } from '@/lib/sanitize'

// 관리자가 입력한 HTML 본문 (정화 후 렌더) — 문서 스타일은 globals.css .content-doc
// h2 구획 · h3 소제목 · blockquote 성경 구절(마지막 문단 = 출처) · ol 번호 카드 · p.motto 표어
export default function RichText({ html, className = '' }: { html: string | null | undefined, className?: string }) {
    if (!html) return null
    return (
        <div
            className={`content-doc ${className}`}
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
        />
    )
}

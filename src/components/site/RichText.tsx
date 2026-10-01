import { sanitizePostHtml } from '@/lib/boards'

// 관리자가 입력한 HTML 본문 (정화 후 렌더, 에디토리얼 글꼴)
export default function RichText({ html, className = '' }: { html: string | null | undefined, className?: string }) {
    if (!html) return null
    return (
        <div
            className={`prose prose-lg max-w-none prose-p:text-[#5C5650] prose-p:leading-[1.9] prose-strong:text-[#2D2A26] prose-headings:font-bold prose-headings:text-[#2D2A26] ${className}`}
            dangerouslySetInnerHTML={{ __html: sanitizePostHtml(html) }}
        />
    )
}

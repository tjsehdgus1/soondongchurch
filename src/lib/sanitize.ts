// 서버에서 사용자 HTML 정화 (게시글 본문, 관리자 페이지 문구)
// isomorphic-dompurify(jsdom)는 서버 런타임의 Node 버전에 따라 불러오기 자체가 실패할 수 있어
// DOM 없이 동작하는 xss(순수 JS)를 사용 — tests/sanitize.test.ts
import { FilterXSS } from 'xss'

const COMMON = ['class']

// 스크립트 실행 주소 (공백·제어문자로 숨긴 경우 포함)
function isDangerousUrl(value: string): boolean {
    let normalized = ''
    for (const ch of value) {
        if (ch.charCodeAt(0) > 32) normalized += ch
    }
    return /^(javascript|vbscript|data):/i.test(normalized)
}

const filter = new FilterXSS({
    whiteList: {
        p: COMMON, br: [], hr: [], span: COMMON, div: COMMON,
        strong: [], b: [], em: [], i: [], u: [], s: [], mark: [], small: [], sub: [], sup: [],
        h1: [], h2: [], h3: [], h4: [], h5: [], h6: [],
        ul: [], ol: ['start'], li: [],
        blockquote: [], pre: [], code: [],
        a: ['href', 'target', 'rel', 'title'],
        img: ['src', 'alt', 'width', 'height', 'title'],
        figure: COMMON, figcaption: [],
        table: COMMON, thead: [], tbody: [], tfoot: [], tr: [], th: ['colspan', 'rowspan'], td: ['colspan', 'rowspan'],
        colgroup: [], col: ['span'],
    },
    // 허용하지 않은 태그는 지우고 안의 글자만 남김, script·style은 내용까지 제거
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style'],
    // style 속성은 허용하지 않음
    css: false,
    // 위험한 주소(javascript: 등)인 href·src는 속성째 제거
    onTagAttr(_tag: string, name: string, value: string) {
        if ((name === 'href' || name === 'src') && isDangerousUrl(value)) return ''
        return undefined
    },
})

export function sanitizeHtml(html: string): string {
    return filter.process(html)
}

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { sanitizeHtml } from '../src/lib/sanitize.ts'

test('removes script and style blocks entirely', () => {
    assert.equal(sanitizeHtml('<p>a</p><script>alert(1)</script><style>p{}</style>'), '<p>a</p>')
})

test('removes event handler attributes', () => {
    assert.equal(sanitizeHtml('<img src="/a.webp" onerror="alert(1)">'), '<img src="/a.webp">')
})

test('removes javascript: links but keeps http(s) links', () => {
    assert.equal(sanitizeHtml('<a href="javascript:alert(1)">x</a>'), '<a>x</a>')
    assert.equal(sanitizeHtml('<a href=" java	script:alert(1)">x</a>'), '<a>x</a>')
    assert.equal(sanitizeHtml('<img src="data:text/html;base64,AAAA">'), '<img>')
    assert.equal(sanitizeHtml('<a href="https://example.com" target="_blank">x</a>'), '<a href="https://example.com" target="_blank">x</a>')
})

test('keeps relative and https image sources with size attributes', () => {
    // 빈 alt는 HTML에서 같은 의미인 alt 로 출력됨
    assert.equal(
        sanitizeHtml('<figure><img src="/api/board-images/cafe/71/0071_001.webp" width="198" height="282" alt=""></figure>'),
        '<figure><img src="/api/board-images/cafe/71/0071_001.webp" width="198" height="282" alt></figure>',
    )
    assert.equal(sanitizeHtml('<img src="https://x.supabase.co/a.webp">'), '<img src="https://x.supabase.co/a.webp">')
})

test('keeps editorial and table markup', () => {
    const html = '<h2>제목</h2><p><strong>굵게</strong> <em>기울임</em><br></p><ul><li>하나</li></ul><blockquote>인용</blockquote><table><tbody><tr><td>칸</td></tr></tbody></table>'
    assert.equal(sanitizeHtml(html), html)
})

test('drops unknown tags but keeps their text', () => {
    assert.equal(sanitizeHtml('<p><marquee>흐름</marquee></p>'), '<p>흐름</p>')
})

test('empty input', () => {
    assert.equal(sanitizeHtml(''), '')
})

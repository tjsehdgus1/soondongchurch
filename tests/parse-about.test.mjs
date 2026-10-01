import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseTimeline, parsePastor, parseStaff, normalizeName } from '../scripts/lib/parse-about.mjs'

test('normalizeName removes spaces between syllables', () => {
    assert.equal(normalizeName('김 광 선'), '김광선')
    assert.equal(normalizeName(' 장 대 직 '), '장대직')
})

test('parseTimeline splits year lines and joins continuation lines', () => {
    const html = '<p>교 회 연 혁</p><p>1946. 7. 15 해촌교회 설립</p><p>초대 당회장 보이열 목사(-&gt;1960.9.8.)</p><p>1959. 교단 분리</p><p>2026.1.12.~17 제 4 차 단기선교</p>'
    const items = parseTimeline(html)
    assert.equal(items.length, 3)
    assert.deepEqual(items[0], { year: 1946, date_label: '7. 15', title: '해촌교회 설립', description: '초대 당회장 보이열 목사(->1960.9.8.)', sort_order: 0 })
    assert.equal(items[1].date_label, null)
    assert.equal(items[1].title, '교단 분리')
    assert.equal(items[2].year, 2026)
    assert.equal(items[2].date_label, '1.12.~17')
    assert.equal(items[2].title, '제 4 차 단기선교')
})

test('parsePastor reads pastor table rows', () => {
    const html = '<table><tr><td>역대 담임교역자</td></tr></table><table><tr><td>순번</td><td>성 명</td><td>직 함</td><td>시 무 기 간</td><td>비고</td></tr><tr><td>1</td><td>손두환</td><td>전도사</td><td>1948. 8. 8 ~ 1949. 8.28</td><td>소천</td></tr><tr><td>16</td><td>김광선</td><td>목 사</td><td>2020. 7.26 ~ 현재</td><td></td></tr></table>'
    const rows = parsePastor(html)
    assert.equal(rows.length, 2)
    assert.deepEqual(rows[1], { category: '역대 담임교역자', name: '김광선', role: '목사', period: '2020. 7.26 ~ 현재', members_only: false, sort_order: 1 })
    assert.equal(rows[0].period, '1948. 8. 8 ~ 1949. 8.28 (소천)')
})

test('parseStaff pairs photos with names per table', () => {
    const html = '<table><tr><td>시무 장로</td><td><img src="a.webp"></td><td><img src="b.webp"></td></tr><tr><td>김 병 준</td><td>황 규 식</td></tr></table><table><tr><td>원로장로</td><td><img src="c.webp"></td></tr><tr><td>장 대 직</td></tr></table>'
    const rows = parseStaff(html)
    assert.deepEqual(rows.map((r) => [r.category, r.name, r.photo_src]), [
        ['시무장로', '김병준', 'a.webp'], ['시무장로', '황규식', 'b.webp'], ['원로장로', '장대직', 'c.webp'],
    ])
    assert.ok(rows.every((r) => r.members_only))
})

test('parseStaff keeps people without photo (empty cell) by column position', () => {
    const html = '<table><tr><td>은퇴 권사</td><td><img src="a.webp"></td><td></td></tr><tr><td>김 성 자</td><td>이 남 심</td></tr></table>'
    const rows = parseStaff(html)
    assert.deepEqual(rows.map((r) => [r.name, r.photo_src]), [['김성자', 'a.webp'], ['이남심', null]])
})

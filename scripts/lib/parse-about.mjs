// 카페 '교회 소개' 글 HTML → 콘텐츠 테이블 행 (순수 함수, 외부 의존성 없음)

const ENTITIES = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ' }

function decode(text) {
    return text.replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (m) => ENTITIES[m])
}

function stripTags(html) {
    return decode(html.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim()
}

function cells(rowHtml) {
    return [...rowHtml.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => m[1])
}

function rows(tableHtml) {
    return [...tableHtml.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map((m) => cells(m[1]))
}

function tables(html) {
    return [...html.matchAll(/<table[^>]*>([\s\S]*?)<\/table>/g)].map((m) => rows(m[1]))
}

// '김 광 선' → '김광선' (글자 사이 공백 제거)
export function normalizeName(text) {
    return stripTags(text).replace(/\s+/g, '')
}

// '1946. 7. 15 내용' / '1959. 내용' / '2026.1.12.~17 내용'
const YEAR_LINE = /^(\d{4})\s*\.\s*(.*)$/
const DATE_PREFIX = /^(\d{1,2}\s*\.\s*\d{1,2}\.?(?:\s*~\s*\d{1,2}\.?)?)\s*(.*)$/

export function parseTimeline(html) {
    const lines = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)].map((m) => stripTags(m[1])).filter(Boolean)
    const items = []
    for (const line of lines) {
        const yearMatch = line.match(YEAR_LINE)
        if (yearMatch) {
            const rest = yearMatch[2].trim()
            const dateMatch = rest.match(DATE_PREFIX)
            items.push({
                year: Number(yearMatch[1]),
                date_label: dateMatch ? dateMatch[1].trim() : null,
                title: (dateMatch ? dateMatch[2] : rest).trim(),
                description: null,
                sort_order: items.length,
            })
        } else if (items.length > 0) {
            // 연도로 시작하지 않는 줄은 직전 항목의 이어지는 설명
            const last = items[items.length - 1]
            last.description = last.description ? `${last.description}\n${line}` : line
        }
        // 첫 연도 이전 줄(제목)은 버림
    }
    return items
}

export function parsePastor(html) {
    const table = tables(html).find((t) => t.some((r) => stripTags(r[0] ?? '') === '순번'))
    if (!table) return []
    return table
        .filter((r) => /^\d+$/.test(stripTags(r[0] ?? '')))
        .map((r, i) => {
            const note = stripTags(r[4] ?? '')
            const period = stripTags(r[3] ?? '')
            return {
                category: '역대 담임교역자',
                name: normalizeName(r[1] ?? ''),
                role: normalizeName(r[2] ?? ''),
                period: note ? `${period} (${note})` : period,
                members_only: false,
                sort_order: i,
            }
        })
}

export function parseStaff(html) {
    const result = []
    for (const table of tables(html)) {
        const [photoRow, nameRow] = table
        if (!photoRow || !nameRow) continue
        const category = normalizeName(photoRow[0] ?? '')
        // 같은 열 위치끼리 짝지음 — 사진 칸이 비어 있으면 photo_src null
        const photoCells = photoRow.slice(1)
        if (nameRow.length > photoCells.length) {
            throw new Error(`'${category}' 이름 ${nameRow.length}개가 사진 칸 ${photoCells.length}개보다 많습니다.`)
        }
        nameRow.forEach((cell, i) => {
            const name = normalizeName(cell)
            if (!name) return
            const photo = photoCells[i]?.match(/<img[^>]+src="([^"]+)"/)?.[1] ?? null
            result.push({ category, name, photo_src: photo, members_only: true, sort_order: result.length })
        })
    }
    return result
}

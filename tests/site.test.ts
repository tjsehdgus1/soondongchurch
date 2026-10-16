import { test } from 'node:test'
import assert from 'node:assert/strict'
import { churchJsonLd, summarize } from '../src/lib/site.ts'

test('summary strips tags and entities and collapses spaces', () => {
    assert.equal(summarize('<p>예배드리고&nbsp;건축 합니다.</p>\n<figure><img src="/a.webp"></figure>'), '예배드리고 건축 합니다.')
    assert.equal(summarize('<p>A &amp; B</p>'), 'A & B')
    assert.equal(summarize(null), '')
})

test('long summaries are cut with an ellipsis', () => {
    const out = summarize('가'.repeat(200), 50)
    assert.equal(out.length, 50)
    assert.ok(out.endsWith('…'))
})

test('structured data describes the church', () => {
    const church = churchJsonLd()['@graph'][0] as Record<string, unknown>
    assert.equal(church['@type'], 'Church')
    assert.equal(church.name, '순천순동교회')
    assert.equal(church.telephone, '+82-61-721-6707')
})

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { adminLinksFor } from '../src/lib/admin-links.ts'

const hrefs = (path: string) => adminLinksFor(path).map((l) => l.href)

test('content pages link to their editors', () => {
    assert.deepEqual(hrefs('/'), ['/admin/pages'])
    assert.deepEqual(hrefs('/about/history'), ['/admin/history'])
    assert.deepEqual(hrefs('/about/people'), ['/admin/people'])
    assert.deepEqual(hrefs('/mission'), ['/admin/missions', '/admin/pages', '/admin/boards'])
    assert.deepEqual(hrefs('/next-gen'), ['/admin/pages', '/admin/boards'])
})

test('list pages link to create screens', () => {
    assert.deepEqual(hrefs('/notices'), ['/admin/notices'])
    assert.deepEqual(hrefs('/events'), ['/admin/events'])
    assert.deepEqual(hrefs('/bulletins/3'), ['/admin/bulletins'])
    assert.deepEqual(hrefs('/board/free/12'), ['/admin/boards'])
})

test('no bar on admin and auth screens or unknown pages', () => {
    assert.deepEqual(hrefs('/admin/members'), [])
    assert.deepEqual(hrefs('/auth/login'), [])
    assert.deepEqual(hrefs('/privacy'), [])
})

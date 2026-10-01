import { test } from 'node:test'
import assert from 'node:assert/strict'
import { activeItemHref, buildSiteMenu } from '../src/lib/site-menu.ts'

const menu = buildSiteMenu({ loggedIn: false, isAdmin: false })
const items = (label: string) => menu.find((s) => s.label === label)!.items

test('picks the most specific path, not every prefix match', () => {
    assert.equal(activeItemHref(items('교회소개'), '/about/history', ''), '/about/history')
    assert.equal(activeItemHref(items('교회소개'), '/about', ''), '/about')
})

test('tab items match only their own tab', () => {
    assert.equal(activeItemHref(items('다음세대'), '/next-gen', '?tab=youth'), '/next-gen?tab=youth')
    assert.equal(activeItemHref(items('다음세대'), '/next-gen', '?tab=youth&page=2'), '/next-gen?tab=youth')
    assert.equal(activeItemHref(items('다음세대'), '/next-gen', ''), '/next-gen')
})

test('board detail pages keep their board active', () => {
    assert.equal(activeItemHref(items('소식·나눔'), '/board/free/12', ''), '/board/free')
})

test('no match in another section', () => {
    assert.equal(activeItemHref(items('다음세대'), '/about', ''), null)
})

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

test('admin menu is the last section, only for admins', () => {
    assert.equal(menu.some((s) => s.label === '관리자'), false)
    const adminMenu = buildSiteMenu({ loggedIn: true, isAdmin: true })
    const last = adminMenu[adminMenu.length - 1]
    assert.equal(last.label, '관리자')
    assert.equal(last.href, '/admin')
    assert.equal(activeItemHref(last.items, '/admin/boards', ''), '/admin/boards')
    // 소식·나눔에는 더 이상 관리자 항목이 없음
    assert.equal(adminMenu.find((s) => s.label === '소식·나눔')!.items.some((i) => i.href === '/admin'), false)
})

test('no match in another section', () => {
    assert.equal(activeItemHref(items('다음세대'), '/about', ''), null)
})

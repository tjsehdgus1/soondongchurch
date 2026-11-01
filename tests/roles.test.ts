import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ROLES, ROLE_LABEL, isRole } from '../src/lib/roles.ts'

test('three roles with Korean labels, lowest first', () => {
    assert.deepEqual([...ROLES], ['member', 'editor', 'admin'])
    assert.equal(ROLE_LABEL.member, '일반 회원')
    assert.equal(ROLE_LABEL.editor, '운영자')
    assert.equal(ROLE_LABEL.admin, '관리자')
})

test('only known roles are accepted', () => {
    assert.ok(isRole('editor'))
    assert.ok(isRole('admin'))
    assert.ok(!isRole('owner'))
    assert.ok(!isRole(undefined))
    assert.ok(!isRole(1))
})

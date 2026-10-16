import { test } from 'node:test'
import assert from 'node:assert/strict'
import { REMEMBER_MAX_AGE, SHORT_MAX_AGE, withSessionMaxAge } from '../src/lib/supabase/session.ts'

test('remember me keeps the login for 30 days, otherwise 12 hours', () => {
    assert.equal(withSessionMaxAge({ path: '/', maxAge: 400 * 86400 }, true).maxAge, REMEMBER_MAX_AGE)
    assert.equal(withSessionMaxAge({ path: '/', maxAge: 400 * 86400 }, false).maxAge, SHORT_MAX_AGE)
    assert.equal(REMEMBER_MAX_AGE, 30 * 24 * 60 * 60)
    assert.equal(SHORT_MAX_AGE, 12 * 60 * 60)
})

test('cookie removal (maxAge 0) is left alone', () => {
    assert.equal(withSessionMaxAge({ path: '/', maxAge: 0 }, true).maxAge, 0)
})

test('other options are kept and expires is dropped', () => {
    const out = withSessionMaxAge({ path: '/', sameSite: 'lax', expires: new Date(), maxAge: 10 }, false)
    assert.equal(out.path, '/')
    assert.equal(out.sameSite, 'lax')
    assert.equal('expires' in out, false)
})

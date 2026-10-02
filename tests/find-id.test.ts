import { test } from 'node:test'
import assert from 'node:assert/strict'
import { maskUsername, matchUsernames, phoneDigits } from '../src/lib/find-id.ts'

test('phone numbers compare by digits only', () => {
    assert.equal(phoneDigits('010-1234-5678'), '01012345678')
    assert.equal(phoneDigits(' 010 1234 5678 '), '01012345678')
})

test('usernames are partly hidden', () => {
    assert.equal(maskUsername('tjsehdgus1'), 'tj*******1')
    assert.equal(maskUsername('abc'), 'a*c')
    assert.equal(maskUsername('ab'), 'a*')
})

test('finds by exact name and phone digits', () => {
    const profiles = [
        { username: 'hong123', name: '홍길동', phone_number: '010-1111-2222' },
        { username: 'hong999', name: '홍길동', phone_number: '01033334444' },
        { username: 'kim1', name: '김철수', phone_number: '01011112222' },
    ]
    assert.deepEqual(matchUsernames(profiles, ' 홍길동 ', '01011112222'), ['ho****3'])
    assert.deepEqual(matchUsernames(profiles, '홍길동', '010-5555-6666'), [])
    assert.deepEqual(matchUsernames(profiles, '', '01011112222'), [])
})

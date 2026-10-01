import { test } from 'node:test'
import assert from 'node:assert/strict'
import { nextWorship, WORSHIPS } from '../src/lib/worship.ts'

// 2026-10-07 은 수요일. 시각은 UTC로 주고 KST(+9) 기준 결과를 검증
const kst = (iso: string) => new Date(`${iso}+09:00`)

test('weekday evening before service → today service', () => {
    const r = nextWorship(kst('2026-10-07T18:00:00'))
    assert.equal(r.worship.key, 'wed-night')
    assert.equal(r.isToday, true)
    assert.equal(r.startsAt.toISOString(), kst('2026-10-07T19:00:00').toISOString())
})

test('after the last service of the day → next morning dawn prayer', () => {
    const r = nextWorship(kst('2026-10-07T19:30:00'))
    assert.equal(r.worship.key, 'dawn')
    assert.equal(r.isToday, false)
    assert.equal(r.startsAt.toISOString(), kst('2026-10-08T05:00:00').toISOString())
})

test('sunday noon → sunday afternoon service', () => {
    const r = nextWorship(kst('2026-10-11T12:00:00'))
    assert.equal(r.worship.key, 'sun-afternoon')
    assert.equal(r.isToday, true)
})

test('sunday 05:30 → sunday morning service (dawn already started)', () => {
    const r = nextWorship(kst('2026-10-11T05:30:00'))
    assert.equal(r.worship.key, 'sun-morning')
})

test('works when server clock is UTC late evening (KST next day)', () => {
    // UTC 2026-10-09 23:00 = KST 2026-10-10(토) 08:00 → 다음은 일요일 새벽
    const r = nextWorship(new Date('2026-10-09T23:00:00Z'))
    assert.equal(r.worship.key, 'dawn')
    assert.equal(r.startsAt.toISOString(), kst('2026-10-11T05:00:00').toISOString())
})

test('schedule has five services', () => {
    assert.equal(WORSHIPS.length, 5)
})

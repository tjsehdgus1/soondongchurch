import { test } from 'node:test'
import assert from 'node:assert/strict'
import { pickFields, type FieldSpec } from '../src/lib/fields.ts'

const fields: Record<string, FieldSpec> = {
    name: { type: 'string', max: 5, required: true },
    year: { type: 'int', required: true },
    lat: { type: 'number', min: -90, max: 90 },
    hidden: { type: 'boolean' },
    note: { type: 'string' },
}

test('create requires required fields', () => {
    assert.deepEqual(pickFields({ name: '홍길동' }, fields, false), { error: 'year 값이 필요합니다.' })
})

test('update only validates sent fields and trims strings', () => {
    assert.deepEqual(pickFields({ name: ' 김 ' }, fields, true), { values: { name: '김' } })
})

test('rejects wrong types and ranges', () => {
    assert.ok('error' in pickFields({ year: 1.5 }, fields, true))
    assert.ok('error' in pickFields({ lat: 91 }, fields, true))
    assert.ok('error' in pickFields({ hidden: 'yes' }, fields, true))
    assert.ok('error' in pickFields({ name: '너무긴이름이다' }, fields, true))
})

test('empty optional value becomes null, numeric strings are accepted', () => {
    assert.deepEqual(pickFields({ note: '', lat: '34.95', year: '1946' }, fields, true), { values: { note: null, lat: 34.95, year: 1946 } })
})

test('ignores fields not in whitelist', () => {
    assert.deepEqual(pickFields({ id: 3, name: '이' }, fields, true), { values: { name: '이' } })
})

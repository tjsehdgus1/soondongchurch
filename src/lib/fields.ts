// 관리자 입력 필드 검증 (순수 함수 — tests/fields.test.ts)

export type FieldSpec =
    | { type: 'string', max?: number, required?: boolean }
    | { type: 'int', required?: boolean }
    | { type: 'number', min: number, max: number, required?: boolean }
    | { type: 'boolean' }

type Picked = { values: Record<string, unknown> } | { error: string }

// partial: 수정(PATCH) — 보낸 필드만 검증. 생성(POST) — required 필드 필수
export function pickFields(body: Record<string, unknown>, fields: Record<string, FieldSpec>, partial: boolean): Picked {
    const values: Record<string, unknown> = {}
    for (const [name, spec] of Object.entries(fields)) {
        const present = name in body
        const raw = body[name]
        const required = 'required' in spec && spec.required
        if (!present) {
            if (!partial && required) return { error: `${name} 값이 필요합니다.` }
            continue
        }
        if (spec.type === 'boolean') {
            if (typeof raw !== 'boolean') return { error: `${name} 값이 올바르지 않습니다.` }
            values[name] = raw
            continue
        }
        // 빈 값은 null (필수 필드는 거부)
        if (raw === null || raw === '') {
            if (required) return { error: `${name} 값이 필요합니다.` }
            values[name] = null
            continue
        }
        if (spec.type === 'string') {
            if (typeof raw !== 'string') return { error: `${name} 값이 올바르지 않습니다.` }
            const text = raw.trim()
            if (text.length > (spec.max ?? 5000)) return { error: `${name} 값이 너무 깁니다.` }
            if (required && !text) return { error: `${name} 값이 필요합니다.` }
            values[name] = text
        } else {
            const num = typeof raw === 'number' ? raw : Number(raw)
            if (!Number.isFinite(num)) return { error: `${name} 값은 숫자여야 합니다.` }
            if (spec.type === 'int' && !Number.isInteger(num)) return { error: `${name} 값은 정수여야 합니다.` }
            if (spec.type === 'number' && (num < spec.min || num > spec.max)) {
                return { error: `${name} 값은 ${spec.min}~${spec.max} 사이여야 합니다.` }
            }
            values[name] = num
        }
    }
    return { values }
}

// 콘텐츠 테이블용 관리자 CRUD 라우트 생성기
// 기존 관리자 API 패턴: CSRF 검사 → verifySiteManager(사이트 설정 관리자만) → 필드 화이트리스트·타입 검증 → service role
import { NextResponse } from 'next/server'
import { getServiceClient, verifySiteManager } from '@/lib/admin'
import { checkCsrf } from '@/lib/csrf'
import { type FieldSpec, pickFields } from '@/lib/fields'

type CrudOptions = {
    table: string
    idColumn: 'id' | 'key'
    order: { column: string, ascending?: boolean }[]
    fields: Record<string, FieldSpec>
}

function parseId(req: Request, idColumn: 'id' | 'key'): string | number | null {
    const raw = new URL(req.url).searchParams.get(idColumn)
    if (!raw) return null
    if (idColumn === 'key') return /^[a-z0-9.-]{1,60}$/.test(raw) ? raw : null
    const id = Number(raw)
    return Number.isInteger(id) && id > 0 ? id : null
}

const forbidden = () => NextResponse.json({ error: '사이트 설정 관리자만 바꿀 수 있습니다.' }, { status: 403 })
const badRequest = (error: string) => NextResponse.json({ error }, { status: 400 })

export function createAdminCrud({ table, idColumn, order, fields }: CrudOptions) {
    async function GET() {
        if (!(await verifySiteManager())) return forbidden()
        let query = getServiceClient().from(table).select('*')
        for (const o of order) query = query.order(o.column, { ascending: o.ascending ?? true })
        const { data, error } = await query
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ data })
    }

    async function POST(req: Request) {
        if (!checkCsrf(req)) return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 403 })
        if (!(await verifySiteManager())) return forbidden()
        const body = await req.json()
        const picked = pickFields(body, fields, false)
        if ('error' in picked) return badRequest(picked.error)
        if (idColumn === 'key') {
            if (typeof body.key !== 'string' || !/^[a-z0-9.-]{1,60}$/.test(body.key)) return badRequest('key 형식이 올바르지 않습니다.')
            picked.values.key = body.key
        }
        const { error } = await getServiceClient().from(table).insert(picked.values)
        if (error) return badRequest(error.code === '23505' ? '이미 있는 항목입니다.' : error.message)
        return NextResponse.json({ success: true })
    }

    async function PATCH(req: Request) {
        if (!checkCsrf(req)) return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 403 })
        if (!(await verifySiteManager())) return forbidden()
        const id = parseId(req, idColumn)
        if (id === null) return badRequest(`유효한 ${idColumn}가 필요합니다.`)
        const picked = pickFields(await req.json(), fields, true)
        if ('error' in picked) return badRequest(picked.error)
        if (Object.keys(picked.values).length === 0) return badRequest('변경할 항목이 없습니다.')
        const { error } = await getServiceClient().from(table).update(picked.values).eq(idColumn, id)
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ success: true })
    }

    async function DELETE(req: Request) {
        if (!checkCsrf(req)) return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 403 })
        if (!(await verifySiteManager())) return forbidden()
        const id = parseId(req, idColumn)
        if (id === null) return badRequest(`유효한 ${idColumn}가 필요합니다.`)
        const { error } = await getServiceClient().from(table).delete().eq(idColumn, id)
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ success: true })
    }

    return { GET, POST, PATCH, DELETE }
}

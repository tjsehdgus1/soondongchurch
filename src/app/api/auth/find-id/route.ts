import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/admin'
import { checkCsrf } from '@/lib/csrf'
import { matchUsernames, phoneDigits } from '@/lib/find-id'

// 아이디 찾기: 가입 때 입력한 이름·휴대폰 번호가 모두 맞는 계정의 아이디를 일부 가려서 돌려줌
// 비밀번호는 찾을 수 없음 — 관리자가 회원 관리에서 새 비밀번호를 정해 줌
export async function POST(req: NextRequest) {
    if (!checkCsrf(req)) {
        return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 403 })
    }

    const { name, phone } = await req.json()
    if (typeof name !== 'string' || !name.trim() || name.length > 40) {
        return NextResponse.json({ error: '이름을 입력해 주세요.' }, { status: 400 })
    }
    if (typeof phone !== 'string' || phoneDigits(phone).length < 10 || phone.length > 20) {
        return NextResponse.json({ error: '휴대폰 번호를 확인해 주세요.' }, { status: 400 })
    }

    const { data, error } = await getServiceClient()
        .from('profiles')
        .select('username, name, phone_number')
        .eq('name', name.trim())
        .limit(50)
    if (error) {
        console.error('아이디 찾기 오류:', error.message)
        return NextResponse.json({ error: '잠시 후 다시 시도해 주세요.' }, { status: 500 })
    }

    return NextResponse.json({ usernames: matchUsernames(data ?? [], name, phone) })
}

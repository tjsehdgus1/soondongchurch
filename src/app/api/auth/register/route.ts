import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/admin'
import { checkCsrf } from '@/lib/csrf'

// 회원가입: 입력값을 검사한 뒤 계정 생성 → 승인 대기(is_approved = false), 관리자가 승인해야 로그인
// 휴대폰 문자 인증은 2026-10-02 삭제 (관리자 승인제로 대체)
// (Supabase 대시보드에서 공개 회원가입을 꺼서 클라이언트 signUp 우회를 차단해야 함)
export async function POST(req: NextRequest) {
    if (!checkCsrf(req)) {
        return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 403 })
    }

    const { username, password, name, email, phone } = await req.json()

    if (typeof username !== 'string' || !/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
        return NextResponse.json({ error: '아이디는 영문, 숫자, 밑줄(_)만 사용하여 3~20자로 입력해 주세요.' }, { status: 400 })
    }
    if (typeof password !== 'string' || password.length < 6) {
        return NextResponse.json({ error: '비밀번호는 6자 이상이어야 합니다.' }, { status: 400 })
    }
    if (typeof name !== 'string' || !name.trim()) {
        return NextResponse.json({ error: '이름을 입력해 주세요.' }, { status: 400 })
    }
    if (typeof phone !== 'string' || phone.replace(/\D/g, '').length < 10) {
        return NextResponse.json({ error: '올바른 휴대폰 번호를 입력해 주세요.' }, { status: 400 })
    }

    const supabase = getServiceClient()

    const { error } = await supabase.auth.admin.createUser({
        email: `${username.toLowerCase()}@internal.church`,
        password,
        email_confirm: true,
        user_metadata: {
            username,
            name: name.trim(),
            real_email: typeof email === 'string' ? email.trim() : '',
            phone_number: phone,
        },
    })

    if (error) {
        if (error.message.includes('already') || error.status === 422) {
            return NextResponse.json({ error: '이미 사용 중인 아이디입니다.' }, { status: 409 })
        }
        console.error('회원가입 오류:', error.message)
        return NextResponse.json({ error: '회원가입 중 오류가 발생했습니다.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}

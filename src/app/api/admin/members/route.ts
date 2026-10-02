import { NextResponse } from 'next/server'
import { getServiceClient, verifyAdmin } from '@/lib/admin'
import { checkCsrf } from '@/lib/csrf'

// GET: 전체 회원 목록 + 소속 부서 + 차단·승인 여부
export async function GET() {
  const admin = await verifyAdmin()
  if (!admin) return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 401 })

  const service = getServiceClient()

  const { data: members, error } = await service
    .from('profiles')
    .select(`
      id, username, name, email, phone_number, role, is_blocked, is_approved, can_manage_site, created_at,
      group_members (
        groups ( id, name )
      )
    `)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: members })
}

// PATCH: 회원 정보 수정 (username, name, email, phone_number, role, is_blocked, is_approved)
//        + new_password: 비밀번호를 잊은 회원에게 관리자가 새 비밀번호를 정해 줌 (비밀번호 찾기 = 관리자 문의)
export async function PATCH(req: Request) {
  if (!checkCsrf(req)) return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 403 })

  const admin = await verifyAdmin()
  if (!admin) return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 401 })

  const { id, username, name, email, phone_number, role, is_blocked, is_approved, new_password } = await req.json()
  if (!id) return NextResponse.json({ error: 'id가 필요합니다.' }, { status: 400 })

  if (role !== undefined && role !== 'admin' && role !== 'member') {
    return NextResponse.json({ error: '잘못된 권한 값입니다.' }, { status: 400 })
  }
  if (is_blocked !== undefined && typeof is_blocked !== 'boolean') {
    return NextResponse.json({ error: '잘못된 차단 값입니다.' }, { status: 400 })
  }
  if (is_approved !== undefined && typeof is_approved !== 'boolean') {
    return NextResponse.json({ error: '잘못된 승인 값입니다.' }, { status: 400 })
  }
  if (new_password !== undefined && (typeof new_password !== 'string' || new_password.length < 6 || new_password.length > 72)) {
    return NextResponse.json({ error: '새 비밀번호는 6자 이상으로 입력해 주세요.' }, { status: 400 })
  }
  // 본인 계정 차단·강등으로 관리자가 사라지는 사고 방지
  if (id === admin.id && (is_blocked === true || role === 'member')) {
    return NextResponse.json({ error: '본인 계정은 차단하거나 권한을 낮출 수 없습니다.' }, { status: 400 })
  }

  const service = getServiceClient()

  // 사이트 설정 관리자의 정보는 사이트 설정 관리자만 바꿀 수 있음 (다른 관리자가 강등·차단하지 못하게)
  const { data: people } = await service.from('profiles').select('id, can_manage_site').in('id', [id, admin.id])
  const isSiteManager = (uid: string) => !!people?.find((p) => p.id === uid)?.can_manage_site
  if (isSiteManager(id) && !isSiteManager(admin.id)) {
    return NextResponse.json({ error: '사이트 설정 관리자의 정보는 사이트 설정 관리자만 바꿀 수 있습니다.' }, { status: 403 })
  }

  if (new_password !== undefined) {
    const { error: pwError } = await service.auth.admin.updateUserById(id, { password: new_password })
    if (pwError) return NextResponse.json({ error: pwError.message }, { status: 500 })
  }

  const updates: Record<string, unknown> = {}
  if (username !== undefined) updates.username = username
  if (name !== undefined) updates.name = name
  if (email !== undefined) updates.email = email
  if (phone_number !== undefined) updates.phone_number = phone_number
  if (role !== undefined) updates.role = role
  if (is_blocked !== undefined) updates.is_blocked = is_blocked
  if (is_approved !== undefined) updates.is_approved = is_approved

  if (Object.keys(updates).length === 0) return NextResponse.json({ success: true })
  const { error } = await service.from('profiles').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

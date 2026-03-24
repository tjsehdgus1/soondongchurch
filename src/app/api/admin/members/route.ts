import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

// 서비스 롤 클라이언트 - RLS 우회 (관리자 전용 작업)
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

// 호출자가 admin인지 확인
async function verifyAdmin() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  return user
}

// GET: 전체 교인 목록 + 소속 그룹 + 차단 여부
export async function GET() {
  const admin = await verifyAdmin()
  if (!admin) return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 401 })

  const service = getServiceClient()

  const { data: members, error } = await service
    .from('profiles')
    .select(`
      id, username, name, email, phone_number, role, is_blocked, created_at,
      group_members (
        groups ( id, name )
      )
    `)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: members })
}

// PATCH: 교인 정보 수정 (username, name, email, phone_number, role, is_blocked)
export async function PATCH(req: Request) {
  const admin = await verifyAdmin()
  if (!admin) return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 401 })

  const { id, username, name, email, phone_number, role, is_blocked } = await req.json()
  if (!id) return NextResponse.json({ error: 'id가 필요합니다.' }, { status: 400 })

  const service = getServiceClient()

  const updates: Record<string, unknown> = {}
  if (username !== undefined) updates.username = username
  if (name !== undefined) updates.name = name
  if (email !== undefined) updates.email = email
  if (phone_number !== undefined) updates.phone_number = phone_number
  if (role !== undefined) updates.role = role
  if (is_blocked !== undefined) updates.is_blocked = is_blocked

  const { error } = await service.from('profiles').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

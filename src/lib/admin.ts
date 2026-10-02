import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

export function getServiceClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
}

// 로그인한 관리자 (차단되지 않은 role = 'admin')와 사이트 설정 권한 여부
async function getAdmin() {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data: profile } = await supabase.from('profiles').select('role, is_blocked, can_manage_site').eq('id', user.id).single()
    if (profile?.role !== 'admin' || profile.is_blocked) return null
    return { user, canManageSite: !!profile.can_manage_site }
}

export async function verifyAdmin() {
    return (await getAdmin())?.user ?? null
}

// 사이트 설정(게시판 관리·페이지 문구·연혁·섬기는 분들·선교지)은 관리자 중 can_manage_site 인 사람만
// supabase/20261002_site_managers.sql
export async function verifySiteManager() {
    const admin = await getAdmin()
    return admin?.canManageSite ? admin.user : null
}

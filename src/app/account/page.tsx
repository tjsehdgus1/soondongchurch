import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PasswordChangeForm from './PasswordChangeForm'

export const metadata = { title: '내 정보 | 순천순동교회' }

// 내 정보: 가입 정보 확인 + 비밀번호 변경 (정보 수정은 관리자에게 문의)
export default async function AccountPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login')

    const { data: profile } = await supabase.from('profiles').select('username, name, phone_number, email').eq('id', user.id).single()
    const rows = [
        { label: '이름', value: profile?.name },
        { label: '아이디', value: profile?.username },
        { label: '휴대폰', value: profile?.phone_number },
        { label: '이메일', value: profile?.email },
    ].filter((r) => r.value)

    return (
        <div className="min-h-screen bg-[#FAF8F5] px-4 py-12 lg:py-16">
            <div className="max-w-md mx-auto space-y-6">
                <h1 className="text-3xl font-bold text-[#2D2A26]" style={{ fontFamily: 'var(--font-serif)' }}>내 정보</h1>

                <section className="bg-white rounded-3xl border border-[#E8E4DE] p-7" aria-label="가입 정보">
                    <dl className="divide-y divide-[#E8E4DE]">
                        {rows.map((r) => (
                            <div key={r.label} className="flex justify-between gap-4 py-3 first:pt-0 last:pb-0">
                                <dt className="text-[#8B7355]">{r.label}</dt>
                                <dd className="font-semibold text-[#2D2A26] text-right break-all">{r.value}</dd>
                            </div>
                        ))}
                    </dl>
                    <p className="mt-5 text-sm text-[#8B7355]">이름·휴대폰 번호를 바꾸려면 교회(061-721-6707)로 문의해 주세요.</p>
                </section>

                <PasswordChangeForm username={profile?.username ?? ''} />
            </div>
        </div>
    )
}

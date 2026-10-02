'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// 비밀번호 변경: 현재 비밀번호로 한 번 더 로그인해 본인 확인 → 새 비밀번호로 변경
export default function PasswordChangeForm({ username }: { username: string }) {
    const [supabase] = useState(() => createClient())
    const [current, setCurrent] = useState('')
    const [next, setNext] = useState('')
    const [confirm, setConfirm] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ ok: boolean, text: string } | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setMessage(null)
        if (next.length < 6) return setMessage({ ok: false, text: '새 비밀번호는 6자 이상으로 입력해 주세요.' })
        if (next !== confirm) return setMessage({ ok: false, text: '새 비밀번호가 서로 다릅니다.' })
        if (next === current) return setMessage({ ok: false, text: '지금 비밀번호와 다른 비밀번호를 입력해 주세요.' })

        setLoading(true)
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: `${username.toLowerCase()}@internal.church`,
            password: current,
        })
        if (signInError) {
            setLoading(false)
            return setMessage({ ok: false, text: '현재 비밀번호가 맞지 않습니다.' })
        }
        const { error } = await supabase.auth.updateUser({ password: next })
        setLoading(false)
        if (error) return setMessage({ ok: false, text: '비밀번호를 바꾸지 못했습니다. 잠시 후 다시 시도해 주세요.' })
        setCurrent('')
        setNext('')
        setConfirm('')
        setMessage({ ok: true, text: '비밀번호를 바꿨습니다. 다음 로그인부터 새 비밀번호를 쓰세요.' })
    }

    const input = 'w-full px-4 py-3 rounded-xl border border-[#E8E4DE] text-[#2D2A26] focus:outline-none focus:ring-2 focus:ring-[#2D2A26] focus:border-transparent'

    return (
        <section className="bg-white rounded-3xl border border-[#E8E4DE] p-7" aria-labelledby="change-password">
            <h2 id="change-password" className="text-xl font-bold text-[#2D2A26]" style={{ fontFamily: 'var(--font-serif)' }}>비밀번호 변경</h2>
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div>
                    <label htmlFor="current" className="block text-sm font-semibold mb-1.5 text-[#5C5650]">현재 비밀번호</label>
                    <input id="current" type="password" autoComplete="current-password" required value={current} onChange={(e) => setCurrent(e.target.value)} className={input} />
                </div>
                <div>
                    <label htmlFor="next" className="block text-sm font-semibold mb-1.5 text-[#5C5650]">새 비밀번호</label>
                    <input id="next" type="password" autoComplete="new-password" required value={next} onChange={(e) => setNext(e.target.value)} placeholder="6자 이상" className={input} />
                </div>
                <div>
                    <label htmlFor="confirm" className="block text-sm font-semibold mb-1.5 text-[#5C5650]">새 비밀번호 확인</label>
                    <input id="confirm" type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} className={input} />
                </div>
                {message && (
                    <p role="status" className={`text-sm rounded-xl px-4 py-3 border ${message.ok ? 'bg-[#F2EFE9] border-[#E8E4DE] text-[#2D2A26]' : 'bg-red-50 border-red-200 text-red-600'}`}>
                        {message.text}
                    </p>
                )}
                <button type="submit" disabled={loading}
                    className="w-full py-3.5 rounded-xl bg-[#2D2A26] text-white font-bold hover:bg-black transition-colors disabled:opacity-50 cursor-pointer">
                    {loading ? '바꾸는 중...' : '비밀번호 바꾸기'}
                </button>
            </form>
        </section>
    )
}

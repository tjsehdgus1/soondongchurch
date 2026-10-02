'use client'

import { useState } from 'react'
import Link from 'next/link'

const CHURCH_TEL = '061-721-6707'

// 아이디 찾기(이름·휴대폰 번호) + 비밀번호 찾기 안내(관리자 문의)
export default function FindAccountPage() {
    const [name, setName] = useState('')
    const [phone, setPhone] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [found, setFound] = useState<string[] | null>(null)

    const handleFind = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setFound(null)
        setLoading(true)
        try {
            const res = await fetch('/api/auth/find-id', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, phone }),
            })
            const data = await res.json()
            if (!res.ok) setError(data.error ?? '잠시 후 다시 시도해 주세요.')
            else setFound(data.usernames ?? [])
        } catch {
            setError('네트워크 오류가 발생했습니다. 다시 시도해 주세요.')
        } finally {
            setLoading(false)
        }
    }

    const input = 'w-full px-4 py-3 rounded-xl border border-[#E8E4DE] text-[#2D2A26] focus:outline-none focus:ring-2 focus:ring-[#2D2A26] focus:border-transparent'

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#FAF8F5]">
            <div className="w-full max-w-md space-y-6">
                <section className="bg-white rounded-3xl shadow-xl border border-[#E8E4DE] p-8" aria-labelledby="find-id">
                    <h1 id="find-id" className="text-2xl font-extrabold text-[#2D2A26]" style={{ fontFamily: 'var(--font-serif)' }}>아이디 찾기</h1>
                    <p className="mt-1 text-sm text-[#8B7355]">가입할 때 입력한 이름과 휴대폰 번호를 입력해 주세요.</p>

                    <form onSubmit={handleFind} className="mt-6 space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-semibold mb-1.5 text-[#5C5650]">이름</label>
                            <input id="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="홍길동" className={input} />
                        </div>
                        <div>
                            <label htmlFor="phone" className="block text-sm font-semibold mb-1.5 text-[#5C5650]">휴대폰 번호</label>
                            <input id="phone" type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01012345678" className={input} />
                        </div>
                        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>}
                        <button type="submit" disabled={loading}
                            className="w-full py-3.5 rounded-xl bg-[#2D2A26] text-white font-bold hover:bg-black transition-colors disabled:opacity-50 cursor-pointer">
                            {loading ? '찾는 중...' : '아이디 찾기'}
                        </button>
                    </form>

                    {found && (
                        <div className="mt-6 rounded-2xl bg-[#F2EFE9] px-5 py-4" aria-live="polite">
                            {found.length > 0 ? (
                                <>
                                    <p className="text-sm text-[#5C5650]">가입한 아이디</p>
                                    <ul className="mt-1 space-y-1">
                                        {found.map((id) => <li key={id} className="text-xl font-bold text-[#2D2A26] tracking-wide">{id}</li>)}
                                    </ul>
                                    <p className="mt-2 text-xs text-[#8B7355]">개인정보 보호를 위해 아이디 일부를 *로 가렸습니다.</p>
                                </>
                            ) : (
                                <p className="text-sm text-[#5C5650]">입력한 이름·휴대폰 번호로 가입한 아이디가 없습니다.</p>
                            )}
                        </div>
                    )}
                </section>

                <section id="password" className="bg-white rounded-3xl border border-[#E8E4DE] p-8" aria-labelledby="find-password">
                    <h2 id="find-password" className="text-2xl font-extrabold text-[#2D2A26]" style={{ fontFamily: 'var(--font-serif)' }}>비밀번호 찾기</h2>
                    <p className="mt-3 text-[#5C5650] leading-relaxed">
                        비밀번호는 관리자에게 문의해 주세요.<br />
                        본인 확인 후 새 비밀번호를 알려 드립니다.
                    </p>
                    <a href={`tel:${CHURCH_TEL.replace(/-/g, '')}`}
                        className="mt-5 flex items-center justify-between gap-4 rounded-2xl border border-[#E8E4DE] px-5 py-4 hover:border-[#2D2A26] transition-colors">
                        <span>
                            <span className="block text-sm text-[#8B7355]">순천순동교회</span>
                            <span className="block text-lg sm:text-xl font-bold text-[#2D2A26] tabular-nums whitespace-nowrap">{CHURCH_TEL}</span>
                        </span>
                        <span className="shrink-0 whitespace-nowrap text-sm font-semibold text-[#2D2A26]">전화 걸기 →</span>
                    </a>
                </section>

                <p className="text-center text-sm text-[#8B7355]">
                    <Link href="/auth/login" className="font-semibold text-[#2D2A26] hover:underline">로그인으로 돌아가기</Link>
                </p>
            </div>
        </div>
    )
}

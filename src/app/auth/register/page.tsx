'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function RegisterPage() {
    const [username, setUsername] = useState('')
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [phone, setPhone] = useState('')
    const [agreedToTerms, setAgreedToTerms] = useState(false)
    const [agreedToPrivacy, setAgreedToPrivacy] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (!username.trim()) {
            setError('아이디를 입력해 주세요.')
            return
        }
        if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
            setError('아이디는 영문, 숫자, 밑줄(_)만 사용하여 3~20자로 입력해 주세요.')
            return
        }
        if (!agreedToTerms || !agreedToPrivacy) {
            setError('필수 약관 및 개인정보 수집에 동의해 주세요.')
            return
        }
        if (phone.replace(/\D/g, '').length < 10) {
            setError('휴대폰 번호를 확인해 주세요.')
            return
        }
        if (password !== confirm) {
            setError('비밀번호가 일치하지 않습니다.')
            return
        }
        if (password.length < 6) {
            setError('비밀번호는 6자 이상이어야 합니다.')
            return
        }

        setLoading(true)

        // 계정 생성은 서버에서 SMS 인증 여부를 확인한 뒤 수행
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, name, email, phone }),
            })
            const result = await res.json()
            if (!res.ok) {
                setError(result.error || '회원가입에 실패했습니다.')
                setLoading(false)
                return
            }
        } catch {
            setError('네트워크 오류가 발생했습니다. 다시 시도해 주세요.')
            setLoading(false)
            return
        }

        // 관리자 승인 전에는 로그인할 수 없으므로 자동 로그인하지 않고 안내만 표시
        setSuccess(true)
        setLoading(false)
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: '#FAF8F5' }}>
                <div className="w-full max-w-md text-center">
                    <div className="bg-white rounded-3xl shadow-xl border p-10" style={{ borderColor: '#E8E4DE' }}>
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-extrabold mb-2" style={{ color: '#2D2A26', fontFamily: 'var(--font-serif)' }}>가입 신청 완료</h2>
                        <p className="mb-6 text-sm" style={{ color: '#8B7355' }}>
                            관리자가 승인하면 로그인할 수 있습니다.<br />
                            승인까지 조금 기다려 주세요.
                        </p>
                        <Link href="/auth/login"
                            className="block w-full py-3 text-white font-bold rounded-xl transition-colors" style={{ background: '#B8860B' }}>
                            로그인 화면으로 가기
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: '#FAF8F5' }}>
            <div className="w-full max-w-md">
                <div className="bg-white rounded-3xl shadow-xl border p-8" style={{ borderColor: '#E8E4DE' }}>
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 rounded-md overflow-hidden mx-auto mb-4 shadow-lg">
                            <img src="/images/logo.svg" alt="순천순동교회 로고" className="w-full h-full object-cover" />
                        </div>
                        <h1 className="text-2xl font-extrabold" style={{ color: '#2D2A26', fontFamily: 'var(--font-serif)' }}>회원가입</h1>
                        <p className="text-sm mt-1" style={{ color: '#8B7355' }}>순천순동교회 홈페이지 회원으로 가입하세요</p>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-4">
                        {/* Username */}
                        <div>
                            <label htmlFor="username" className="block text-sm font-semibold mb-1.5" style={{ color: '#5C5650' }}>
                                아이디 <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="username"
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="영문, 숫자, 밑줄(_) 3~20자"
                                className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#B8860B] focus:border-transparent transition-shadow" style={{ borderColor: '#E8E4DE', color: '#2D2A26' }}
                            />
                            <p className="mt-1 text-xs" style={{ color: '#A09890' }}>로그인에 사용할 고유 아이디입니다.</p>
                        </div>

                        {/* Name */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-semibold mb-1.5" style={{ color: '#5C5650' }}>
                                이름 <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="name"
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="홍길동"
                                className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#B8860B] focus:border-transparent transition-shadow" style={{ borderColor: '#E8E4DE', color: '#2D2A26' }}
                            />
                        </div>

                        {/* Email (optional) */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-semibold mb-1.5" style={{ color: '#5C5650' }}>
                                이메일 <span className="font-normal" style={{ color: '#A09890' }}>(선택)</span>
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#B8860B] focus:border-transparent transition-shadow" style={{ borderColor: '#E8E4DE', color: '#2D2A26' }}
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-semibold mb-1.5" style={{ color: '#5C5650' }}>
                                비밀번호 <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="6자 이상"
                                className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#B8860B] focus:border-transparent transition-shadow" style={{ borderColor: '#E8E4DE', color: '#2D2A26' }}
                            />
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label htmlFor="confirm" className="block text-sm font-semibold mb-1.5" style={{ color: '#5C5650' }}>
                                비밀번호 확인 <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="confirm"
                                type="password"
                                required
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                                placeholder="비밀번호 재입력"
                                className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#B8860B] focus:border-transparent transition-shadow" style={{ borderColor: '#E8E4DE', color: '#2D2A26' }}
                            />
                        </div>

                        {/* Phone Number */}
                        <div>
                            <label htmlFor="phone" className="block text-sm font-semibold mb-1.5" style={{ color: '#5C5650' }}>
                                휴대폰 번호 <span className="text-red-500">*</span>
                            </label>
                            <div>
                                <input
                                    id="phone"
                                    type="tel"
                                    required
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="01012345678 (숫자만 입력)"
                                    className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#B8860B] focus:border-transparent transition-shadow"
                                    style={{ borderColor: '#E8E4DE', color: '#2D2A26' }}
                                />
                                <p className="mt-1.5 text-xs" style={{ color: '#A09890' }}>관리자가 가입 승인할 때 본인 확인에 씁니다.</p>
                            </div>
                        </div>

                        {/* Terms and Privacy Checkboxes */}
                        <div className="pt-2 border-t mt-4 space-y-3" style={{ borderColor: '#E8E4DE' }}>
                            <label className="flex items-start gap-3 cursor-pointer group">
                                <div className="flex items-center h-5">
                                    <input
                                        type="checkbox"
                                        checked={agreedToTerms}
                                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                                        className="w-4 h-4 rounded focus:ring-[#B8860B] cursor-pointer accent-[#B8860B]"
                                    />
                                </div>
                                <span className="text-sm transition-colors" style={{ color: '#5C5650' }}>
                                    [필수] 순천순동교회 홈페이지 서비스 이용약관에 동의합니다.
                                </span>
                            </label>

                            <label className="flex items-start gap-3 cursor-pointer group">
                                <div className="flex items-center h-5">
                                    <input
                                        type="checkbox"
                                        checked={agreedToPrivacy}
                                        onChange={(e) => setAgreedToPrivacy(e.target.checked)}
                                        className="w-4 h-4 rounded focus:ring-[#B8860B] cursor-pointer accent-[#B8860B]"
                                    />
                                </div>
                                <div className="text-sm transition-colors" style={{ color: '#5C5650' }}>
                                    <span className="block">[필수] 개인정보 수집 및 이용에 동의합니다.</span>
                                    <span className="block text-xs mt-0.5" style={{ color: '#A09890' }}>※ 수집항목: 이름, 휴대폰 번호 (회원 관리 및 교회 안내 문자 발송 목적)</span>
                                </div>
                            </label>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
                                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {error}
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg mt-2" style={{ background: '#B8860B' }}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                    </svg>
                                    처리 중...
                                </span>
                            ) : '회원가입하기'}
                        </button>
                    </form>

                    <p className="text-center text-sm mt-6" style={{ color: '#8B7355' }}>
                        이미 계정이 있으신가요?{' '}
                        <Link href="/auth/login" className="font-semibold hover:underline" style={{ color: '#B8860B' }}>
                            로그인
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}

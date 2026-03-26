'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
    const [username, setUsername] = useState('')
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [phone, setPhone] = useState('')
    const [smsCode, setSmsCode] = useState('')
    const [isPhoneVerified, setIsPhoneVerified] = useState(false)
    const [showSmsInput, setShowSmsInput] = useState(false)
    const [timeLeft, setTimeLeft] = useState(0)
    const [agreedToTerms, setAgreedToTerms] = useState(false)
    const [agreedToPrivacy, setAgreedToPrivacy] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [loading, setLoading] = useState(false)
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const supabase = createClient()

    // 컴포넌트 언마운트 시 타이머 정리
    useEffect(() => {
        return () => { if (timerRef.current) clearInterval(timerRef.current) }
    }, [])

    const formatTime = (sec: number) => {
        const m = Math.floor(sec / 60).toString().padStart(2, '0')
        const s = (sec % 60).toString().padStart(2, '0')
        return `${m}:${s}`
    }

    const handleSendVerificationCode = async () => {
        if (phone.length < 10) {
            setError('올바른 휴대폰 번호를 입력해 주세요.')
            return
        }
        setError(null)
        setLoading(true)
        try {
            const res = await fetch('/api/auth/sms/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone }),
            })
            const data = await res.json()
            if (!res.ok) {
                setError(data.error || 'SMS 발송에 실패했습니다.')
            } else {
                setShowSmsInput(true)
                setSmsCode('')
                if (timerRef.current) clearInterval(timerRef.current)
                setTimeLeft(300)
                timerRef.current = setInterval(() => {
                    setTimeLeft(prev => {
                        if (prev <= 1) {
                            if (timerRef.current) clearInterval(timerRef.current)
                            return 0
                        }
                        return prev - 1
                    })
                }, 1000)
            }
        } catch {
            setError('네트워크 오류가 발생했습니다. 다시 시도해 주세요.')
        } finally {
            setLoading(false)
        }
    }

    const handleVerifyCode = async () => {
        setError(null)
        setLoading(true)
        try {
            const res = await fetch('/api/auth/sms/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, code: smsCode }),
            })
            const data = await res.json()
            if (!res.ok) {
                setError(data.error || '인증번호 확인에 실패했습니다.')
            } else {
                setIsPhoneVerified(true)
                setShowSmsInput(false)
            }
        } catch {
            setError('네트워크 오류가 발생했습니다. 다시 시도해 주세요.')
        } finally {
            setLoading(false)
        }
    }

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
        if (!isPhoneVerified) {
            setError('휴대폰 인증을 진행해 주세요.')
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

        // Supabase auth는 이메일이 필수이므로 내부 이메일을 자동 생성합니다.
        const internalEmail = `${username.toLowerCase()}@internal.church`

        const { error, data } = await supabase.auth.signUp({
            email: internalEmail,
            password,
            options: {
                data: {
                    username,
                    name,
                    real_email: email.trim() || '',
                    phone_number: phone,
                },
            },
        })

        if (error) {
            if (error.message.includes('already registered') || error.message.includes('already been registered')) {
                setError('이미 사용 중인 아이디입니다.')
            } else {
                setError(error.message)
            }
            setLoading(false)
            return
        }

        if (data.session) {
            window.location.href = '/'
        } else {
            setSuccess(true)
        }
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
                        <h2 className="text-2xl font-extrabold mb-2" style={{ color: '#2D2A26', fontFamily: 'var(--font-serif)' }}>회원가입 완료!</h2>
                        <p className="mb-6 text-sm" style={{ color: '#8B7355' }}>
                            성공적으로 회원가입 되었습니다.<br />
                            아래 버튼을 눌러 로그인해 주세요.
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
                        <h1 className="text-2xl font-extrabold" style={{ color: '#2D2A26', fontFamily: 'var(--font-serif)' }}>교인 등록</h1>
                        <p className="text-sm mt-1" style={{ color: '#8B7355' }}>순천순동교회 교인으로 등록하세요</p>
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
                            <div className="flex gap-2">
                                <input
                                    id="phone"
                                    type="tel"
                                    required
                                    value={phone}
                                    onChange={(e) => {
                                        setPhone(e.target.value)
                                        setIsPhoneVerified(false)
                                    }}
                                    disabled={isPhoneVerified}
                                    placeholder="01012345678 (숫자만 입력)"
                                    className={`flex-1 px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#B8860B] focus:border-transparent transition-shadow ${isPhoneVerified ? 'cursor-not-allowed opacity-60' : ''}`}
                                    style={{ borderColor: '#E8E4DE', color: '#2D2A26' }}
                                />
                                <button
                                    type="button"
                                    onClick={handleSendVerificationCode}
                                    disabled={isPhoneVerified || phone.length < 10 || loading}
                                    className={`px-4 py-3 font-semibold rounded-xl whitespace-nowrap transition-colors text-sm ${
                                        isPhoneVerified
                                            ? 'bg-green-100 text-green-700 border border-green-200 cursor-not-allowed'
                                            : 'border disabled:opacity-50 disabled:cursor-not-allowed'
                                    }`}
                                    style={!isPhoneVerified ? { background: '#B8860B1A', color: '#B8860B', borderColor: '#B8860B33' } : undefined}
                                >
                                    {isPhoneVerified ? '인증 완료' : loading ? '발송 중...' : '인증번호 받기'}
                                </button>
                            </div>
                        </div>

                        {/* SMS Verification Input */}
                        {showSmsInput && !isPhoneVerified && (
                            <div className="p-4 rounded-xl border mt-2" style={{ background: '#B8860B08', borderColor: '#B8860B22' }}>
                                <div className="flex justify-between items-center mb-1.5">
                                    <label htmlFor="smsCode" className="text-sm font-semibold" style={{ color: '#2D2A26' }}>
                                        인증번호 입력
                                    </label>
                                    <span className={`text-sm font-mono font-semibold ${timeLeft <= 60 ? 'text-red-500' : ''}`} style={timeLeft > 60 ? { color: '#B8860B' } : undefined}>
                                        {timeLeft > 0 ? formatTime(timeLeft) : '만료됨'}
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        id="smsCode"
                                        type="text"
                                        value={smsCode}
                                        onChange={(e) => setSmsCode(e.target.value)}
                                        placeholder="인증번호 6자리"
                                        maxLength={6}
                                        className="flex-1 px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#B8860B] focus:border-transparent"
                                        style={{ borderColor: '#E8E4DE', color: '#2D2A26' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleVerifyCode}
                                        disabled={timeLeft <= 0 || loading}
                                        className="px-4 py-2.5 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        style={{ background: '#B8860B' }}
                                    >
                                        확인
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleSendVerificationCode}
                                    disabled={loading}
                                    className="mt-2 text-xs hover:underline disabled:opacity-50 transition-colors"
                                    style={{ color: '#B8860B' }}
                                >
                                    {loading ? '발송 중...' : '인증번호 재발송'}
                                </button>
                            </div>
                        )}

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
                                    <span className="block text-xs mt-0.5" style={{ color: '#A09890' }}>※ 수집항목: 이름, 휴대폰 번호 (교인 관리 및 교회 안내 문자 발송 목적)</span>
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
                            ) : '교인 등록하기'}
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

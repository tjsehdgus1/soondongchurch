'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        if (timeLeft <= 0) {
            if (timerRef.current) clearInterval(timerRef.current)
            return
        }
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => prev - 1)
        }, 1000)
        return () => { if (timerRef.current) clearInterval(timerRef.current) }
    }, [timeLeft])

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
                setTimeLeft(300)
                setSmsCode('')
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
            router.push('/')
        } else {
            setSuccess(true)
        }
        setLoading(false)
    }

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-md text-center">
                    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-10">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-extrabold text-gray-900 mb-2">회원가입 완료!</h2>
                        <p className="text-gray-500 mb-6 text-sm">
                            성공적으로 회원가입 되었습니다.<br />
                            아래 버튼을 눌러 로그인해 주세요.
                        </p>
                        <Link href="/auth/login"
                            className="block w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors">
                            로그인 화면으로 가기
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 rounded-md overflow-hidden mx-auto mb-4 shadow-lg">
                            <img src="/images/logo.svg" alt="순천순동교회 로고" className="w-full h-full object-cover" />
                        </div>
                        <h1 className="text-2xl font-extrabold text-gray-900">교인 등록</h1>
                        <p className="text-gray-500 text-sm mt-1">순천순동교회 교인으로 등록하세요</p>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-4">
                        {/* Username */}
                        <div>
                            <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-1.5">
                                아이디 <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="username"
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="영문, 숫자, 밑줄(_) 3~20자"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-shadow"
                            />
                            <p className="mt-1 text-xs text-gray-400">로그인에 사용할 고유 아이디입니다.</p>
                        </div>

                        {/* Name */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1.5">
                                이름 <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="name"
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="홍길동"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-shadow"
                            />
                        </div>

                        {/* Email (optional) */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">
                                이메일 <span className="text-gray-400 font-normal">(선택)</span>
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-shadow"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1.5">
                                비밀번호 <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="6자 이상"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-shadow"
                            />
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label htmlFor="confirm" className="block text-sm font-semibold text-gray-700 mb-1.5">
                                비밀번호 확인 <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="confirm"
                                type="password"
                                required
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                                placeholder="비밀번호 재입력"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-shadow"
                            />
                        </div>

                        {/* Phone Number */}
                        <div>
                            <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-1.5">
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
                                    className={`flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-shadow ${isPhoneVerified ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                                />
                                <button
                                    type="button"
                                    onClick={handleSendVerificationCode}
                                    disabled={isPhoneVerified || phone.length < 10 || loading}
                                    className={`px-4 py-3 font-semibold rounded-xl whitespace-nowrap transition-colors ${
                                        isPhoneVerified
                                            ? 'bg-green-100 text-green-700 border border-green-200 cursor-not-allowed'
                                            : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed'
                                    }`}
                                >
                                    {isPhoneVerified ? '인증 완료' : loading ? '발송 중...' : '인증번호 받기'}
                                </button>
                            </div>
                        </div>

                        {/* SMS Verification Input */}
                        {showSmsInput && !isPhoneVerified && (
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mt-2">
                                <div className="flex justify-between items-center mb-1.5">
                                    <label htmlFor="smsCode" className="text-sm font-semibold text-blue-800">
                                        인증번호 입력
                                    </label>
                                    <span className={`text-sm font-mono font-semibold ${timeLeft <= 60 ? 'text-red-500' : 'text-blue-600'}`}>
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
                                        className="flex-1 px-4 py-2.5 rounded-lg border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-blue-300"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleVerifyCode}
                                        disabled={timeLeft <= 0 || loading}
                                        className="px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        확인
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleSendVerificationCode}
                                    disabled={loading}
                                    className="mt-2 text-xs text-blue-500 hover:text-blue-700 hover:underline disabled:opacity-50 transition-colors"
                                >
                                    {loading ? '발송 중...' : '인증번호 재발송'}
                                </button>
                            </div>
                        )}

                        {/* Terms and Privacy Checkboxes */}
                        <div className="pt-2 border-t border-gray-100 mt-4 space-y-3">
                            <label className="flex items-start gap-3 cursor-pointer group">
                                <div className="flex items-center h-5">
                                    <input
                                        type="checkbox"
                                        checked={agreedToTerms}
                                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                    />
                                </div>
                                <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                                    [필수] 순천순동교회 홈페이지 서비스 이용약관에 동의합니다.
                                </span>
                            </label>

                            <label className="flex items-start gap-3 cursor-pointer group">
                                <div className="flex items-center h-5">
                                    <input
                                        type="checkbox"
                                        checked={agreedToPrivacy}
                                        onChange={(e) => setAgreedToPrivacy(e.target.checked)}
                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                    />
                                </div>
                                <div className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                                    <span className="block">[필수] 개인정보 수집 및 이용에 동의합니다.</span>
                                    <span className="block text-xs text-gray-500 mt-0.5">※ 수집항목: 이름, 휴대폰 번호 (교인 관리 및 교회 안내 문자 발송 목적)</span>
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
                            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg mt-2"
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

                    <p className="text-center text-sm text-gray-500 mt-6">
                        이미 계정이 있으신가요?{' '}
                        <Link href="/auth/login" className="text-blue-600 font-semibold hover:underline">
                            로그인
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}

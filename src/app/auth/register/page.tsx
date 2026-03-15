'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [phone, setPhone] = useState('')
    const [smsCode, setSmsCode] = useState('')
    const [isPhoneVerified, setIsPhoneVerified] = useState(false)
    const [showSmsInput, setShowSmsInput] = useState(false)
    const [agreedToTerms, setAgreedToTerms] = useState(false)
    const [agreedToPrivacy, setAgreedToPrivacy] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleSendVerificationCode = () => {
        if (phone.length < 10) {
            setError('올바른 휴대폰 번호를 입력해 주세요.')
            return
        }
        setError(null)
        // 실제 운영 시에는 여기서 SMS 발송 API를 호출합니다.
        // 현재는 모의 처리로 진행합니다.
        alert(`입력하신 번호(${phone})로 인증번호 '1234'가 발송되었습니다. (테스트용)`)
        setShowSmsInput(true)
    }

    const handleVerifyCode = () => {
        if (smsCode === '1234') { // 테스트용 모의 인증번호
            setIsPhoneVerified(true)
            setShowSmsInput(false)
            setError(null)
            alert('휴대폰 인증이 완료되었습니다.')
        } else {
            setError('인증번호가 일치하지 않습니다. 다시 확인해 주세요.')
        }
    }

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

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

        const { error, data } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { 
                    name, 
                    phone_number: phone, 
                },
            },
        })

        if (error) {
            setError(error.message === 'User already registered' ? '이미 사용 중인 이메일입니다.' : error.message)
            setLoading(false)
            return
        }

        // 가입 성공 시 세션이 있으면(이메일 인증이 꺼져있으면) 바로 메인으로 이동
        if (data.session) {
             router.push('/')
        } else {
             // 이메일 인증이 켜져 있는 경우의 폴백
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
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <span className="text-white text-2xl">✝</span>
                        </div>
                        <h1 className="text-2xl font-extrabold text-gray-900">교인 등록</h1>
                        <p className="text-gray-500 text-sm mt-1">순천순동교회 교인으로 등록하세요</p>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-4">
                        {/* Name */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1.5">이름</label>
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

                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">이메일</label>
                            <input
                                id="email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-shadow"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1.5">비밀번호</label>
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
                            <label htmlFor="confirm" className="block text-sm font-semibold text-gray-700 mb-1.5">비밀번호 확인</label>
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
                            <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-1.5">휴대폰 번호</label>
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
                                    disabled={isPhoneVerified || phone.length < 10}
                                    className={`px-4 py-3 font-semibold rounded-xl whitespace-nowrap transition-colors ${
                                        isPhoneVerified 
                                            ? 'bg-green-100 text-green-700 border border-green-200 cursor-not-allowed' 
                                            : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                                    }`}
                                >
                                    {isPhoneVerified ? '인증 완료' : '인증번호 받기'}
                                </button>
                            </div>
                        </div>

                        {/* SMS Verification Input */}
                        {showSmsInput && !isPhoneVerified && (
                             <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mt-2">
                                <label htmlFor="smsCode" className="block text-sm font-semibold text-blue-800 mb-1.5 flex justify-between">
                                    <span>인증번호 입력</span>
                                    <span className="text-xs text-blue-600 font-normal">테스트 모드: 1234 입력</span>
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        id="smsCode"
                                        type="text"
                                        value={smsCode}
                                        onChange={(e) => setSmsCode(e.target.value)}
                                        placeholder="인증번호 4자리"
                                        className="flex-1 px-4 py-2.5 rounded-lg border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-blue-300"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleVerifyCode}
                                        className="px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        확인
                                    </button>
                                </div>
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
                                    <span className="block text-xs text-gray-500 mt-0.5">※ 수집항목: 이름, 이메일, 휴대폰 번호 (교인 관리 및 교회 안내 문자 발송 목적)</span>
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

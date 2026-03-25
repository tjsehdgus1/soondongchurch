'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// [리팩토링] useRouter import 제거
// router.refresh()는 void를 반환 — await해도 완료를 보장하지 않음
// refresh() + push() 조합은 경쟁 조건 유발: 서버가 세션 쿠키를 읽기 전에
// 클라이언트가 페이지 이동을 시작해 데이터 패칭이 무한 대기(Pending) 상태에 빠짐
// window.location.href로 전체 페이지 리로드 시 미들웨어 → layout → page 순으로
// 서버가 세션을 완전히 읽은 후 렌더링을 시작하므로 경쟁 조건 원천 차단

function BlockedBanner() {
    const params = useSearchParams()
    if (!params.get('blocked')) return null
    return (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2 mb-4">
            <span className="text-base">🚫</span>
            이 계정은 관리자에 의해 차단되었습니다. 문의사항은 교회로 연락해주세요.
        </div>
    )
}

function ErrorBanner() {
    const params = useSearchParams()
    if (!params.get('error')) return null
    return (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2 mb-4">
            <span className="text-base">⚠️</span>
            로그인 인증 처리 중 오류가 발생했습니다. 다시 시도해주세요.
        </div>
    )
}

export default function LoginPage() {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    // [리팩토링] 싱글톤 클라이언트 — 리렌더 시 재생성 없음
    const supabase = createClient()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const internalEmail = `${username.trim().toLowerCase()}@internal.church`
        const { error } = await supabase.auth.signInWithPassword({ email: internalEmail, password })

        if (error) {
            setError('아이디 또는 비밀번호가 올바르지 않습니다.')
            setLoading(false)
            return
        }

        // [리팩토링] router.refresh() + router.push() 제거 → window.location.href 사용
        // 이유: refresh()는 완료를 보장하지 않아 세션 미확립 상태로 push()가 실행됨
        // window.location.href는 브라우저가 전체 요청을 새로 시작하므로
        // 미들웨어가 세션 쿠키를 갱신하고, layout이 getUser()를 완전히 완료한 뒤 렌더링
        window.location.href = '/'
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                {/* Card */}
                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 rounded-md overflow-hidden mx-auto mb-4 shadow-lg">
                            <img src="/images/logo.svg" alt="순천순동교회 로고" className="w-full h-full object-cover" />
                        </div>
                        <h1 className="text-2xl font-extrabold text-gray-900">로그인</h1>
                        <p className="text-gray-500 text-sm mt-1">순천순동교회 교인 계정으로 로그인하세요</p>
                    </div>

                    <Suspense>
                        <BlockedBanner />
                        <ErrorBanner />
                    </Suspense>

                    <form onSubmit={handleLogin} className="space-y-5">
                        {/* Username */}
                        <div>
                            <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-1.5">
                                아이디
                            </label>
                            <input
                                id="username"
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="아이디를 입력하세요"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-shadow"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1.5">
                                비밀번호
                            </label>
                            <input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="비밀번호를 입력하세요"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-shadow"
                            />
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
                            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                    </svg>
                                    로그인 중...
                                </span>
                            ) : '로그인'}
                        </button>
                    </form>

                    <p className="text-center text-sm text-gray-500 mt-6">
                        계정이 없으신가요?{' '}
                        <Link href="/auth/register" className="text-blue-600 font-semibold hover:underline">
                            회원가입
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}

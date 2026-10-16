import { NOINDEX } from '@/lib/seo'

// 로그인·회원가입·아이디 찾기 화면은 검색 결과에서 뺌
export const metadata = { title: '로그인', ...NOINDEX }

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return children
}

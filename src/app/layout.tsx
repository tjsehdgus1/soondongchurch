import type { Metadata } from 'next'
import { ViewTransition } from 'react'
import { Noto_Serif_KR } from 'next/font/google'
import './globals.css'
import SiteHeader from '@/components/site/SiteHeader'
import SmoothScroll from '@/components/motion/SmoothScroll'
import VideoModalProvider from '@/components/video/VideoModal'
import Footer from '@/components/Footer'
import { AdminProvider } from '@/components/admin/AdminContext'
import AdminPageBar from '@/components/admin/AdminPageBar'
import { createClient } from '@/lib/supabase/server'

// 제목용 세리프: 한글 글꼴은 조각 파일이 많아 미리 받지 않음(preload: false) — 본문 표시를 막지 않도록
// 600은 700으로 대체되므로 400·700만 사용
const notoSerifKR = Noto_Serif_KR({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-serif',
  display: 'swap',
  preload: false,
})

export const metadata: Metadata = {
  title: '순천순동교회 | Suncheon Sundong Church',
  description: '순천순동교회 공식 홈페이지입니다.',
  keywords: ['교회', '순천순동교회', '순천', '예배', '성경', '기도'],
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let initialRole = 'member'
  let initialUserName = ''
  // 관리자 버튼 표시용 (실제 권한은 관리자 API·RLS가 검사)
  let isAdmin = false
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, name, is_blocked')
      .eq('id', user.id)
      .single()
    if (profile) {
      initialRole = profile.role ?? 'member'
      initialUserName = profile.name ?? ''
      isAdmin = profile.role === 'admin' && !profile.is_blocked
    }
  }

  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        {/* 첫 페인트 전에 JS 사용 표시 → 등장 애니메이션 대상만 초기 숨김 (globals.css) */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
        <link rel="stylesheet" as="style" crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />
      </head>
      <body className={`${notoSerifKR.variable} antialiased`}>
        <SmoothScroll />
        <SiteHeader
          initialLoggedIn={!!user}
          initialRole={initialRole}
          initialUserName={initialUserName}
        />
        <AdminProvider isAdmin={isAdmin}>
          <VideoModalProvider>
            <ViewTransition>
              <main className="min-h-screen pt-16 lg:pt-20">
                {children}
              </main>
            </ViewTransition>
          </VideoModalProvider>
          <AdminPageBar />
        </AdminProvider>
        <Footer />
      </body>
    </html>
  )
}

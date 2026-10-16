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
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, SITE_URL } from '@/lib/site'

// 제목용 세리프: 한글 글꼴은 조각 파일이 많아 미리 받지 않음(preload: false) — 본문 표시를 막지 않도록
// 600은 700으로 대체되므로 400·700만 사용
const notoSerifKR = Noto_Serif_KR({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-serif',
  display: 'swap',
  preload: false,
})

// 검색·공유 미리보기 기본값 — 각 페이지는 title(짧게)·description·alternates.canonical만 정하면 됨
// 검색 등록 확인 코드는 Vercel 환경변수로 (구글 서치 콘솔·네이버 서치어드바이저에서 발급)
const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
const naverVerification = process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: ['순천순동교회', '순동교회', '순천 교회', '순천시 교회', '순천 예배', '전남 순천 교회', '장로교회', '예배 시간'],
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    siteName: SITE_NAME,
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    images: [{ url: '/og.jpg', width: 1200, height: 630, alt: `${SITE_NAME} — ${SITE_TAGLINE}` }],
  },
  twitter: { card: 'summary_large_image', images: ['/og.jpg'] },
  formatDetection: { telephone: false, address: false, email: false },
  ...(googleVerification || naverVerification
    ? {
      verification: {
        ...(googleVerification ? { google: googleVerification } : {}),
        ...(naverVerification ? { other: { 'naver-site-verification': naverVerification } } : {}),
      },
    }
    : {}),
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
  let canManageSite = false
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, name, is_blocked, can_manage_site')
      .eq('id', user.id)
      .single()
    if (profile) {
      initialRole = profile.role ?? 'member'
      initialUserName = profile.name ?? ''
      isAdmin = profile.role === 'admin' && !profile.is_blocked
      canManageSite = isAdmin && !!profile.can_manage_site
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
        <AdminProvider isAdmin={isAdmin} canManageSite={canManageSite}>
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

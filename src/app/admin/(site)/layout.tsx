import { redirect } from 'next/navigation'
import { verifySiteManager } from '@/lib/admin'

// 사이트 설정 화면(게시판 관리·페이지 문구·연혁·섬기는 분들·선교지)은 사이트 설정 관리자만
// 주소는 그대로(/admin/boards 등) — (site)는 경로에 나타나지 않는 묶음 폴더
export default async function SiteSettingsLayout({ children }: { children: React.ReactNode }) {
    if (!(await verifySiteManager())) redirect('/admin')
    return <>{children}</>
}

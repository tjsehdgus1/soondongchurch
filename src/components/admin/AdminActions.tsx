'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useIsAdmin } from '@/components/admin/AdminContext'

interface AdminActionsProps {
    // 수정 화면 주소 (관리 화면의 ?edit=번호)
    editHref?: string
    // 삭제 API 주소 (DELETE)
    deleteUrl?: string
    deleteConfirm?: string
    // 삭제 후 이동할 주소 (없으면 현재 화면 새로고침)
    afterDelete?: string
    className?: string
}

// 사용자 화면에 붙는 관리자 전용 수정·삭제 버튼 (관리자가 아니면 아무것도 그리지 않음)
export default function AdminActions({ editHref, deleteUrl, deleteConfirm = '삭제하시겠습니까?\n되돌릴 수 없습니다.', afterDelete, className }: AdminActionsProps) {
    const isAdmin = useIsAdmin()
    const router = useRouter()
    const [deleting, setDeleting] = useState(false)
    if (!isAdmin) return null

    const handleDelete = async () => {
        if (!deleteUrl || !confirm(deleteConfirm)) return
        setDeleting(true)
        const res = await fetch(deleteUrl, { method: 'DELETE' })
        if (!res.ok) {
            const json = await res.json().catch(() => ({}))
            alert('삭제하지 못했습니다: ' + (json.error ?? res.status))
            setDeleting(false)
            return
        }
        if (afterDelete) window.location.href = afterDelete
        else {
            router.refresh()
            setDeleting(false)
        }
    }

    return (
        <div className={`flex gap-2 ${className ?? ''}`}>
            {editHref && (
                <Link href={editHref} className="px-4 py-2 text-sm font-medium bg-white border border-[#E8E4DE] text-[#5C5650] rounded-xl hover:border-[#2D2A26] hover:text-[#2D2A26] transition-colors">
                    수정
                </Link>
            )}
            {deleteUrl && (
                <button type="button" onClick={handleDelete} disabled={deleting}
                    className="px-4 py-2 text-sm font-medium bg-white border border-red-200 text-red-500 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50 cursor-pointer">
                    {deleting ? '삭제 중…' : '삭제'}
                </button>
            )}
        </div>
    )
}

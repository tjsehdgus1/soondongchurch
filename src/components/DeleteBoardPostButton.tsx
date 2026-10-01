'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function DeleteBoardPostButton({ postId, redirectTo }: { postId: number, redirectTo: string }) {
    const [deleting, setDeleting] = useState(false)
    const supabase = createClient()

    const handleDelete = async () => {
        if (!confirm('이 게시글을 삭제하시겠습니까?')) return
        setDeleting(true)
        const { error } = await supabase.from('board_posts').delete().eq('id', postId)
        if (error) {
            alert('삭제 실패: ' + error.message)
            setDeleting(false)
            return
        }
        window.location.href = redirectTo
    }

    return (
        <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-5 py-2.5 text-sm font-medium text-red-500 bg-white border border-red-200 rounded-xl disabled:opacity-50 cursor-pointer"
        >
            {deleting ? '삭제 중...' : '삭제'}
        </button>
    )
}

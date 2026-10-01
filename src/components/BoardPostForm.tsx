'use client'

import { useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'
import { firstImageSrc, parseYoutubeId } from '@/lib/boards'

const TiptapEditor = dynamic(() => import('@/components/TiptapEditor'), { ssr: false })

export type BoardPostFormValues = {
    id?: number
    title: string
    content: string
    category: string | null
    youtube_id: string | null
    is_pinned: boolean
    members_only: boolean
}

interface BoardPostFormProps {
    board: { id: number, slug: string, name: string, categories: string[] }
    isAdmin: boolean
    initial?: BoardPostFormValues
}

export default function BoardPostForm({ board, isAdmin, initial }: BoardPostFormProps) {
    const supabase = createClient()
    const [title, setTitle] = useState(initial?.title ?? '')
    const [content, setContent] = useState(initial?.content ?? '')
    const [category, setCategory] = useState(initial?.category ?? board.categories[0] ?? '')
    const [youtubeUrl, setYoutubeUrl] = useState(initial?.youtube_id ? `https://youtu.be/${initial.youtube_id}` : '')
    const [isPinned, setIsPinned] = useState(initial?.is_pinned ?? false)
    const [membersOnly, setMembersOnly] = useState(initial?.members_only ?? false)
    const [sizeExceeded, setSizeExceeded] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    const listHref = `/board/${board.slug}`

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const youtubeId = youtubeUrl.trim() ? parseYoutubeId(youtubeUrl) : null
        if (youtubeUrl.trim() && !youtubeId) {
            alert('유튜브 주소를 확인해 주세요.')
            return
        }
        const emptyContent = !content || content === '<p></p>'
        if (!title.trim() || (emptyContent && !youtubeId)) {
            alert('제목과 내용(또는 유튜브 영상)을 입력해 주세요.')
            return
        }
        if (sizeExceeded) {
            alert('내용이 너무 큽니다. 줄여서 다시 시도해 주세요.')
            return
        }
        setSubmitting(true)

        const values = {
            title: title.trim(),
            content: emptyContent ? '' : content,
            category: board.categories.length > 0 ? category : null,
            youtube_id: youtubeId,
            thumbnail_url: firstImageSrc(content),
            // 고정·회원전용은 관리자만 변경 (작성자가 수정해도 관리자 설정 유지)
            ...(isAdmin ? { is_pinned: isPinned, members_only: membersOnly } : {}),
        }

        // 작성자(author_id, author_name)는 DB 트리거가 설정
        const { data, error } = initial?.id
            ? await supabase.from('board_posts').update(values).eq('id', initial.id).select('id').single()
            : await supabase.from('board_posts').insert({ ...values, board_id: board.id }).select('id').single()

        if (error || !data) {
            alert('저장 실패: ' + (error?.message ?? '알 수 없는 오류'))
            setSubmitting(false)
            return
        }
        // 서버 컴포넌트 목록이 새 데이터로 다시 렌더되도록 전체 이동
        window.location.href = `${listHref}/${data.id}`
    }

    const inputStyle = { borderColor: '#E8E4DE', color: '#2D2A26' }
    const inputClass = 'w-full px-4 py-3 border rounded-xl text-base outline-none focus:ring-2 focus:ring-[#B8860B] focus:border-transparent'

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {board.categories.length > 0 && (
                <div>
                    <label htmlFor="category" className="block text-sm font-semibold mb-1.5" style={{ color: '#5C5650' }}>말머리</label>
                    <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass} style={inputStyle}>
                        {board.categories.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            )}

            <div>
                <label htmlFor="title" className="block text-sm font-semibold mb-1.5" style={{ color: '#5C5650' }}>
                    제목 <span className="text-red-500">*</span>
                </label>
                <input id="title" required type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                    placeholder="게시글 제목" className={inputClass} style={inputStyle} />
            </div>

            <div>
                <label htmlFor="youtube" className="block text-sm font-semibold mb-1.5" style={{ color: '#5C5650' }}>유튜브 영상 주소 (선택)</label>
                <input id="youtube" type="url" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://youtu.be/..." className={inputClass} style={inputStyle} />
            </div>

            <div>
                <p className="block text-sm font-semibold mb-1.5" style={{ color: '#5C5650' }}>내용</p>
                <TiptapEditor content={content} onChange={setContent} onSizeError={setSizeExceeded} bucket="board-images" />
                {sizeExceeded && <p className="mt-1.5 text-sm text-red-500">내용이 너무 큽니다. 텍스트를 줄여주세요.</p>}
            </div>

            {isAdmin && (
                <div className="flex flex-wrap gap-6 text-sm" style={{ color: '#5C5650' }}>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={isPinned} onChange={(e) => setIsPinned(e.target.checked)} className="w-4 h-4 accent-[#B8860B]" />
                        상단 고정
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={membersOnly} onChange={(e) => setMembersOnly(e.target.checked)} className="w-4 h-4 accent-[#B8860B]" />
                        로그인 회원만 보기
                    </label>
                </div>
            )}

            <div className="flex gap-3 pt-2">
                <Link href={initial?.id ? `${listHref}/${initial.id}` : listHref}
                    className="flex-1 text-center px-4 py-3 border text-sm font-medium rounded-xl"
                    style={{ borderColor: '#E8E4DE', color: '#5C5650' }}
                >
                    취소
                </Link>
                <button type="submit" disabled={submitting || sizeExceeded}
                    className="flex-1 text-white font-bold py-3 rounded-xl disabled:opacity-50 shadow-sm text-sm cursor-pointer"
                    style={{ background: '#B8860B' }}
                >
                    {submitting ? '저장 중...' : initial?.id ? '수정 완료' : '게시글 올리기'}
                </button>
            </div>
        </form>
    )
}

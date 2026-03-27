'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

interface SermonFiltersProps {
    allTags: string[]
    currentQ: string
    currentTag: string
}

export default function SermonFilters({ allTags, currentQ, currentTag }: SermonFiltersProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [q, setQ] = useState(currentQ)
    const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null)

    useEffect(() => {
        if (debounceTimer) clearTimeout(debounceTimer)
        const timer = setTimeout(() => {
            const params = new URLSearchParams(searchParams)
            if (q.trim()) {
                params.set('q', q.trim())
                params.delete('page')
            } else {
                params.delete('q')
            }
            router.replace(`?${params.toString()}`)
        }, 300)
        setDebounceTimer(timer)
        return () => clearTimeout(timer)
    }, [q])

    const toggleTag = (tag: string) => {
        const params = new URLSearchParams(searchParams)
        if (currentTag === tag) {
            params.delete('tag')
        } else {
            params.set('tag', tag)
            params.delete('page')
        }
        router.replace(`?${params.toString()}`)
    }

    const clearFilters = () => {
        setQ('')
        router.replace('/')
    }

    return (
        <div className="space-y-4">
            {/* 검색 */}
            <div>
                <input
                    type="text"
                    placeholder="설교 제목이나 요약으로 검색..."
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm"
                />
            </div>

            {/* 태그 필터 */}
            {allTags.length > 0 && (
                <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">태그</p>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={clearFilters}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                !currentTag
                                    ? 'bg-amber-100 text-amber-700 border border-amber-300'
                                    : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-150'
                            }`}
                        >
                            전체
                        </button>
                        {allTags.map((tag) => (
                            <button
                                key={tag}
                                onClick={() => toggleTag(tag)}
                                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                    currentTag === tag
                                        ? 'bg-amber-100 text-amber-700 border border-amber-300'
                                        : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-150'
                                }`}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

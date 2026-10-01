import Link from 'next/link'

interface PaginationProps {
    page: number
    totalPages: number
    // 페이지 번호 → 이동 주소
    hrefOf: (page: number) => string
}

export default function Pagination({ page, totalPages, hrefOf }: PaginationProps) {
    if (totalPages <= 1) return null
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

    return (
        <nav className="flex justify-center flex-wrap gap-1.5 mt-10" aria-label="페이지 이동">
            {pages.map((p) => (
                <Link
                    key={p}
                    href={hrefOf(p)}
                    aria-current={p === page ? 'page' : undefined}
                    className={`min-w-10 h-10 px-3 flex items-center justify-center rounded-lg text-sm font-medium border transition-colors ${p === page
                        ? 'text-white border-transparent'
                        : 'bg-white hover:bg-[#F2EFE9]'
                        }`}
                    style={p === page ? { background: '#B8860B' } : { borderColor: '#E8E4DE', color: '#5C5650' }}
                >
                    {p}
                </Link>
            ))}
        </nav>
    )
}

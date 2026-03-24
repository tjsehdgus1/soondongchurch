'use client'

import dynamic from 'next/dynamic'

const PdfViewer = dynamic(() => import('@/components/PdfViewer'), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center h-96 text-gray-400">
            <div className="flex flex-col items-center gap-3">
                <svg className="animate-spin w-8 h-8" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span className="text-sm">뷰어 로딩 중...</span>
            </div>
        </div>
    ),
})

export default function PdfViewerClient({ fileUrl }: { fileUrl: string }) {
    return <PdfViewer fileUrl={fileUrl} />
}

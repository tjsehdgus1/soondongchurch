'use client'

import { useState, useCallback, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface PdfViewerProps {
    fileUrl: string
}

export default function PdfViewer({ fileUrl }: PdfViewerProps) {
    const [numPages, setNumPages] = useState<number>(0)
    const [pageNumber, setPageNumber] = useState(1)
    const [scale, setScale] = useState(1.0)
    const [loading, setLoading] = useState(true)
    const [containerWidth, setContainerWidth] = useState(800)

    useEffect(() => {
        const update = () => setContainerWidth(Math.min(window.innerWidth - 32, 800))
        update()
        window.addEventListener('resize', update)
        return () => window.removeEventListener('resize', update)
    }, [])

    const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
        setNumPages(numPages)
        setLoading(false)
    }, [])

    return (
        <div className="flex flex-col items-center w-full">
            {/* 컨트롤 바 */}
            <div className="sticky top-16 z-10 w-full max-w-3xl bg-white/90 backdrop-blur border border-gray-200 rounded-xl shadow-sm px-4 py-2.5 mb-4 flex items-center justify-between gap-2">
                {/* 페이지 이동 */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setPageNumber(p => Math.max(1, p - 1))}
                        disabled={pageNumber <= 1}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <span className="text-sm font-medium text-gray-700 min-w-[60px] text-center">
                        {loading ? '-' : `${pageNumber} / ${numPages}`}
                    </span>
                    <button
                        onClick={() => setPageNumber(p => Math.min(numPages, p + 1))}
                        disabled={pageNumber >= numPages}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>

                {/* 확대/축소 */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setScale(s => Math.max(0.5, s - 0.25))}
                        disabled={scale <= 0.5}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 transition-colors text-lg font-bold"
                    >
                        −
                    </button>
                    <span className="text-sm font-medium text-gray-700 min-w-[44px] text-center">
                        {Math.round(scale * 100)}%
                    </span>
                    <button
                        onClick={() => setScale(s => Math.min(2.5, s + 0.25))}
                        disabled={scale >= 2.5}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 transition-colors text-lg font-bold"
                    >
                        +
                    </button>
                </div>

                {/* 다운로드 */}
                <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-600"
                    title="PDF 다운로드"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                </a>
            </div>

            {/* PDF 렌더링 */}
            <div className="w-full max-w-3xl overflow-x-auto">
                <Document
                    file={fileUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    loading={
                        <div className="flex items-center justify-center h-96">
                            <div className="flex flex-col items-center gap-3 text-gray-400">
                                <svg className="animate-spin w-8 h-8" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                </svg>
                                <span className="text-sm">주보를 불러오는 중...</span>
                            </div>
                        </div>
                    }
                    error={
                        <div className="flex items-center justify-center h-96 text-red-400 text-sm">
                            PDF를 불러올 수 없습니다.
                        </div>
                    }
                >
                    <Page
                        pageNumber={pageNumber}
                        width={containerWidth * scale}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        className="shadow-lg rounded-lg overflow-hidden mx-auto"
                    />
                </Document>
            </div>

            {/* 하단 페이지 이동 (모바일용 큰 버튼) */}
            {numPages > 1 && (
                <div className="flex gap-4 mt-6 w-full max-w-xs">
                    <button
                        onClick={() => setPageNumber(p => Math.max(1, p - 1))}
                        disabled={pageNumber <= 1}
                        className="flex-1 py-3 rounded-xl border border-gray-200 font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-30 transition-colors"
                    >
                        이전 페이지
                    </button>
                    <button
                        onClick={() => setPageNumber(p => Math.min(numPages, p + 1))}
                        disabled={pageNumber >= numPages}
                        className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-30 transition-colors"
                    >
                        다음 페이지
                    </button>
                </div>
            )}
        </div>
    )
}

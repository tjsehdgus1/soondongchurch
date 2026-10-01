import Link from 'next/link'
import { type BoardPostSummary, formatDate, postThumbnail } from '@/lib/boards'

interface BoardPostListProps {
    posts: BoardPostSummary[]
    kind: 'list' | 'card'
    // 게시글 → 게시판 slug (전체글 목록처럼 여러 게시판이 섞일 때)
    slugOf: (post: BoardPostSummary) => string
    boardNameOf?: (post: BoardPostSummary) => string
}

function Badges({ post }: { post: BoardPostSummary }) {
    return (
        <>
            {post.is_pinned && (
                <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full mr-1.5 align-middle" style={{ background: '#B8860B1A', color: '#B8860B' }}>📌 고정</span>
            )}
            {post.members_only && (
                <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full mr-1.5 align-middle bg-gray-100 text-gray-500">🔒 회원</span>
            )}
            {post.category && (
                <span className="text-sm font-medium mr-1.5" style={{ color: '#B8860B' }}>[{post.category}]</span>
            )}
        </>
    )
}

export default function BoardPostList({ posts, kind, slugOf, boardNameOf }: BoardPostListProps) {
    if (posts.length === 0) {
        return (
            <div className="text-center py-24 text-gray-400">
                <p className="text-4xl mb-3">📋</p>
                <p className="font-medium">등록된 게시글이 없습니다.</p>
            </div>
        )
    }

    if (kind === 'card') {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post) => {
                    const thumb = postThumbnail(post)
                    return (
                        <Link
                            key={post.id}
                            href={`/board/${slugOf(post)}/${post.id}`}
                            className="group bg-white rounded-2xl overflow-hidden border shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all flex flex-col"
                            style={{ borderColor: '#E8E4DE' }}
                        >
                            <div className="relative aspect-video bg-[#F2EFE9] overflow-hidden">
                                {thumb ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={thumb} alt="" loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-4xl" style={{ color: '#C8C2B8' }}>✝</div>
                                )}
                                {post.youtube_id && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-12 h-12 rounded-full bg-black/55 flex items-center justify-center">
                                            <svg className="w-5 h-5 text-white translate-x-0.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="p-4 flex-1">
                                {boardNameOf && <p className="text-xs mb-1" style={{ color: '#A09890' }}>{boardNameOf(post)}</p>}
                                <h3 className="font-bold leading-snug line-clamp-2" style={{ color: '#2D2A26' }}>
                                    <Badges post={post} />{post.title}
                                </h3>
                                <p className="text-sm mt-2" style={{ color: '#8B7355' }}>{post.author_name} · {formatDate(post.created_at)}</p>
                            </div>
                        </Link>
                    )
                })}
            </div>
        )
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border divide-y" style={{ borderColor: '#E8E4DE' }}>
            {posts.map((post) => (
                <Link
                    key={post.id}
                    href={`/board/${slugOf(post)}/${post.id}`}
                    className="flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-[#B8860B08]"
                >
                    <div className="min-w-0">
                        <p className="font-semibold truncate" style={{ color: '#2D2A26' }}>
                            <Badges post={post} />{post.title}
                            {post.youtube_id && <span className="ml-1.5 text-xs text-red-500" aria-label="영상 포함">▶</span>}
                        </p>
                        <p className="text-sm mt-0.5" style={{ color: '#8B7355' }}>
                            {boardNameOf && <>{boardNameOf(post)} · </>}{post.author_name} · {formatDate(post.created_at)}
                        </p>
                    </div>
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#C8C2B8' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </Link>
            ))}
        </div>
    )
}

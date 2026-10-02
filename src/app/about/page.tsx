import Link from 'next/link'
import PageHero from '@/components/site/PageHero'
import RichText from '@/components/site/RichText'
import Reveal from '@/components/motion/Reveal'
import SplitHeading from '@/components/motion/SplitHeading'
import { getBlocks } from '@/lib/content'

export const metadata = {
    title: '비전과 목표 | 순천순동교회',
    description: '하나님이 기뻐하시는 행복한 교회, 순천순동교회의 비전·표어·7대 목표입니다.',
}

const MORE = [
    { href: '/about/history', title: '걸어온 길', desc: '1946년 해촌교회에서 시작된 이야기' },
    { href: '/about/people', title: '섬기는 분들', desc: '교역자와 역대 담임교역자, 제직' },
    { href: '/directions', title: '오시는 길', desc: '순천시 남신월 4길 3-13' },
]

export default async function AboutPage() {
    const blocks = await getBlocks('about')
    const greeting = blocks['about.greeting']
    const vision = blocks['about.vision']

    return (
        <>
            <PageHero
                eyebrow="교회소개"
                title={vision?.title ?? '비전과 목표'}
                description={vision?.subtitle ?? '하나님이 기뻐하시는 행복한 교회'}
            />

            {/* 인사말 (관리자가 본문을 넣었을 때만) */}
            {greeting?.body && (
                <section className="py-16 lg:py-24 bg-[#FAF8F5]">
                    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 grid lg:grid-cols-12 gap-12 lg:gap-20 items-start">
                        {greeting?.image_url && (
                            <Reveal variant="mask" className="lg:col-span-5 aspect-[4/5] rounded-3xl overflow-hidden bg-[#E8E4DE]">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={greeting.image_url} alt="" className="w-full h-full object-cover" />
                            </Reveal>
                        )}
                        <div className={greeting?.image_url ? 'lg:col-span-7' : 'lg:col-span-8 lg:col-start-3'}>
                            <SplitHeading className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-[1.25] text-[#2D2A26] mb-10" style={{ fontFamily: 'var(--font-serif)' }}>
                                하나님이 기뻐하시는<br />행복한 교회
                            </SplitHeading>
                            <Reveal>
                                <RichText html={greeting.body} />
                            </Reveal>
                        </div>
                    </div>
                </section>
            )}

            {/* 비전 */}
            {vision?.body && (
                <section className="py-14 lg:py-20 bg-white">
                    <Reveal className="max-w-[840px] mx-auto px-4 sm:px-6">
                        <RichText html={vision.body} />
                    </Reveal>
                </section>
            )}

            {/* 더 알아보기 */}
            <section className="py-16 bg-[#FAF8F5]">
                <Reveal stagger className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 border-t border-[#2D2A26]">
                    {MORE.map((m) => (
                        <Link key={m.href} href={m.href} className="group flex items-center justify-between gap-6 py-7 border-b border-[#E8E4DE]">
                            <span>
                                <span className="block text-2xl lg:text-3xl font-bold text-[#2D2A26] group-hover:underline underline-offset-8" style={{ fontFamily: 'var(--font-serif)' }}>{m.title}</span>
                                <span className="block mt-1.5 text-[#8B7355]">{m.desc}</span>
                            </span>
                            <span className="text-2xl text-[#2D2A26] transition-transform duration-500 group-hover:translate-x-2" aria-hidden="true">→</span>
                        </Link>
                    ))}
                </Reveal>
            </section>
        </>
    )
}

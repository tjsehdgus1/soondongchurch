import Link from 'next/link'
import PageHero from '@/components/site/PageHero'
import RichText from '@/components/site/RichText'
import Reveal from '@/components/motion/Reveal'
import SplitHeading from '@/components/motion/SplitHeading'
import { getBlocks } from '@/lib/content'

export const metadata = {
    title: '교회 소개 | 순천순동교회',
    description: '하나님이 기뻐하시는 행복한 교회, 순천순동교회를 소개합니다.',
}

const MORE = [
    { href: '/about/history', eyebrow: 'History', title: '걸어온 길', desc: '1946년 해촌교회에서 시작된 이야기' },
    { href: '/about/people', eyebrow: 'People', title: '섬기는 분들', desc: '교역자와 역대 담임교역자, 제직' },
    { href: '/directions', eyebrow: 'Location', title: '오시는 길', desc: '순천시 남신월 4길 3-13' },
]

export default async function AboutPage() {
    const blocks = await getBlocks('about')
    const greeting = blocks['about.greeting']
    const vision = blocks['about.vision']

    return (
        <>
            <PageHero
                eyebrow="About"
                title={greeting?.title ?? '순천순동교회에 오신 것을 환영합니다'}
                description={greeting?.subtitle ?? '1946년부터 순천과 함께한 교회'}
                image="/images/hero-bg-2.jpg"
            />

            {/* 인사말 */}
            <section className="py-24 lg:py-36 bg-[#FAF8F5]">
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 grid lg:grid-cols-12 gap-12 lg:gap-20 items-start">
                    {greeting?.image_url && (
                        <Reveal variant="mask" className="lg:col-span-5 aspect-[4/5] rounded-3xl overflow-hidden bg-[#E8E4DE]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={greeting.image_url} alt="" className="w-full h-full object-cover" />
                        </Reveal>
                    )}
                    <div className={greeting?.image_url ? 'lg:col-span-7' : 'lg:col-span-8 lg:col-start-3'}>
                        <p className="text-xs font-semibold tracking-[0.3em] uppercase text-[#B8860B] mb-5">Greeting</p>
                        <SplitHeading className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-[1.25] text-[#2D2A26] mb-10" style={{ fontFamily: 'var(--font-serif)' }}>
                            하나님이 기뻐하시는<br />행복한 교회
                        </SplitHeading>
                        <Reveal>
                            <RichText html={greeting?.body} />
                        </Reveal>
                    </div>
                </div>
            </section>

            {/* 비전 */}
            {vision?.body && (
                <section className="py-24 lg:py-36 bg-white">
                    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 grid lg:grid-cols-12 gap-12">
                        <div className="lg:col-span-4">
                            <div className="lg:sticky lg:top-32">
                                <p className="text-xs font-semibold tracking-[0.3em] uppercase text-[#B8860B] mb-5">Vision</p>
                                <SplitHeading className="text-4xl lg:text-5xl font-bold text-[#2D2A26]" style={{ fontFamily: 'var(--font-serif)' }}>
                                    {vision.title ?? '비전과 목표'}
                                </SplitHeading>
                                {vision.subtitle && <p className="mt-5 text-[#8B7355]">{vision.subtitle}</p>}
                            </div>
                        </div>
                        <Reveal className="lg:col-span-7 lg:col-start-6">
                            <RichText html={vision.body} />
                        </Reveal>
                    </div>
                </section>
            )}

            {/* 더 알아보기 */}
            <section className="py-24 bg-[#FAF8F5]">
                <Reveal stagger className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 grid md:grid-cols-3 gap-6">
                    {MORE.map((m) => (
                        <Link key={m.href} href={m.href} className="group block rounded-3xl bg-white border border-[#E8E4DE] p-8 lg:p-10 hover:border-[#B8860B] hover:-translate-y-1 transition-all duration-500">
                            <p className="text-xs font-semibold tracking-[0.3em] uppercase text-[#B8860B]">{m.eyebrow}</p>
                            <p className="mt-6 text-2xl lg:text-3xl font-bold text-[#2D2A26]" style={{ fontFamily: 'var(--font-serif)' }}>{m.title}</p>
                            <p className="mt-3 text-sm text-[#8B7355]">{m.desc}</p>
                            <p className="mt-10 text-[#B8860B] transition-transform duration-500 group-hover:translate-x-2" aria-hidden="true">→</p>
                        </Link>
                    ))}
                </Reveal>
            </section>
        </>
    )
}

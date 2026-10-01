import PageHero from '@/components/site/PageHero'
import RichText from '@/components/site/RichText'
import KakaoRoughMap from '@/components/site/KakaoRoughMap'
import Reveal from '@/components/motion/Reveal'
import { getBlock } from '@/lib/content'

export const metadata = {
    title: '오시는 길 | 순천순동교회',
    description: '전라남도 순천시 남신월 4길 3-13 순천순동교회 오시는 길',
}

const INFO = [
    { label: '주소', value: '전라남도 순천시 남신월 4길 3-13' },
    { label: '전화', value: '061-721-6707', sub: 'FAX 061-725-3927' },
    { label: '주일 예배', value: '오전 11:00 · 오후 1:30' },
]

export default async function DirectionsPage() {
    const guide = await getBlock('directions.guide')

    return (
        <>
            <PageHero eyebrow="교회소개" title={guide?.title ?? '오시는 길'} description={guide?.subtitle ?? '전라남도 순천시 남신월 4길 3-13'} />
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-12 lg:py-16 space-y-14">
                <Reveal variant="mask" className="rounded-3xl overflow-hidden border border-[#E8E4DE] bg-white">
                    <KakaoRoughMap />
                </Reveal>

                <Reveal stagger className="grid sm:grid-cols-3 gap-px bg-[#E8E4DE] rounded-3xl overflow-hidden border border-[#E8E4DE]">
                    {INFO.map((item) => (
                        <div key={item.label} className="bg-white p-8">
                            <p className="text-xs font-semibold tracking-[0.25em] text-[#B8860B] mb-3">{item.label}</p>
                            <p className="text-lg font-bold text-[#2D2A26]" style={{ fontFamily: 'var(--font-serif)' }}>{item.value}</p>
                            {item.sub && <p className="text-sm text-[#8B7355] mt-1">{item.sub}</p>}
                        </div>
                    ))}
                </Reveal>

                {guide?.body && (
                    <Reveal className="max-w-3xl">
                        <RichText html={guide.body} />
                    </Reveal>
                )}
            </div>
        </>
    )
}

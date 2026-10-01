import CountUp from '@/components/motion/CountUp'
import Reveal from '@/components/motion/Reveal'

interface NumbersBandProps {
    years: number
    missionCount: number
    nextGenCount: number
}

// 숫자로 보는 순동교회 (화면에 들어오면 카운트업)
export default function NumbersBand({ years, missionCount, nextGenCount }: NumbersBandProps) {
    const items = [
        { value: years, suffix: '년', label: '1946년 창립부터 순천과 함께' },
        { value: missionCount, suffix: '곳', label: '함께 기도하는 선교지' },
        { value: nextGenCount, suffix: '개', label: '유아부터 청년까지 다음세대 부서' },
    ].filter((i) => i.value > 0)

    return (
        <section className="bg-[#1F1D1A] text-white py-24 lg:py-32">
            <Reveal stagger className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 grid sm:grid-cols-3 gap-12 sm:gap-6">
                {items.map((item) => (
                    <div key={item.label} className="sm:border-l sm:border-white/10 sm:pl-8 first:border-0 first:pl-0">
                        <p className="text-6xl lg:text-8xl font-bold text-[#E9C46A] tabular-nums" style={{ fontFamily: 'var(--font-serif)' }}>
                            <CountUp to={item.value} suffix={item.suffix} />
                        </p>
                        <p className="mt-4 text-sm lg:text-base text-white/60">{item.label}</p>
                    </div>
                ))}
            </Reveal>
        </section>
    )
}

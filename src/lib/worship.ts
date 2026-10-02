// 정기 예배 시간표와 다음 예배 계산 (KST 기준, 순수 함수 — tests/worship.test.ts)

export type Worship = {
    key: string
    name: string
    dayLabel: string
    // 요일 (0 = 주일)
    days: number[]
    // 'HH:MM' (KST)
    time: string
    timeLabel: string
    image: string
}

export const WORSHIPS: Worship[] = [
    { key: 'sun-morning', name: '주일오전예배', dayLabel: '주일', days: [0], time: '11:00', timeLabel: '오전 11:00', image: '/images/worships/sun_morning.webp' },
    { key: 'sun-afternoon', name: '주일오후예배', dayLabel: '주일', days: [0], time: '13:30', timeLabel: '오후 1:30', image: '/images/worships/sun_afternoon.webp' },
    { key: 'wed-night', name: '수요밤예배', dayLabel: '수요일', days: [3], time: '19:00', timeLabel: '오후 7:00', image: '/images/worships/wed_night.webp' },
    { key: 'fri-prayer', name: '금요기도회', dayLabel: '금요일', days: [5], time: '20:00', timeLabel: '오후 8:00', image: '/images/worships/fri_prayer.webp' },
    { key: 'dawn', name: '새벽예배', dayLabel: '매일', days: [0, 1, 2, 3, 4, 5, 6], time: '05:00', timeLabel: '오전 5:00', image: '/images/worships/dawn_prayer.webp' },
]

const KST_OFFSET_MS = 9 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000

// 시작 시각이 지나지 않은 가장 가까운 예배
export function nextWorship(now: Date): { worship: Worship, startsAt: Date, isToday: boolean } {
    // KST 벽시계를 UTC 필드로 다루기 위해 9시간 이동
    const kstNow = new Date(now.getTime() + KST_OFFSET_MS)
    const kstMidnight = Date.UTC(kstNow.getUTCFullYear(), kstNow.getUTCMonth(), kstNow.getUTCDate())

    let best: { worship: Worship, startsAt: Date, isToday: boolean } | null = null
    for (let offset = 0; offset <= 7; offset++) {
        const dayStart = kstMidnight + offset * DAY_MS
        const weekday = new Date(dayStart).getUTCDay()
        for (const worship of WORSHIPS) {
            if (!worship.days.includes(weekday)) continue
            const [h, m] = worship.time.split(':').map(Number)
            const startsAt = new Date(dayStart + (h * 60 + m) * 60 * 1000 - KST_OFFSET_MS)
            if (startsAt <= now) continue
            if (!best || startsAt < best.startsAt) best = { worship, startsAt, isToday: offset === 0 }
        }
        if (best) break
    }
    // 매일 예배가 있으므로 7일 안에 반드시 찾음
    return best!
}

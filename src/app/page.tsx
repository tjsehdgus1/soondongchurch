import { createClient } from '@/lib/supabase/server'
import { getBlock, getMissionFields } from '@/lib/content'
import HomeHero from '@/components/home/HomeHero'
import WorshipStrip from '@/components/home/WorshipStrip'
import NumbersBand from '@/components/home/NumbersBand'
import RecentSermons, { type SermonVideo } from '@/components/home/RecentSermons'
import MissionTeaser from '@/components/home/MissionTeaser'
import NewsSection from '@/components/home/NewsSection'
import VisitBand from '@/components/home/VisitBand'

const FOUNDED_YEAR = 1946
const HERO_IMAGES = ['/images/hero-bg-1.jpg', '/images/hero-bg-2.jpg']

export default async function HomePage() {
  const supabase = await createClient()
  // 한국 날짜 기준 (서버는 UTC)
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date())
  const thisYear = Number(today.slice(0, 4))

  const [
    hero,
    missionFields,
    { data: notices },
    { data: events },
    { data: sermonVideos },
    { data: gallery },
    { count: nextGenCount },
  ] = await Promise.all([
    getBlock('home.hero'),
    getMissionFields(),
    supabase.from('notices').select('id, title, created_at, is_pinned')
      .order('is_pinned', { ascending: false }).order('created_at', { ascending: false }).limit(4),
    supabase.from('events').select('id, title, event_date, event_time, location')
      .gte('event_date', today).order('event_date', { ascending: true }).limit(4),
    // 최근 말씀: '말씀' 허브 게시판의 영상 글
    supabase.from('board_posts').select('id, title, youtube_id, created_at, boards!inner(slug, name, hub)')
      .eq('boards.hub', 'sermons').not('youtube_id', 'is', null)
      .order('created_at', { ascending: false }).limit(3),
    // 사진 띠: 공개 글 중 사진이 있는 최신 글
    supabase.from('board_posts').select('id, title, thumbnail_url, boards!inner(slug)')
      .not('thumbnail_url', 'is', null).eq('members_only', false)
      .order('created_at', { ascending: false }).limit(14),
    supabase.from('boards').select('id', { count: 'exact', head: true }).eq('hub', 'next-gen'),
  ])

  return (
    <>
      <HomeHero
        title={hero?.title ?? '하나님이 기뻐하시는\n행복한 교회'}
        subtitle={hero?.subtitle ?? '하나님의 은혜 안에서 함께 성장하는 교회'}
        images={hero?.image_url ? [hero.image_url, ...HERO_IMAGES] : HERO_IMAGES}
      />
      <WorshipStrip />
      <NumbersBand years={thisYear - FOUNDED_YEAR} missionCount={missionFields.length} nextGenCount={nextGenCount ?? 0} />
      <RecentSermons videos={(sermonVideos ?? []) as unknown as SermonVideo[]} />
      <MissionTeaser fields={missionFields} />
      <NewsSection
        notices={notices ?? []}
        events={events ?? []}
        gallery={(gallery ?? []).map((g) => ({
          id: g.id,
          title: g.title,
          thumbnail_url: g.thumbnail_url as string,
          slug: (g.boards as unknown as { slug: string }).slug,
        }))}
      />
      <VisitBand />
    </>
  )
}

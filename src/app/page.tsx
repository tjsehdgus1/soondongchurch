import { createClient } from '@/lib/supabase/server'
import { getBlock, getMissionFields } from '@/lib/content'
import HomeHero from '@/components/home/HomeHero'
import WorshipStrip from '@/components/home/WorshipStrip'
import RecentSermons, { type SermonVideo } from '@/components/home/RecentSermons'
import MissionTeaser from '@/components/home/MissionTeaser'
import NewsSection, { type EventPost } from '@/components/home/NewsSection'
import VisitBand from '@/components/home/VisitBand'

// 원본 6000px → 2400/1200px webp (모바일은 작은 파일)
const HERO_IMAGES = [
  { src: '/images/hero-bg-1.webp', srcSet: '/images/hero-bg-1-sm.webp 1200w, /images/hero-bg-1.webp 2400w' },
  { src: '/images/hero-bg-2.webp', srcSet: '/images/hero-bg-2-sm.webp 1200w, /images/hero-bg-2.webp 2400w' },
]

export default async function HomePage() {
  const supabase = await createClient()
  const [
    hero,
    missionFields,
    { data: sermonVideos },
    { data: eventPosts },
  ] = await Promise.all([
    getBlock('home.hero'),
    getMissionFields(),
    // 최근 말씀: '말씀' 허브 게시판의 영상 글
    supabase.from('board_posts').select('id, title, youtube_id, created_at, boards!inner(slug, name, hub)')
      .eq('boards.hub', 'sermons').not('youtube_id', 'is', null)
      .order('created_at', { ascending: false }).limit(2),
    // 교회 소식: '교회 행사' 게시판 최신 글
    supabase.from('board_posts').select('id, title, youtube_id, thumbnail_url, created_at, boards!inner(slug)')
      .eq('boards.slug', 'events-gallery').eq('members_only', false)
      .order('created_at', { ascending: false }).limit(6),
  ])

  return (
    <>
      <HomeHero
        title={hero?.title ?? '하나님이 기뻐하시는\n행복한 교회'}
        subtitle={hero?.subtitle ?? '하나님의 은혜 안에서 함께 성장하는 교회'}
        images={hero?.image_url ? [{ src: hero.image_url }, ...HERO_IMAGES] : HERO_IMAGES}
      />
      <WorshipStrip />
      <RecentSermons videos={(sermonVideos ?? []) as unknown as SermonVideo[]} />
      <MissionTeaser fields={missionFields} />
      <NewsSection posts={(eventPosts ?? []) as unknown as EventPost[]} />
      <VisitBand />
    </>
  )
}

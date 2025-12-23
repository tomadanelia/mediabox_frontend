import React from "react"
import ChannelScroller from "./comps/ChannelScroller"
import type { Channel } from "./comps/ChannelScroller"
import HeroPlayer from "./comps/HeroPlayer"
import type { FeaturedChannel } from "./comps/HeroPlayer"
import LiveCategoryRow from "./comps/LiveCategoryRow"
import type { LiveVideo } from "./comps/LiveCategoryRow"

const featured: FeaturedChannel = {
  title: "Mediabox Prime",
  slug: "mediabox-prime",
  description: "24/7 entertainment hub with live talk shows, music specials, and breaking news for the entire community.",
  category: "Entertainment",
  viewers: "32.4K",
  schedule: "Live · New episode every evening at 7:00 PM",
  thumbnail: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1600&q=80",
  tags: ["HD", "Multi-language", "Family friendly"],
}

const channels: Channel[] = [
  {
    id: "news-global",
    name: "პირველი არხი",
    genre: "News",
    viewers: "18.2K",
    color: "rgba(59,130,246,0.8)",
    thumbnail: "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "sports-live",
    name: "სილქ უნივერსალი",
    genre: "Sports",
    viewers: "27.5K",
    color: "rgba(16,185,129,0.8)",
    thumbnail: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "music-vibes",
    name: "იმედი",
    genre: "Music",
    viewers: "13.9K",
    color: "rgba(236,72,153,0.8)",
    thumbnail: "https://images.unsplash.com/photo-1487180144351-b8472da7d491?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "documentary-hd",
    name: "მთავარი არხი",
    genre: "Documentary",
    viewers: "9.4K",
    color: "rgba(234,179,8,0.8)",
    thumbnail: "https://images.unsplash.com/photo-1521292270410-a8c2e9be2050?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "kids-zone",
    name: "რუსთავი 2",
    genre: "Kids",
    viewers: "6.8K",
    color: "rgba(14,165,233,0.8)",
    thumbnail: "https://images.unsplash.com/photo-1509099955924-cca3353a2e1c?auto=format&fit=crop&w=900&q=80",
  },
]

const liveSections: { title: string; accent: string; videos: LiveVideo[] }[] = [
  { 
    title: "Trending right now",
    accent: "#ef4444",
    videos: [
      {
        id: "yt1",
        title: "City Nights Live DJ Set",
        channel: "Music Vibes",
        viewers: "12.3K",
        thumbnail: "https://i.ytimg.com/vi/6vYnas6q3Sg/hqdefault.jpg",
        url: "https://www.youtube.com/watch?v=6vYnas6q3Sg",
      },
      {
        id: "yt2",
        title: "Global News Desk · Prime Time",
        channel: "News Global 24/7",
        viewers: "22.1K",
        thumbnail: "https://i.ytimg.com/vi/UyyjU8fzEYU/hqdefault.jpg",
        url: "https://www.youtube.com/watch?v=UyyjU8fzEYU",
      },
      {
        id: "yt3",
        title: "Championship Highlights Live",
        channel: "Sports Live Arena",
        viewers: "18.9K",
        thumbnail: "https://i.ytimg.com/vi/XHOmBV4js_E/hqdefault.jpg",
        url: "https://www.youtube.com/watch?v=XHOmBV4js_E",
      },
      {
        id: "yt4",
        title: "Late Night Comedy Marathon",
        channel: "Mediabox Prime",
        viewers: "7.5K",
        thumbnail: "https://i.ytimg.com/vi/_3YNL0OWio0/hqdefault.jpg",
        url: "https://www.youtube.com/watch?v=_3YNL0OWio0",
      },
    ],
  },
  {
    title: "Documentaries & culture",
    accent: "#facc15",
    videos: [
      {
        id: "yt5",
        title: "Wild Planet Live: Ocean Depths",
        channel: "Docu HD",
        viewers: "9.1K",
        thumbnail: "https://i.ytimg.com/vi/qRyR1JbQv9o/hqdefault.jpg",
        url: "https://www.youtube.com/watch?v=qRyR1JbQv9o",
      },
      {
        id: "yt6",
        title: "History Unfolded · Live Q&A",
        channel: "Knowledge Now",
        viewers: "4.6K",
        thumbnail: "https://i.ytimg.com/vi/1w8Z0UOXVaY/hqdefault.jpg",
        url: "https://www.youtube.com/watch?v=1w8Z0UOXVaY",
      },
      {
        id: "yt7",
        title: "City Stories: Architecture Live",
        channel: "Urban Lens",
        viewers: "5.3K",
        thumbnail: "https://i.ytimg.com/vi/8ZcmTl_1ER8/hqdefault.jpg",
        url: "https://www.youtube.com/watch?v=8ZcmTl_1ER8",
      },
      {
        id: "yt8",
        title: "Arts & Culture Festival Stream",
        channel: "Culture Connect",
        viewers: "3.7K",
        thumbnail: "https://i.ytimg.com/vi/GXoZLPSw8U8/hqdefault.jpg",
        url: "https://www.youtube.com/watch?v=GXoZLPSw8U8",
      },
    ],
  },
  {
    title: "For kids & family",
    accent: "#38bdf8",
    videos: [
      {
        id: "yt9",
        title: "Cartoon Hour Live",
        channel: "Kids Zone",
        viewers: "6.4K",
        thumbnail: "https://i.ytimg.com/vi/ysz5S6PUM-U/hqdefault.jpg",
        url: "https://www.youtube.com/watch?v=ysz5S6PUM-U",
      },
      {
        id: "yt10",
        title: "Science Lab Live Experiments",
        channel: "STEM Kids",
        viewers: "2.8K",
        thumbnail: "https://i.ytimg.com/vi/0qisGSwZym4/hqdefault.jpg",
        url: "https://www.youtube.com/watch?v=0qisGSwZym4",
      },
      {
        id: "yt11",
        title: "Story Time Live: Adventure Tales",
        channel: "Reading Room",
        viewers: "3.2K",
        thumbnail: "https://i.ytimg.com/vi/iv8GW1GaoIc/hqdefault.jpg",
        url: "https://www.youtube.com/watch?v=iv8GW1GaoIc",
      },
      {
        id: "yt12",
        title: "Creative Crafts Workshop",
        channel: "Kids Create",
        viewers: "2.1K",
        thumbnail: "https://i.ytimg.com/vi/1Ne1hqOXKKI/hqdefault.jpg",
        url: "https://www.youtube.com/watch?v=1Ne1hqOXKKI",
      },
    ],
  },
]

export const Home: React.FC = () => {
    return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <HeroPlayer featured={featured} />
      <ChannelScroller channels={channels} />

      <div className="space-y-8">
        {liveSections.map((section) => (
          <LiveCategoryRow key={section.title} title={section.title} accent={section.accent} videos={section.videos} />
        ))}
        </div>
    </main>
  )
}

export default Home
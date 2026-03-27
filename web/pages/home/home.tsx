import React, { useEffect, useState } from "react"
import ChannelScroller, { ChannelCard } from "./comps/ChannelScroller"
import type { Channel } from "../../src/types/channel"
import useUIStore from "@/store/ui-store"
import api from "@/lib/axios"
import Footer from "@/hmcomponents/footer"
const HERO_TEXT = {
  En: {
    eyebrow:       "Your universe of live content",
    tagline:       "Stream hundreds of live channels, on-demand series, and curated collections — all in one place.",
    pills:         ["Live TV", "Movies", "Series", "Sports", "News"],
  },
  Ge: {
    eyebrow:       "შენი პირდაპირი კონტენტის სამყარო",
    tagline:       "ასობით პირდაპირი არხი, სერიალი და კურირებული კოლექცია — ყველაფერი ერთ ადგილას.",
    pills:         ["პირდაპირი", "ფილმები", "სერიალები", "სპორტი", "სიახლეები"],
  },
} as const

type Lang = keyof typeof HERO_TEXT

interface HeroBannerProps {
  heroImage?: string | null
  language: string
}

const HeroBanner: React.FC<HeroBannerProps> = ({ heroImage, language }) => {
  const lang: Lang = language === "Ge" ? "Ge" : "En"
    
  return (
    <section
      className="hero-banner w-full"
    >
      <img src="https://www.proximus-cdn.com/dam/jcr:875dfa83-acf9-44db-b7fd-c2b792de7592/banner_Pickx_Leagues_1200x630v2_en.png" className="w-full" alt="" />
      </section>
  )
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Category {
  id: string
  name_ka: string
  name_en: string
  description_en: string
  description_ka: string
  icon_url: string
}

interface CategoryScrollerProps {
  category: Category
  channels: Channel[]
  language: string
}



const Home: React.FC = () => {
  const [channels, setChannelsLocal] = useState<Channel[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const { language,setChannels } = useUIStore()
  useEffect(() => {
    ;(async () => {
      try {
        const [chRes, catRes] = await Promise.all([
          api.get("/api/channels"),
          api.get("/api/channels/categories"),
        ])
        const fetched = Array.isArray(chRes.data.channels) ? chRes.data.channels : []
        setChannels(fetched)          
        setChannelsLocal(fetched)
        setCategories(Array.isArray(catRes.data) ? catRes.data : [])
      } catch (e) {
        console.error("[Home/fetch]", e)
      }
    })()
  }, [])

  const channelsByCategory = React.useMemo(() => {
    const map = new Map<string, Channel[]>()
    for (const ch of channels) {
      const catId = (ch as Channel & { category_id?: string }).category_id
      if (!catId) continue
      if (!map.has(catId)) map.set(catId, [])
      map.get(catId)!.push(ch)
    }
    return map
  }, [channels])

  const uncategorised = React.useMemo(() => {
    const knownIds = new Set(categories.map((c) => c.id))
    return channels.filter((ch) => {
      const catId = (ch as Channel & { category_id?: string }).category_id
      return !catId || !knownIds.has(catId)
    })
  }, [channels, categories])

  return (
<main className={`overflow-y-auto bg-backround mx-auto w-full 2_5xl:w-500 max-w-screen flex flex-col gap-8 px-4 pb-12 pt-6 sm:px-6 lg:px-10 xl:px-14`}>
      <HeroBanner heroImage={null} language={language} />
      {[...categories]
  .sort((a, b) => (channelsByCategory.get(b.id)?.length ?? 0) - (channelsByCategory.get(a.id)?.length ?? 0))
  .map((cat) => {
        const catChannels = channelsByCategory.get(cat.id) ?? []
        if (catChannels.length === 0) return null

        const label = language === "Ge" ? cat.name_ka : cat.name_en

        return (
          <section key={cat.id} className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 ml-3 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
             <span className="material-symbols-outlined ">
                  {cat.icon_url}
              </span>  
                          </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground leading-tight">{label}</h3>
              </div>
            </div>

            {/* Reuse ChannelScroller but suppress its built-in header */}
            <div className="cat-scroller-no-header overflow-visible">
              <ChannelScroller channels={catChannels} />
            </div>
          </section>
        )
      })}

      {/* Fallback: channels with no matched category */}
      {uncategorised.length > 0 && (
        <ChannelScroller channels={uncategorised} />
      )}

      <style>{`
        /* Hide the built-in header inside each ChannelScroller we've wrapped,
           since we render our own styled header above each one */
        .cat-scroller-no-header > section > div:first-child {
          display: none;
        }
      `}</style>
        <Footer/>
    </main>
  )
}

export default Home
import React, { useEffect, useState } from "react"
import { API_BASE_URL } from "../../src/config"
import ChannelScroller from "./comps/ChannelScroller"
import type { Channel } from "./comps/ChannelScroller"

const API_BASE = `${API_BASE_URL}/api`

const Home: React.FC = () => {
  const [channels, setChannels] = useState<Channel[]>([])

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch(`${API_BASE}/channels`, {
          headers: { Accept: "application/json" },
          cache: "no-store",
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        setChannels(await res.json())
      } catch (e) {
        console.error("[Home/fetchChannels]", e)
      }
    })()
  }, [])

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <ChannelScroller channels={channels} />
    </main>
  )
}

export default Home
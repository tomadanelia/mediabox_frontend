import React from "react"
import { Link } from "react-router-dom"
import { Badge } from "../../../src/components/ui/badge"

export type Channel = {
  id: string
  name: string
  genre: string
  viewers: string
  color: string
  thumbnail: string
}

type ChannelScrollerProps = {
  channels: Channel[]
}

const ChannelScroller: React.FC<ChannelScrollerProps> = ({ channels }) => {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Quick tune</p>
          <h3 className="text-xl font-semibold text-foreground">Switch channels</h3>
        </div>
    
      </div>

      <div className="relative">
        <div className=" flex gap-4 overflow-x-auto scrollbar-hide pb-2">
          {channels.map((channel) => (
            <Link
              key={channel.id}
              to={`/stream?channel=${channel.id}`}
              className="group relative w-64 shrink-0 overflow-hidden rounded-xl border border-border  from-slate-900/90 to-slate-950/90 shadow-lg transition hover:-translate-y-1 hover:border-primary/60 hover:shadow-xl"
            >
              <div
                className="absolute inset-0 opacity-80"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${channel.color}, rgba(15,23,42,0.9))`,
                }}
              />
              <img
                src={channel.thumbnail}
                alt={`${channel.name} preview`}
                className="absolute inset-0 h-full w-full object-cover mix-blend-overlay transition duration-500 group-hover:scale-105"
              />

              <div className="relative flex h-32 flex-col justify-between p-4 text-white">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-white/80">
                    <span className="h-2 w-2 rounded-full bg-green-400" />
                    Live · {channel.genre}
                  </div>
                  <p className="text-lg font-semibold leading-tight">{channel.name}</p>
                </div>

                <div className="flex items-center justify-between text-xs text-white/80">
                  <span>{channel.viewers} watching</span>
                  <span className="rounded-full bg-white/10 px-2 py-1 font-medium">უყურე</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

export default ChannelScroller


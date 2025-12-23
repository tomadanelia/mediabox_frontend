import React from "react"
import { ExternalLink, Flame } from "lucide-react"
import { Badge } from "../../../src/components/ui/badge"

type LiveVideo = {
  id: string
  title: string
  channel: string
  viewers: string
  thumbnail: string
  url: string
}

type LiveCategoryRowProps = {
  title: string
  accent: string
  videos: LiveVideo[]
}

const LiveCategoryRow: React.FC<LiveCategoryRowProps> = ({ title, accent, videos }) => {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 text-foreground">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: accent }} />
        <h4 className="text-lg font-semibold">{title}</h4>
        <Badge variant="outline" className="gap-1 border-white/10 bg-white/5 text-xs text-muted-foreground">
          <Flame className="h-3.5 w-3.5 text-amber-400" />
          Live picks
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {videos.map((video) => (
          <a
            key={video.id}
            href={video.url}
            target="_blank"
            rel="noreferrer"
            className="group overflow-hidden rounded-xl border border-border bg-slate-950/70 shadow-lg transition hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl"
          >
            <div className="relative pb-[56.25%]">
              <img
                src={video.thumbnail}
                alt={video.title}
                className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
              <div className="absolute left-3 top-3 flex items-center gap-2">
                <Badge className="bg-red-500 text-white shadow-lg">LIVE</Badge>
                <span className="rounded-full bg-black/70 px-2 py-1 text-[11px] font-semibold text-white">
                  {video.viewers} watching
                </span>
              </div>
              <div className="absolute inset-0  from-slate-950/90 via-slate-900/0 to-slate-900/10" />
            </div>

            <div className="flex items-start justify-between p-4">
              <div className="space-y-1">
                <p className="text-sm font-semibold leading-snug text-foreground">{video.title}</p>
                <p className="text-xs text-muted-foreground">{video.channel}</p>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground transition group-hover:text-primary" />
            </div>
          </a>
        ))}
      </div>
    </section>
  )
}

export type { LiveVideo }
export default LiveCategoryRow


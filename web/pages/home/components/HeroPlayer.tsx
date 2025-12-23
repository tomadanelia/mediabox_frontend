import React from "react"
import { PlayCircle, Radio, Users } from "lucide-react"
import { Link } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type FeaturedChannel = {
  title: string
  slug: string
  description: string
  category: string
  viewers: string
  schedule: string
  thumbnail: string
  tags: string[]
}

type HeroPlayerProps = {
  featured: FeaturedChannel
}

const HeroPlayer: React.FC<HeroPlayerProps> = ({ featured }) => {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Radio className="h-4 w-4 text-red-500" />
        <span className="font-medium text-foreground">Live now</span>
        <span className="text-xs text-muted-foreground">Featured channel</span>
      </div>

      <div className="relative w-full overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-[56.25%] shadow-2xl">
        <img
          src={featured.thumbnail}
          alt={`${featured.title} placeholder`}
          className="absolute inset-0 h-full w-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-slate-900/40" />

        <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8 lg:p-10">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Badge variant="default" className="bg-red-500 text-white hover:bg-red-500/90">
              LIVE
            </Badge>
            <Badge variant="secondary">{featured.category}</Badge>
            <div className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur">
              <Users className="h-4 w-4" />
              <span>{featured.viewers} watching</span>
            </div>
          </div>

          <div className="space-y-3 text-white">
            <h2 className="text-2xl font-semibold leading-tight sm:text-3xl lg:text-4xl">
              {featured.title}
            </h2>
            <p className="max-w-3xl text-sm text-white/80 sm:text-base">{featured.description}</p>
            <p className="text-xs uppercase tracking-wide text-white/60">{featured.schedule}</p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="gap-2 bg-primary text-primary-foreground">
                <Link to={`/stream?channel=${featured.slug}`}>
                  <PlayCircle className="h-5 w-5" />
                  Watch now
                </Link>
              </Button>
              <div className="flex flex-wrap gap-2 text-xs text-white/70">
                {featured.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export type { FeaturedChannel }
export default HeroPlayer


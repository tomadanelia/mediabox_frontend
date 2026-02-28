import * as Icons from "lucide-react"
import type { LucideProps } from "lucide-react"
import type { ComponentType } from "react"

interface CategoryIconProps extends LucideProps {
  name: string
}

export function CategoryIcon({ name, ...props }: CategoryIconProps) {
  const normalizedName = name.toLowerCase()

  const iconKey = Object.keys(Icons).find(
    key => key.toLowerCase() === normalizedName
  )

  if (!iconKey) {
    return null
  }

  const LucideIcon = Icons[iconKey as keyof typeof Icons] as ComponentType<LucideProps>

  return <LucideIcon {...props} />
}
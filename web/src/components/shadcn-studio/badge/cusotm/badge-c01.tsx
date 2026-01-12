import { Badge } from '@/components/ui/badge'

const BadgeLiveDemo = () => {
  return (
    <Badge className='bg-destructive/10 [a&]:hover:bg-destructive/5 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 text-destructive border-none focus-visible:outline-none'>
      <span className='bg-destructive size-1.5 rounded-full' aria-hidden='true' />
      Live
    </Badge>
  )
}

export default BadgeLiveDemo

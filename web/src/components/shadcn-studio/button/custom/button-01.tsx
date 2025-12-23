import { Calendar1Icon } from 'lucide-react'

import { Button } from '@/components/ui/button'

const IconButtonCalendar = () => {
  return (
    <Button variant='outline' size='icon'>
      <Calendar1Icon />
      <span className='sr-only'>Bookmark</span>
    </Button>
  )
}

export default IconButtonCalendar

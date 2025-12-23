import { BellIcon, CalendarDaysIcon, ChevronDownIcon, LanguagesIcon, MailIcon, SearchIcon } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import LanguageDropdown from '@/components/shadcn-studio/blocks/dropdown-language'
import NotificationDropdown from '@/components/shadcn-studio/blocks/dropdown-notification'
import ProfileDropdown from '@/components/shadcn-studio/blocks/dropdown-profile'

const Navbar = () => {
  return (
    <header className='bg-background top-0 z-50 h-20'>
      <div className='mx-auto flex max-w-7xl items-center justify-between gap-8 px-4 py-3 sm:px-6'>
        <div className='flex items-center gap-6'>
          <div className='flex-col items-start sm:flex'>
            <p className='text-lg font-semibold'>Hello, John</p>
            <p className='text-muted-foreground text-sm max-sm:hidden'>Welcome back to dashboard</p>
          </div>

          <div className='relative max-md:hidden'>
            <div className='text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center pl-3 peer-disabled:opacity-50'>
              <SearchIcon className='size-4' />
              <span className='sr-only'>Search</span>
            </div>
            <Input type='text' placeholder='Type here' className='peer pl-9' />
          </div>
        </div>

        <div className='flex items-center gap-1.5 lg:gap-4'>
          <Button variant='outline' size='icon' className='md:hidden'>
            <SearchIcon />
            <span className='sr-only'>Search</span>
          </Button>

          <Button variant='outline' size='icon' className='max-sm:hidden'>
            <CalendarDaysIcon />
            <span className='sr-only'>Calendar</span>
          </Button>

          <NotificationDropdown
            trigger={
              <Button variant='outline' size='icon' className='relative'>
                <BellIcon />
                <span className='bg-destructive absolute -top-0.5 -right-0.5 size-2 rounded-full' />
              </Button>
            }
          />

          <Button variant='outline' size='icon' className='relative'>
            <MailIcon />
            <span className='sr-only'>Messages</span>
            <Badge className='absolute -top-2.5 -right-2.5 h-5 min-w-5 px-1 tabular-nums'>2</Badge>
          </Button>

          <LanguageDropdown
            align='center'
            trigger={
              <div>
                <Button variant='ghost' className='max-sm:hidden'>
                  English
                  <ChevronDownIcon />
                </Button>
                <Button variant='outline' size='icon' className='sm:hidden'>
                  <LanguagesIcon />
                </Button>
              </div>
            }
          />

          <ProfileDropdown
            trigger={
              <Button variant='ghost' className='h-full rounded-full p-0'>
                <Avatar className='size-10.5'>
                  <AvatarImage src='https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-1.png' />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
              </Button>
            }
          />
        </div>
      </div>
    </header>
  )
}

export default Navbar

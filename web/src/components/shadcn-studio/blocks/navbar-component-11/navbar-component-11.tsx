import { MenuIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

import LogoSvg from '@/assets/svg/logo'

type NavigationItem = {
  title: string
  href: string
}[]

const Navbar = ({ navigationData }: { navigationData: NavigationItem }) => {
  return (
    <header className='sticky top-0 z-50 bg-black'>
      <div className='mx-auto flex max-w-7xl items-center gap-10 px-4 py-3 sm:px-6'>
        <a href='#'>
          <div className='flex items-center'>
            <LogoSvg className='size-8 [&_line]:stroke-black [&_path]:stroke-black [&_rect]:fill-white' />
            <span className='ml-3 text-xl font-semibold text-white max-[500px]:hidden'>shadcn/studio</span>
          </div>
        </a>

        <div className='flex items-center gap-6 font-medium text-white/90 max-lg:hidden'>
          {navigationData.map((item, index) => (
            <a key={index} href={item.href} className='hover:text-white'>
              {item.title}
            </a>
          ))}
        </div>

        <div className='flex flex-1 items-center justify-end gap-4'>
          <a href='#' className='font-medium text-white/90 hover:text-white'>
            Login
          </a>

          <Button
            size='sm'
            asChild
            className='rounded-full bg-green-600 text-white hover:bg-green-600/90 focus-visible:ring-green-600/20 dark:bg-green-400/60 dark:focus-visible:ring-green-400/40'
          >
            <a href='#'>Free trial</a>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger className='lg:hidden' asChild>
              <Button variant='outline' size='icon' className='!bg-background'>
                <MenuIcon />
                <span className='sr-only'>Menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className='w-56' align='end'>
              <DropdownMenuGroup>
                {navigationData.map((item, index) => (
                  <DropdownMenuItem key={index}>
                    <a href={item.href}>{item.title}</a>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

export default Navbar

import { useState, useEffect, type ReactNode } from 'react'
import api from '../../../lib/axios'
import {
  UserIcon,
  SettingsIcon,
  CreditCardIcon,
  LogOutIcon
} from 'lucide-react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

type Props = {
  trigger: ReactNode
  defaultOpen?: boolean
  align?: 'start' | 'center' | 'end'
}

const ProfileDropdown = ({ trigger, defaultOpen, align = 'end' }: Props) => {
  const [user, setUser] = useState<{ full_name: string; email: string } | null>(null)

useEffect(() => {
  api.get('/api/user').then((res) => setUser(res.data)).catch(() => setUser(null))
}, [])

const initials = user?.full_name?.split(' ').map((n) => n[0]).join('').toUpperCase() ?? '?'
  return (
    <DropdownMenu defaultOpen={defaultOpen}>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent className='w-80' align={align || 'end'}>
        <DropdownMenuLabel className='flex items-center gap-4 px-4 py-2.5 font-normal'>
  <div className='relative'>
    <Avatar className='size-10'>
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
    {user && <span className='ring-card absolute right-0 bottom-0 block size-2 rounded-full bg-green-600 ring-2' />}
  </div>
  <div className='flex flex-1 flex-col items-start'>
    {user ? (
      <>
        <span className='text-foreground text-lg font-semibold'>{user.full_name}</span>
        <span className='text-muted-foreground text-base'>{user.email}</span>
      </>
    ) : (
      <>
        <span className='text-foreground text-lg font-semibold'>არ ხართ შემოსული</span>
        <span className='text-muted-foreground text-sm'>
          <a href='/authentication/login' className='text-primary underline'>Sign in</a>
          <a href='/authentication/register' className='text-primary underline ml-2'>or register</a>
        </span>
      </>
    )}
  </div>
</DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem className='px-4 py-2.5 text-base'>
            <UserIcon className='text-foreground size-5' />
            <a href='/profile'>Profile</a>
          </DropdownMenuItem>
          <DropdownMenuItem className='px-4 py-2.5 text-base'>
            <CreditCardIcon className='text-foreground size-5' />
            <a href='/packets'>Billing</a>
          </DropdownMenuItem>
          <DropdownMenuItem className='px-4 py-2.5 text-base'>
            <SettingsIcon className='text-foreground size-5' />
            <span>Settings</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem variant='destructive' className='px-4 py-2.5 text-base'>
          <LogOutIcon className='size-5' />
          <a href='/authentication/register'>Logout</a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default ProfileDropdown
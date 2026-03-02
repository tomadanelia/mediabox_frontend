import { useState, useEffect, type ReactNode } from 'react'
import api from '../../../lib/axios'
import {
  UserIcon,
  SettingsIcon,
  CreditCardIcon,
  LogOutIcon
} from 'lucide-react'
import { Link } from 'react-router-dom'
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
          <Link to='/authentication/login' className='text-primary underline'>Sign in</Link>
          <Link to='/authentication/register' className='text-primary underline ml-2'>or register</Link>
        </span>
      </>
    )}
  </div>
</DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem className='px-4 py-2.5 text-base'>
            <UserIcon className='text-foreground size-5' />
            <Link to='/profile'>Profile</Link>
          </DropdownMenuItem>
          <DropdownMenuItem className='px-4 py-2.5 text-base'>
            <CreditCardIcon className='text-foreground size-5' />
            <Link to='/packets'>Billing</Link>
          </DropdownMenuItem>
          <DropdownMenuItem className='px-4 py-2.5 text-base'>
            <SettingsIcon className='text-foreground size-5' />
            <span>Settings</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem variant='destructive' className='px-4 py-2.5 text-base'>
          <LogOutIcon className='size-5' />
          <Link to='/authentication/register'>Logout</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default ProfileDropdown
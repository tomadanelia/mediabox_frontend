import type { ReactNode } from 'react'

import { SettingsIcon, XIcon, LinkIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu'

type Props = {
  trigger: ReactNode
  defaultOpen?: boolean
  align?: 'start' | 'center' | 'end'
}

const NotificationDropdown = ({ trigger, defaultOpen, align = 'end' }: Props) => {
  return (
    <DropdownMenu defaultOpen={defaultOpen}>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent className='max-w-xs sm:max-w-122' align={align || 'end'}>
        <Tabs defaultValue='inbox' className='gap-0'>
          <DropdownMenuLabel className='flex flex-col pb-0'>
            <div className='flex items-center justify-between gap-6 pb-2.5'>
              <span className='text-muted-foreground text-base font-normal uppercase'>Notifications</span>
              <Badge variant='secondary' className='bg-primary/10 text-primary font-normal'>
                8 New
              </Badge>
            </div>
            <div className='-mb-0.5 flex items-center justify-between gap-4'>
              <TabsList className='relative h-fit rounded-none bg-transparent p-0'>
                <TabsTrigger
                  value='inbox'
                  className='data-[state=active]:!border-b-primary rounded-none border-b-2 border-b-transparent font-normal data-[state=active]:bg-transparent data-[state=active]:shadow-none dark:data-[state=active]:border-transparent dark:data-[state=active]:bg-transparent'
                >
                  Inbox
                </TabsTrigger>
                <TabsTrigger
                  value='general'
                  className='data-[state=active]:!border-b-primary rounded-none border-b-2 border-b-transparent font-normal data-[state=active]:bg-transparent data-[state=active]:shadow-none dark:data-[state=active]:border-transparent dark:data-[state=active]:bg-transparent'
                >
                  General
                </TabsTrigger>
              </TabsList>
              <SettingsIcon className='size-5' />
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator className='mt-0 h-0.5' />

          <TabsContent value='inbox'>
            <DropdownMenuItem className='gap-3 px-2 py-3 text-base'>
              <Avatar className='size-9.5'>
                <AvatarFallback>TD</AvatarFallback>
              </Avatar>
              <div className='flex w-full flex-col items-start'>
                <span className='text-base font-medium'>Toma Danelia</span>
                <div className='flex items-center gap-2.5'>
                  <span className='text-muted-foreground text-sm'>12 Minutes ago</span>
                  <div className='bg-muted size-1.5 rounded-full' />
                  <span className='text-muted-foreground text-sm'>New post</span>
                </div>
              </div>
              <div className='flex flex-col items-center gap-3'>
                <XIcon className='text-foreground size-3.5' />
                <div className='bg-primary size-1.5 rounded-full' />
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className='gap-3 px-2 py-3 text-base'>
              <Avatar className='size-9.5'>
                <AvatarFallback>AR</AvatarFallback>
              </Avatar>
              <div className='flex w-full flex-col items-start'>
                <span className='text-base font-medium'>Alex Rivera</span>
                <div className='flex items-center gap-2.5'>
                  <span className='text-muted-foreground text-sm'>27 Minutes ago</span>
                  <div className='bg-muted size-1.5 rounded-full' />
                  <span className='text-muted-foreground text-sm'>New comment</span>
                </div>
              </div>
              <div className='flex flex-col items-center gap-3'>
                <XIcon className='text-foreground size-3.5' />
                <div className='bg-primary size-1.5 rounded-full' />
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className='items-start gap-3 px-2 py-3 text-base'>
              <Avatar className='size-9.5'>
                <AvatarFallback>SK</AvatarFallback>
              </Avatar>
              <div className='flex w-full flex-col items-start'>
                <span className='text-base font-medium'>Sara Kim has applied to create an ad for your campaign</span>
                <div className='flex items-center gap-2.5'>
                  <span className='text-muted-foreground text-sm'>2 hours ago</span>
                  <div className='bg-muted size-1.5 rounded-full' />
                  <span className='text-muted-foreground text-sm'>New request for campaign</span>
                </div>
                <div className='mt-3 flex items-center gap-4'>
                  <Button variant='secondary' size='sm'>
                    Decline
                  </Button>
                  <Button size='sm'>Accept</Button>
                </div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className='items-start gap-3 px-2 py-3 text-base'>
              <Avatar className='size-9.5'>
                <AvatarFallback>LM</AvatarFallback>
              </Avatar>
              <div className='flex w-full flex-col items-start'>
                <span className='text-base font-medium'>Lucas Mendes attached the file</span>
                <div className='flex items-center gap-2.5'>
                  <span className='text-muted-foreground text-sm'>6 hours ago</span>
                  <div className='bg-muted size-1.5 rounded-full' />
                  <span className='text-muted-foreground text-sm'>Attached files</span>
                </div>
                <div className='mt-3 flex items-center gap-1.5'>
                  <LinkIcon className='text-foreground' />
                  <span className='text-sm'>Work examples.com</span>
                </div>
              </div>
            </DropdownMenuItem>
          </TabsContent>

          <TabsContent value='general'>
            <DropdownMenuItem className='gap-3 px-2 py-3 text-base'>
              <Avatar className='size-9.5'>
                <AvatarFallback>PS</AvatarFallback>
              </Avatar>
              <div className='flex w-full flex-col items-start'>
                <span className='text-base font-medium'>Priya Sharma</span>
                <div className='flex items-center gap-2.5'>
                  <span className='text-muted-foreground text-sm'>39 Minutes ago</span>
                  <div className='bg-muted size-1.5 rounded-full' />
                  <span className='text-muted-foreground text-sm'>New comment</span>
                </div>
              </div>
              <div className='flex flex-col items-center gap-3'>
                <XIcon className='text-foreground size-3.5' />
                <div className='bg-primary size-1.5 rounded-full' />
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className='items-start gap-3 px-2 py-3 text-base'>
              <Avatar className='size-9.5'>
                <AvatarFallback>MJ</AvatarFallback>
              </Avatar>
              <div className='flex w-full flex-col items-start'>
                <span className='text-base font-medium'>Mike Johnson attached the file</span>
                <div className='flex items-center gap-2.5'>
                  <span className='text-muted-foreground text-sm'>3 hours ago</span>
                  <div className='bg-muted size-1.5 rounded-full' />
                  <span className='text-muted-foreground text-sm'>Attached files</span>
                </div>
                <div className='mt-3 flex items-center gap-1.5'>
                  <LinkIcon className='text-foreground' />
                  <span className='text-sm'>Work examples.com</span>
                </div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className='gap-3 px-2 py-3 text-base'>
              <Avatar className='size-9.5'>
                <AvatarFallback>NK</AvatarFallback>
              </Avatar>
              <div className='flex w-full flex-col items-start'>
                <span className='text-base font-medium'>Nate Kim</span>
                <div className='flex items-center gap-2.5'>
                  <span className='text-muted-foreground text-sm'>5 hours ago</span>
                  <div className='bg-muted size-1.5 rounded-full' />
                  <span className='text-muted-foreground text-sm'>New post</span>
                </div>
              </div>
              <div className='flex flex-col items-center gap-3'>
                <XIcon className='text-foreground size-3.5' />
                <div className='bg-primary size-1.5 rounded-full' />
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className='items-start gap-3 px-2 py-3 text-base'>
              <Avatar className='size-9.5'>
                <AvatarFallback>EV</AvatarFallback>
              </Avatar>
              <div className='flex w-full flex-col items-start'>
                <span className='text-base font-medium'>Elena Vasquez has applied to create an ad for your campaign</span>
                <div className='flex items-center gap-2.5'>
                  <span className='text-muted-foreground text-sm'>8 hours ago</span>
                  <div className='bg-muted size-1.5 rounded-full' />
                  <span className='text-muted-foreground text-sm'>New request for campaign</span>
                </div>
                <div className='mt-3 flex items-center gap-4'>
                  <Button variant='secondary' size='sm'>
                    Decline
                  </Button>
                  <Button size='sm'>Accept</Button>
                </div>
              </div>
            </DropdownMenuItem>
          </TabsContent>
        </Tabs>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default NotificationDropdown
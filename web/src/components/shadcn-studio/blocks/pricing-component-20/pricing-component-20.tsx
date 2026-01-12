import type { ComponentType } from 'react'

import { CheckIcon, PhoneIcon, CircleCheckIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

import { cn } from '@/lib/utils'
import { MotionPreset } from '@/components/ui/motion-preset'
import { Rating } from '@/components/ui/rating'
import { NumberTicker } from '@/components/ui/number-ticker'

type PricingPlans = {
  title: string
  description: string
  price: number
  features: string[]
  icon: ComponentType
  buttonLabel: string
  isPopular?: boolean
}[]

type TableFeatures = {
  feature: string
  plans: string[]
}[]

const Pricing = ({ pricingPlans, tableFeatures }: { pricingPlans: PricingPlans; tableFeatures: TableFeatures }) => {
  return (
    <div className='bg-muted py-8 sm:py-16 lg:py-24'>
      <div className='mx-auto max-w-7xl space-y-11 px-4 sm:px-6 lg:px-8'>
        <div className='flex flex-col items-start justify-between gap-3 lg:flex-row lg:items-center'>
          <MotionPreset
            className='flex w-full flex-col gap-4 lg:w-4xl'
            fade
            blur
            slide={{ offset: 50 }}
            transition={{ duration: 0.5 }}
          >
            <div className='flex w-full flex-col gap-4 lg:w-4xl'>
              <h2 className='text-foreground text-4xl leading-10 font-semibold'>
                Select a plan That Unlocks the Features You Need
              </h2>
              <p className='text-muted-foreground text-xl leading-7'>
                Unlock your website&apos;s potential with a variety of plans that give you the flexibility to choose
                your design and features.
              </p>
            </div>
          </MotionPreset>

          <MotionPreset
            className='flex flex-col items-end gap-4'
            fade
            blur
            slide={{ direction: 'right', offset: 50 }}
            transition={{ duration: 0.5 }}
          >
            <div className='flex flex-col items-end gap-4'>
              <div className='flex -space-x-5'>
                {[
                  'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-1.png',
                  'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-2.png',
                  'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-3.png',
                  'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-4.png'
                ].map((src, index) => (
                  <Avatar key={index} className='border-background size-12 border-2'>
                    <AvatarImage src={src} />
                    <AvatarFallback>{`U${index + 1}`}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <div className='flex flex-col items-end gap-1'>
                <div className='flex items-center gap-3'>
                  <span className='text-foreground text-xl font-medium'>4.5</span>

                  <Rating readOnly variant='yellow' size={16} value={4.5} precision={0.5} />
                </div>
                <p className='text-muted-foreground text-sm font-medium'>From 4000+ review</p>
              </div>
            </div>
          </MotionPreset>
        </div>

        <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4'>
          {pricingPlans.map(({ title, description, price, features, icon: Icon, buttonLabel, isPopular }, index) => (
            <MotionPreset
              key={index}
              fade
              blur
              slide={{ direction: 'down', offset: 50 }}
              delay={0.3 + index * 0.1}
              transition={{ duration: 0.7 }}
            >
              <Card key={index} className='sm:max-md:mx-auto sm:max-md:w-lg'>
                <CardContent className='flex flex-col gap-6'>
                  <div className='flex flex-col gap-5'>
                    <div className='flex flex-col'>
                      {isPopular ? (
                        <div className='mb-3 flex items-center justify-between gap-2'>
                          <div className='bg-primary [&>svg]:text-primary-foreground w-fit rounded-full p-4 [&>svg]:size-6'>
                            <Icon />
                          </div>
                          {isPopular && <Badge variant='outline'>Most Popular</Badge>}
                        </div>
                      ) : (
                        <div className='bg-primary/10 [&>svg]:text-primary mb-3 flex size-15 items-center justify-center rounded-full p-4 [&>svg]:size-6'>
                          <Icon />
                        </div>
                      )}
                      <h3 className='text-lg font-semibold'>{title}</h3>
                      <p className='text-muted-foreground'>{description}</p>
                    </div>
                    <div className='flex gap-2'>
                      <span className='text-muted-foreground text-lg font-medium'>$</span>
                      <span className='text-5xl font-semibold'>
                        <NumberTicker startValue={0} value={price} delay={0.4 + index * 0.1} />
                      </span>
                      <span className='text-muted-foreground self-end'>per month</span>
                    </div>
                  </div>
                  <Button className={cn({ 'bg-primary/10 text-primary hover:bg-primary/20': !isPopular })}>
                    {buttonLabel}
                  </Button>
                  <div className='flex flex-col gap-3'>
                    {features.map((feature, idx) => (
                      <div key={idx} className='flex items-center gap-2 p-1'>
                        <CheckIcon className='size-6' />
                        <span className='font-medium'>{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </MotionPreset>
          ))}
        </div>

        <MotionPreset fade blur slide={{ direction: 'down', offset: 50 }} delay={0.9} transition={{ duration: 0.5 }}>
          <Card className='border-primary from-primary/10 bg-gradient-to-r to-transparent py-3 shadow-none'>
            <CardContent className='flex items-center gap-3 px-4'>
              <div className='flex flex-1 flex-col gap-2'>
                <h3 className='text-2xl font-medium'>Compare features by plan</h3>
                <p className='text-primary text-xl opacity-80'>Easily compare feature across all available plans.</p>
              </div>
              <Button className='bg-primary text-primary-foreground'>
                <PhoneIcon />
                Book a call
              </Button>
            </CardContent>
          </Card>
        </MotionPreset>

        <MotionPreset fade blur slide={{ direction: 'down', offset: 50 }} delay={1.1} transition={{ duration: 0.5 }}>
          <Table>
            <TableHeader>
              <TableRow className='text-base'>
                <TableHead className='font-medium'>Feature</TableHead>
                <TableHead className='font-medium'>Free</TableHead>
                <TableHead className='font-medium'>Team</TableHead>
                <TableHead className='font-medium'>Pro</TableHead>
                <TableHead className='font-medium'>Custom</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableFeatures.map(({ feature, plans }, idx) => (
                <TableRow key={idx}>
                  <TableCell className='p-3.5 text-base font-medium'>{feature}</TableCell>
                  {plans.map((plan, i) => (
                    <TableCell key={i}>
                      <div className='flex items-center gap-3'>
                        {plan !== '-' && plan !== 'Lifetime' && <CircleCheckIcon className='size-6' />}
                        <span className='text-base font-medium'>{plan}</span>
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </MotionPreset>
      </div>
    </div>
  )
}

export default Pricing

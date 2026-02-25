import type { ComponentType } from 'react'

import { CheckIcon, PhoneIcon, CircleCheckIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

import { cn } from '@/lib/utils'
import { MotionPreset } from '@/components/ui/motion-preset'
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

const Pricing = ({ pricingPlans}: { pricingPlans: PricingPlans;}) => {
  return (
    <div className='bg-muted py-8 sm:py-16 lg:py-24'>
      <div className='mx-auto max-w-7xl space-y-0 px-4 sm:px-6 lg:px-8'>
        <div className='flex flex-col items-start justify-between gap-3 lg:flex-row lg:items-center'>
          <MotionPreset
            className='flex flex-col items-end gap-4'
            fade
            blur
            slide={{ direction: 'right', offset: 50 }}
            transition={{ duration: 0.5 }}
          >
            
          </MotionPreset>
        </div>

        <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4'>
          {pricingPlans.map(({ title, price, features, icon: Icon, buttonLabel, isPopular }, index) => (
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


        
      </div>
    </div>
  )
}

export default Pricing

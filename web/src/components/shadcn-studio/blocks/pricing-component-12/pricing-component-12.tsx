import type { ComponentType } from 'react'

import { CheckIcon } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

import { StarsBackground } from '@/components/ui/background-stars'

type Plans = {
  icon: ComponentType
  name: string
  price: number
  description: string
  features: string[]
}[]

const Pricing = ({ plans }: { plans: Plans }) => {
  return (
    <div className='relative py-8 sm:py-16 lg:py-24'>
      <div className='absolute inset-0 -z-10'>
        <img
          src='https://cdn.shadcnstudio.com/ss-assets/blocks/marketing/pricing/image-1.png'
          alt='bg image'
          className='h-full w-full object-cover'
        />
      </div>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <StarsBackground className='absolute inset-0 flex items-center justify-center rounded-xl' />
        <div className='mb-12 flex flex-col items-center gap-4 text-center sm:mb-16 lg:mb-24'>
          <Badge variant='secondary' className='bg-primary text-primary-foreground text-sm font-normal uppercase'>
            Pricing
          </Badge>
          <h2 className='text-2xl font-semibold text-white md:text-3xl lg:text-4xl'>
            Choose the best option for your logistic company
          </h2>
          <p className='text-xl text-white'>
            A Comprehensive Breakdown of Our Pricing Plans to Help You Make the Best Choice!
          </p>
        </div>

        <div className='flex items-center justify-center gap-6 max-md:flex-col'>
          {plans.map((plan, index) => (
            <Card
              key={index}
              className='w-full max-w-md rounded-3xl border-2 border-white/30 bg-white/15 py-8 shadow-none backdrop-blur-lg'
            >
              <CardContent className='flex flex-col gap-8 px-8'>
                <div className='flex flex-col gap-4'>
                  {/* Icon with glow effect */}
                  <div className='relative flex size-15 items-center justify-center overflow-hidden rounded-2xl border-2 border-white/30 [&>svg]:size-6 [&>svg]:text-white'>
                    <plan.icon />
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      width='48'
                      height='16'
                      viewBox='0 0 48 16'
                      fill='none'
                      className='absolute -bottom-0.5 left-1.5'
                    >
                      <g opacity='0.82' filter='url(#filter0_f_16924_103104)'>
                        <ellipse cx='17' cy='7' rx='17' ry='7' transform='matrix(-1 0 0 1 41 7)' fill='white' />
                      </g>
                      <defs>
                        <filter
                          id='filter0_f_16924_103104'
                          x='0'
                          y='0'
                          width='48'
                          height='28'
                          filterUnits='userSpaceOnUse'
                          colorInterpolationFilters='sRGB'
                        >
                          <feFlood floodOpacity='0' result='BackgroundImageFix' />
                          <feBlend mode='normal' in='SourceGraphic' in2='BackgroundImageFix' result='shape' />
                          <feGaussianBlur stdDeviation='3.5' result='effect1_foregroundBlur_16924_103104' />
                        </filter>
                      </defs>
                    </svg>
                  </div>
                  <h3 className='text-3xl font-semibold text-white'>{plan.name}</h3>
                  <div className='flex gap-1'>
                    <span className='text-lg font-medium text-white'>$</span>
                    <span className='text-5xl font-bold text-white'>{plan.price}</span>
                    <span className='self-end text-lg text-white'>/month</span>
                  </div>
                  <p className='line-clamp-3 text-white'>{plan.description}</p>
                </div>
                <ul className='space-y-2.5'>
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className='flex items-start gap-2 py-1 text-white'>
                      <CheckIcon className='mt-1.5 size-3.5 shrink-0' />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button className='w-full bg-white text-black hover:bg-white/90' size='lg'>
                  Get started
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Pricing

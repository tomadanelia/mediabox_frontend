'use client'

import { useId, useState } from 'react'
import { EyeIcon, EyeOffIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface InputPasswordDemoProps extends React.ComponentProps<typeof Input> {
  label?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

const InputPasswordDemo: React.FC<InputPasswordDemoProps> = ({
  label = 'Password input',
  value,
  onChange,
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const id = useId()

  return (
    <div className='w-full space-y-2'>
      <div className='relative'>
        <Input
          id={id}
          type={isVisible ? 'text' : 'password'}
          placeholder='Password'
          value={value}
          onChange={onChange}
          className='pr-9'
          {...props}
        />
        <Button
          variant='ghost'
          size='icon'
          onClick={() => setIsVisible(prev => !prev)}
          className='text-muted-foreground focus-visible:ring-ring/50 absolute inset-y-0 right-0 rounded-l-none hover:bg-transparent'
        >
          {isVisible ? <EyeOffIcon /> : <EyeIcon />}
          <span className='sr-only'>{isVisible ? 'Hide password' : 'Show password'}</span>
        </Button>
      </div>
    </div>
  )
}

export default InputPasswordDemo

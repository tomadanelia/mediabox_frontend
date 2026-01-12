import { useId } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const InputRequiredDemo = () => {
  const id = useId()

  return (
    <div className='w-full space-y-2'>
      <Label htmlFor={id} className='gap-1'>
        Required input <span className='text-destructive'>*</span>
      </Label>
      <Input id={id} type='email' placeholder='Email address' required />
    </div>
  )
}

export default InputRequiredDemo

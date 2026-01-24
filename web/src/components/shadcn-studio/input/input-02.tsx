import { useId } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface InputLabelDemoProps extends React.ComponentProps<typeof Input> {
  label?: string
}

const InputLabelDemo: React.FC<InputLabelDemoProps> = ({ label = 'Input with label', ...props }) => {
  const id = useId()

  return (
    <div className='w-full space-y-2'>
      <Input id={id} type='email' placeholder='Email address' {...props} />
    </div>
  )
}

export default InputLabelDemo

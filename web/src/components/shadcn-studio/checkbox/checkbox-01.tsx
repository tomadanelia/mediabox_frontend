import { useId } from 'react'

import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

const CheckboxDemo = ({ label }: { label?: string }) => {
  const id = useId()

  return (
    <div className='flex items-center gap-2'>
      <Checkbox id={id} className="cursor-pointer" />
      {label && <Label htmlFor={id} className="cursor-pointer">{label}</Label>}
    </div>
  )
}

export default CheckboxDemo

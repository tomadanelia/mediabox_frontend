import { useId } from 'react'
import { UserIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface InputStartIconDemoProps extends React.ComponentProps<typeof Input> {
  label?: string
}

const InputStartIconDemo: React.FC<InputStartIconDemoProps> = ({ label = 'Input with start icon', ...props }) => {
  const id = useId()

  return (
    <div className="w-full space-y-2">
      <div className="relative">
        <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center pl-3 peer-disabled:opacity-50">
          <UserIcon className="size-4" />
          <span className="sr-only">User</span>
        </div>
        <Input id={id} type="text" placeholder="Username" className="peer pl-9" {...props} />
      </div>
    </div>
  )
}

export default InputStartIconDemo

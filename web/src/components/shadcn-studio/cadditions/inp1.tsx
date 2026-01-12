import { useId, useState } from 'react'

import { MicIcon, SearchIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const InputSearchIconDemo = () => {
  const id = useId()
const [searchOpen, setSearchOpen] = useState(false)

const toggleSearch = () => setSearchOpen(!searchOpen)

  return (
    <div className='w-full max-w-xs space-y-2'>
      <div className='relative'>
        <div className=' pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center pl-3 peer-disabled:opacity-50'>
          <SearchIcon className='size-4'/>
          <span className='sr-only'>Search</span>
        </div>
        <Input
          id={id}
          type='search'
          placeholder='Search...'
          onFocus={toggleSearch}
         onBlur={toggleSearch}
          className={`peer px-9 [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none [&::-webkit-search-results-button]:appearance-none [&::-webkit-search-results-decoration]:appearance-none bg-white transition-all duration-300 ${
            searchOpen ? 'w-[200px]' : 'w-33'
          }`}
        />

        <Button
          variant='ghost'
          size='icon'
          className=' focus-visible:ring-ring/50 absolute inset-y-0 right-0 rounded-l-none hover:bg-transparent'
        >
          <MicIcon />
          <span className='sr-only'>Press to speak</span>
        </Button>
      </div>
    </div>
  )
}

export default InputSearchIconDemo

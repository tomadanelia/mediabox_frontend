'use client'

import { useState } from 'react'
import { type DateRange } from 'react-day-picker'
import { Calendar } from '@/components/ui/calendar'

const CalendarCustomRangeSelectDemo = () => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const weekAgo = new Date(today)
  weekAgo.setDate(today.getDate() - 6)

  const [dateRange] = useState<DateRange | undefined>({
    from: weekAgo,
    to: today
  })

  const [selectedDay, setSelectedDay] = useState<Date | undefined>(today)

  return (
    <div>
      <Calendar
        mode='range'
        defaultMonth={dateRange?.from}
        selected={dateRange}
        onSelect={() => {}}
        onDayClick={(day) => {
          if (day >= weekAgo && day <= today) {
            setSelectedDay(day)
          }
        }}
        disabled={(date) => date < weekAgo || date > today}
        modifiers={{
          selectedDay: selectedDay ? [selectedDay] : []
        }}
        modifiersClassNames={{
          selectedDay: '[&_button]:ring-4 [&_button]:ring-yellow-400 [&_button]:ring-inset'
        }}
        className='rounded-md border'
        classNames={{
          range_start: 'bg-blue-600/20 dark:bg-blue-400/10 rounded-l-full',
          range_end: 'bg-green-600/20 dark:bg-green-400/10 rounded-r-full',
          day_button:
            'data-[range-end=true]:rounded-full! data-[range-start=true]:rounded-full! data-[range-start=true]:bg-blue-600! data-[range-start=true]:text-white! data-[range-start=true]:dark:bg-blue-400! data-[range-start=true]:group-data-[focused=true]/day:ring-blue-600/20 data-[range-start=true]:dark:group-data-[focused=true]/day:ring-blue-400/40 data-[range-end=true]:bg-green-600! data-[range-end=true]:text-white! data-[range-end=true]:dark:bg-green-400! data-[range-end=true]:group-data-[focused=true]/day:ring-green-600/20 data-[range-end=true]:dark:group-data-[focused=true]/day:ring-green-400/40 data-[range-middle=true]:rounded-none data-[range-middle=true]:bg-blue-600/20 data-[range-middle=true]:dark:bg-blue-400/10 hover:rounded-full',
          today:
            'data-[selected=true]:rounded-l-none! rounded-full bg-accent! data-[selected=true]:bg-blue-600/20! dark:data-[selected=true]:bg-blue-400/10! [&_button[data-range-middle=true]]:bg-transparent!'
        }}
      />

    </div>
  )
}

export default CalendarCustomRangeSelectDemo


import React, { useState,useRef,useEffect } from 'react';
import VideoPlayer from '@/hmcomponents/videoplayer';
import DataTableDemo from '@/components/shadcn-studio/data-table/data-table-11';
import Timeline from '@/hmcomponents/timeline';
import DataTableDemoCL from '@/components/shadcn-studio/data-table/data-table-c1';
import IconButtonModeDemo from '@/components/shadcn-studio/button/button-34';
import ButtonDownloadDemo from '@/components/shadcn-studio/button/button-14';
import ButtonCopyDemo from '@/components/shadcn-studio/button/custom/button-02';
import IconButtonDemo from '@/components/shadcn-studio/button/button-31';
import IconButtonCalendar from '@/components/shadcn-studio/button/custom/button-01';
import ButtonGroupRoundedDemo from '@/components/shadcn-studio/button-group/button-group-04';
import ButtonGroupLikeDemo from '@/components/shadcn-studio/button-group/button-group-02';
import BadgeLiveDemo from '@/components/shadcn-studio/badge/cusotm/badge-c01';
import ButtonGroupSocialDemo from '@/components/shadcn-studio/button-group/button-group-05';
import CalendarCustomRangeSelectDemo from '@/components/shadcn-studio/calendar/calendar-14';
import InputSearchIconDemo from '@/components/shadcn-studio/cadditions/inp1';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Volleyball,
  Clapperboard,
  ChessRook,
  Gamepad2,
  Newspaper,
  Music,
  Camera,
  Code,
  Dumbbell,
  Plane,
  BookOpen,
  ShoppingCart,
  Heart,
  Mic,
  Film,
} from "lucide-react"
import { GeorgiaLogo } from '@/components/svg_telecom_production/svglib';

// Add a button to toggle the calendar visibility


export const Stream: React.FC = () => { 
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [data, setData] = useState<any>(null)
  const [timeProgramm,setTimeProgramm] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const didFetch = useRef(false)
  const didFetchProgramm = useRef(false)
    const channels = [
  // Sports
  { id: 22, name: 'ESPN Sports', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', categories: ['sports'], thumbnail: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg' },
 ];                                                                                                                                   
 const [selectedChannel, setSelectedChannel] = useState(channels[0]);
  const toggleCalendar = () => {
    setIsCalendarVisible(prev => !prev);
  };


  useEffect(() => {
  if (didFetch.current) return
  didFetch.current = true

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("http://159.89.20.100/api/channels")
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const result = await response.json()
      setData(result)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  fetchData()
  }, [])
useEffect(() => {
  if (!selectedChannel?.id) return

  const controller = new AbortController()

  const fetchPrograms = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(
        `http://159.89.20.100/api/channels/${selectedChannel.id}/programs?date=2026-01-24`,
        { signal: controller.signal }
      )
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const result = await response.json()
      setTimeProgramm(result)
    } catch (err: any) {
      if (err.name !== 'AbortError') setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  fetchPrograms()

  return () => controller.abort()
}, [selectedChannel?.id])



  useEffect(() => {
  if (data) console.log("channels:", data)
  }, [data])
  console.log(timeProgramm);
  

 useEffect(() => {
  if (selectedChannel) console.log("selectedchannel:", selectedChannel)
}, [selectedChannel])
  const categories = [
  { id: 'Georgian', icon: null, label: 'Georgian',logo: GeorgiaLogo  },
  { id: 'movies', icon: Clapperboard, label: 'Movies' },
  { id: 'chess', icon: ChessRook, label: 'Chess' },
  { id: 'gaming', icon: Gamepad2, label: 'Gaming' },
  { id: 'news', icon: Newspaper, label: 'News' },
  { id: 'music', icon: Music, label: 'Music' },
  { id: 'photography', icon: Camera, label: 'Photography' },
  { id: 'coding', icon: Code, label: 'Coding' },
];

const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
const filteredChannels = selectedCategories.length > 0 
  ? channels.filter(channel => 
      channel.categories.some(cat => selectedCategories.includes(cat))
    )
  : channels;
const toggleCategory = (categoryId: string) => {
  setSelectedCategories(prev =>
    prev.includes(categoryId) ? [] : [categoryId]
  );
};

  const schedule = [
    { time: '08:00', show: 'Morning Show' },
    { time: '09:30', show: 'News' },
    { time: '11:00', show: 'Talk Show' },
    { time: '13:00', show: 'Lunch Time' },
  ];

  return (
    <div className="flex flex-col justify-between w-full h-[calc(100vh-80px)] relative">

      {/* TOP: fills space */}
      <div className="flex-1 flex w-full ">

        {/* LEFT */}
        <div className="w-1/4 flex flex-col h-full overflow-hidden">
          <div className="h-15  flex items-center py-2 ">
            <div className='px-1 w-full h-full bg-gray-800 rounded-r-[10px] flex items-center justify-center'>
              <div className="font-bold flex items-center justify-between w-full">
                <div className='text-white ml-4'>
                  Channels
                </div>
                <div>
                  <InputSearchIconDemo />
                </div>

              </div>
            </div>

          </div>
          <div className="flex-1 overflow-y-auto ">
            <DataTableDemo 
  filteredChannels={data} 
  onChannelSelect={(channel) => {
    setSelectedChannel(channel);
  }}
/>
          </div>
        </div>

        {/* CENTER */}
        <div className="w-1/2 relative h-full flex flex-col ">
          <div className=''>
            <div className=' h-10 flex items-center justify-between px-4'>
              <div className='flex items-center z-2 gap-2 '>
                <div>
                  <BadgeLiveDemo />
                </div>
              </div>
              <div className='h-[40px] absolute w-full flex z-1 items-center justify-center gap-2'>
                <ButtonGroupSocialDemo />
                <ButtonCopyDemo />

              </div>

              <div className='flex items-center h-full gap-2 z-2'>


                <div className='flex gap-2'>
                  <div>
                    <IconButtonDemo />
                  </div>
                  <div >
                    <ButtonGroupLikeDemo />
                  </div>

                </div>
              </div>
            </div>

          </div>
          <div className='flex-1 flex flex-col h-full'>
            <VideoPlayer stream={selectedChannel} />
          </div>

          <div className=''>
            <div className=' h-10 flex items-center justify-between px-4'>
              {/* <div className='flex'>
                <ButtonGroupRoundedDemo />
              </div> */}
              

            </div>

          </div>
        </div>

        {/* RIGHT */}
        <div className="w-1/4 flex flex-col ">
          <div className="h-15  flex items-center py-2">
            <div className="px-1 w-full h-full bg-gray-800 rounded-l-[10px] flex items-center justify-between">
              <div className='flex items-center justify-center'>
                <div className='h-9 w-9 rounded-[[8px]]'>
                  <div className="h-full  w-full bg-linear-to-br from-blue-400 to-purple-600 rounded-[8px] flex items-center justify-center text-white font-bold text-sm">
                    {selectedChannel.name.charAt(0).toUpperCase()}
                  </div>
                </div>  <div className='ml-2 flex items-center justify-center text-white font-bold' >
                  {selectedChannel.name}
                </div>
              </div>
              <div className='iclefts w-10 h-10 flex items-center justify-center'
                onClick={toggleCalendar}>
                <IconButtonCalendar />
              </div>

            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div onClick={toggleCalendar}>
              <DataTableDemoCL timeProgramm={timeProgramm} />
            </div>


            {isCalendarVisible && (
              <div className=' absolute top-0 right-0 p-1 dark:bg-gray-200 bg-gray-800 rounded-md ml-4 mt-14'>
                <CalendarCustomRangeSelectDemo />
              </div>
            )}

          </div>
        </div>
      </div>
<div>
  <div className=' flex-1 h-10'>
                <Timeline />
              </div>
      <div className="h-14 justify-center bg-gray-700 dark:bg-gray-600 w-full shrink-0 flex items-center gap-4 px-4 overflow-x-auto">
        <div className="flex items-center left-4 justify-center gap-3">
          <IconButtonDemo />
        </div>
       <div className="flex gap-3 flex-wrap">
{categories.map((category) => {
  const IconOrLogo = category.icon || category.logo;
  const isSelected = selectedCategories.includes(category.id);

  return (
    <div
      key={category.id}
      onClick={() => toggleCategory(category.id)}
      className={`flex relative hover:-translate-y-1 hover:scale-[1.1] h-10 px-2 rounded-sm items-center justify-center transition-all cursor-pointer ${
        isSelected
          ? 'bg-gradient-to-br from-orange-500 to-yellow-500'
          : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
      }`}
    >
      {IconOrLogo && (
        <IconOrLogo
          className={
            isSelected
              ? 'text-white'
              : 'text-gray-500 dark:text-white'
          }
        />
      )}
 
      <div className='absolute w-full h-full '>
        <Tooltip>
                                      <TooltipTrigger asChild>
                                          <div className='w-full h-full'>
      
                                          </div>
                                      </TooltipTrigger>
                                      <TooltipContent side='bottom'>{category.id}</TooltipContent>
                                  </Tooltip>
      </div>

    </div>
  );
})}

</div>
      </div>
</div>

      
    </div>

  );
};
export default Stream;

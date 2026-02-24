

import React, { useState, useRef, useEffect } from 'react';
import VideoPlayer from '@/hmcomponents/videoplayer';
import DataTableDemo from '@/components/shadcn-studio/data-table/data-table-11';
import Timeline from '@/hmcomponents/timeline';
import DataTableDemoCL from '@/components/shadcn-studio/data-table/data-table-c1';
import IconButtonModeDemo from '@/components/shadcn-studio/button/button-34';
import ButtonDownloadDemo from '@/components/shadcn-studio/button/button-14';
import ButtonCopyDemo from '@/components/shadcn-studio/button/custom/button-02';
import IconButtonDemo from '@/components/shadcn-studio/button/button-31';
import IconButtonCalendar from '@/components/shadcn-studio/button/custom/button-01';
import ButtonMenuDemo from '@/components/shadcn-studio/button/custom/button-31';
import ButtonGroupRoundedDemo from '@/components/shadcn-studio/button-group/button-group-04';
import ButtonGroupLikeDemo from '@/components/shadcn-studio/button-group/button-group-02';
import BadgeLiveDemo from '@/components/shadcn-studio/badge/cusotm/badge-c01';
import ButtonGroupSocialDemo from '@/components/shadcn-studio/button-group/button-group-05';
import CalendarCustomRangeSelectDemo from '@/components/shadcn-studio/calendar/calendar-14';
import InputSearchIconDemo from '@/components/shadcn-studio/cadditions/inp1';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import ChannelCalendar from '@/hmcomponents/calendar';
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
  ToggleRight,
} from "lucide-react"
import { GeorgiaLogo } from '@/components/svg_telecom_production/svglib';



export const Stream: React.FC = () => {
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [data, setData] = useState<any>(null)
  const [timeProgramm, setTimeProgramm] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const didFetch = useRef(false)
  const didFetchProgramm = useRef(false)


  const [LeftList,setLeftList] = useState(false)
  const [RightList,SetRightList] = useState(false)

   const toggleLeftList = () => {
    setLeftList(prev => !prev);
  };
   const toggleRightList = () => {
    SetRightList(prev => !prev);
  };
  type Channel = {
  id: string;
  uuid: string;
  name: string;
  logo: string;
  number: number;
  url: string;
  categories: string[];
};
  const channels: Channel[] = [
  {
    id: '22',
    uuid: 'e7d585cb-9f87-4412-9961-401f57446a37',
    name: 'პირველი არხი',
    logo: 'https://img.mediabox.ge/22.png',
    number: 1,
    url: "",
    categories: []
  }
];
  
  const [selectedChannel, setSelectedChannel] = useState(channels[0]);
  const toggleCalendar = () => {
    setIsCalendarVisible(prev => !prev);
  };
  const [liveUnixSec, setLiveUnixSec] = useState(Math.floor(Date.now() / 1000))
  const [currentUnixSec, setCurrentUnixSec] = useState<number | null>(null)

  useEffect(() => {
    const id = setInterval(() => setLiveUnixSec(Math.floor(Date.now() / 1000)), 1000)
    return () => clearInterval(id)
  }, [])

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
          `http://159.89.20.100/api/channels/${selectedChannel.id}/programs?date=2026/02/23`,
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
    { id: 'Georgian', icon: null, label: 'Georgian', logo: GeorgiaLogo },
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
        {/* left placeholder */}
        <div className='w-[65px] flex lg:hidden'>
        </div> 
        {/* LEFT */}
        <div className={`absolute z-10 lg:relative flex flex-col h-full overflow-hidden bg-yel
    ${!LeftList ? 'w-1/3' : 'w-[65px] lg:w-1/4'}
  `}>
          
          <div className="h-15  flex items-center py-2">
            <div className='px-1 w-full h-full bg-gray-800 rounded-r-[10px] flex items-center justify-center'>
              <div className="font-bold flex items-center justify-between w-full">
                {/* <div className='text-white ml-4'>
                  Channels
                </div> */}
                {!LeftList&&(
                  <div className='lg:left-0 absolute'>
                  <InputSearchIconDemo />
                </div>
                )}
                 <div className='absolute flex items-center justify-center right-0 w-11 h-11 '>
                    <div className='bg-black rounded-sm w-8 h-8' onClick={toggleLeftList}>
                        <ButtonMenuDemo/>
                    </div>
                 </div>
              </div>
            </div>

          </div>
          <div className="flex-1 relative overflow-y-auto bg-gray">
            <DataTableDemo
              filteredChannels={data}

              onChannelSelect={(channel) => {
                setSelectedChannel(channel);
              }}
              selectedChannel={selectedChannel}
            />
           
          </div>
        </div>

        {/* CENTER */}
        <div className="w-[calc(100vw-130px)] lg:w-1/2 relative h-full flex flex-col ">
          <div className='flex flex-col'>
            <VideoPlayer stream={selectedChannel} />
          </div>
          <div className=''>
            <div className=' h-10 flex items-center justify-between px-4'>
              <div className='flex items-center z-2 gap-2 '>

              </div>
              <div className='h-[40px] absolute w-full flex z-1 items-center justify-center gap-2'>
                <ButtonGroupSocialDemo />
                <ButtonCopyDemo />

              </div>

              <div className='flex items-center h-full gap-2 z-2'>
              </div>
            </div>

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
        <div className={`absolute right-0 z-10 lg:relative flex flex-col h-full overflow-hidden bg-yel
    ${!RightList ? 'w-1/3' : 'w-[65px] lg:w-1/4'}
  `}>
          <div className="h-15  flex items-center py-2">
            <div className="px-1 w-full h-full bg-gray-800 rounded-l-[10px] flex items-center justify-between">
              <div className='flex items-center justify-center'>
                <div className='h-9 w-9 rounded-[[8px]]'>
                  <div className="h-full  w-full bg-white rounded-[8px] flex items-center justify-center text-white font-bold text-sm">
                    <img src={selectedChannel.logo} className='rounded-[10px] w-11/12 h-11/12' alt="" />
                  <div className='absolute flex items-center justify-center left-0 w-11 h-11 '>
                    <div className='bg-black rounded-sm w-8 h-8' onClick={toggleRightList}>
                        <ButtonMenuDemo/>
                    </div>
                 </div>
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
              <div className=' absolute top-0 right-0 p-1 w-full rounded-md ml-4 mt-14 '>
                <ChannelCalendar archiveDays={100} channelName="პირველი არხი" onSelect={(date) => console.log(date)} />

              </div>
            )}

          </div>
        
        </div>
      </div>
      <div>
        <div className=' flex-1 h-10'>
          <Timeline
            timeProgramm={timeProgramm}
            liveUnixSec={liveUnixSec}
            currentUnixSec={currentUnixSec}
            onSelectTime={(unixSec) => setCurrentUnixSec(unixSec)}
          />
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
                  className={`flex relative hover:-translate-y-1 hover:scale-[1.1] h-10 px-2 rounded-sm items-center justify-center transition-all cursor-pointer ${isSelected
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

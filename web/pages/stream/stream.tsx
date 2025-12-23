

import React, { useState } from 'react';
import VideoPlayer from '@/hmcomponents/videoplayer';
import DataTableDemo from '@/components/shadcn-studio/data-table/data-table-11';
import Timeline from '@/hmcomponents/timeline';
import DataTableDemoCL from '@/components/shadcn-studio/data-table/data-table-c1';
import IconButtonModeDemo from '@/components/shadcn-studio/button/button-34';
import IconButtonDemo from '@/components/shadcn-studio/button/button-31';
import IconButtonCalendar from '@/components/shadcn-studio/button/custom/button-01';
import ButtonGroupRoundedDemo from '@/components/shadcn-studio/button-group/button-group-04';
import ButtonGroupLikeDemo from '@/components/shadcn-studio/button-group/button-group-02';
export const Stream: React.FC = () => {
    const [selectedChannel, setSelectedChannel] = useState(0);

    const channels = [
        { id: 1, name: 'Channel 1', url: 'https://example.com/stream1' },
        { id: 2, name: 'Channel 2', url: 'https://example.com/stream2' },
        { id: 3, name: 'Channel 3', url: 'https://example.com/stream3' },
    ];

    const schedule = [
        { time: '08:00', show: 'Morning Show' },
        { time: '09:30', show: 'News' },
        { time: '11:00', show: 'Talk Show' },
        { time: '13:00', show: 'Lunch Time' },
    ];

return (
    <div className="flex flex-col w-full h-full relative">

  {/* TOP: fills leftover space */}
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
               <IconButtonDemo/>
          </div>
      
        </div>
        </div>
     
      </div>
      <div className="flex-1 overflow-y-auto ">
        <DataTableDemo />
      </div>
    </div>

    {/* CENTER */}
    <div className="w-1/2 h-full flex flex-col ">
       <div className='flex-1 flex flex-col h-full'>
           <VideoPlayer key={channels[selectedChannel].id} />
       </div>
   
      <div className='bg-green-50 flex-1'>
        <div className=' h-10 flex items-center justify-between px-4'>
             <div className='flex'>
                    <ButtonGroupRoundedDemo/>
             </div>
             <div className=' flex-1 h-10'>
                     <Timeline/>
             </div>
             <div className='flex'>
                  <div>
                        <IconButtonDemo/>
            </div>
            <div >
                      <ButtonGroupLikeDemo/>
            </div>
      
             </div>
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
                {channels[selectedChannel].name.charAt(0).toUpperCase()}
              </div>
            </div>  <div className='ml-2 flex items-center justify-center text-white font-bold' >
              {channels[selectedChannel].name}
            </div>
          </div> 
          <div className='iclefts'>
            <IconButtonCalendar/>
          </div>
         
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        
        <DataTableDemoCL />
      </div>
    </div>
  </div>

  {/* BOTTOM: fixed height */}
  <div className="h-20 bg-green-300 w-full shrink-0">
    BOTTOM
  </div>

</div>

  );
};
export default Stream;




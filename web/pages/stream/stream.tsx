

import React, { useState } from 'react';
import VideoPlayer from '@/hmcomponents/videoplayer';
import DataTableDemo from '@/components/shadcn-studio/data-table/data-table-11';
import Timeline from '@/hmcomponents/timeline';
import DataTableDemoCL from '@/components/shadcn-studio/data-table/data-table-c1';
import IconButtonModeDemo from '@/components/shadcn-studio/button/button-34';
import IconButtonDemo from '@/components/shadcn-studio/button/button-31';
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
      <div className="h-15 bg-purple-200 flex items-center px-4">
        <h2 className="font-bold">
         F <IconButtonDemo/>
        </h2>
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
  <div className="h-15 bg-purple-200 flex items-center px-4">
        <h2 className="font-bold">
         F <IconButtonDemo/>
        </h2>
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




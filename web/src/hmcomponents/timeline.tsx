import React from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button';
interface TimeProgram {
    id: string;
    title: string;
    startTime: string; // HH:mm format
    duration: number; // in minutes
}

const Timeline: React.FC = () => {
    // Test data
    const programs: TimeProgram[] = [
        { id: '1', title: 'Morning Show', startTime: '08:00', duration: 120 },
        { id: '2', title: 'Midday News', startTime: '12:00', duration: 60 },
        { id: '3', title: 'Evening Program', startTime: '18:00', duration: 180 },
        { id: '4', title: 'Night Show', startTime: '21:00', duration: 120 },
        { id: '5', title: 'Night Show', startTime: '21:30', duration: 120 },
    ];

    const timeToPercentage = (timeString: string): number => {
        const [hours, minutes] = timeString.split(':').map(Number);
        const totalMinutes = hours * 60 + minutes;
        return (totalMinutes / (24 * 60)) * 100;
    };

    return (
        <div className="w-full px-4">


            <div className="relative w-full h-10 rounded-lg p-4">
                {/* Timeline line */}
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-400 transform -translate-y-1/2 rounded-full"></div>

                {/* Time markers */}
                <div className="absolute -top-2 left-0 right-0 h-full flex justify-between text-xs text-gray-600 px-2">
                    <span>00:00</span>
                    <span>06:00</span>
                    <span>12:00</span>
                    <span>18:00</span>
                    <span>24:00</span>
                </div>

                {/* Program circles */}
                {programs.map((program) => (
                    <div
                        key={program.id}
                        className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2"
                        style={{ left: `${timeToPercentage(program.startTime)}%` }}>
                        <div className="group w-4 h-4 bg-gray-500 rounded-full border-2 border-white shadow-lg cursor-pointer hover:bg-gray-600">


                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className='w-full h-full'>

                                    </div>
                                </TooltipTrigger>
                                <TooltipContent side='bottom'>{program.title} at {program.startTime}</TooltipContent>
                            </Tooltip>
                        </div>

                    </div>
                ))}
            </div>

            {/* Program list */}

        </div>
    );
};

export default Timeline;
import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

type Program = {
  id: number;
  title: string;
  startTime: string;
  endTime: string;
  description?: string;
  isLive?: boolean;
};

type Channel = {
  id: number;
  name: string;
  logo?: string;
  programs: Program[];
};

type ChannelsPanelProps = {
  onClose: () => void;
  channels?: Channel[];
  onChannelSelect?: (channelId: number) => void;
};

const ChannelsPanelDemo: React.FC<ChannelsPanelProps> = ({ 
  onClose, 
  channels = [],
  onChannelSelect 
}) => {
  const [selectedChannelId, setSelectedChannelId] = useState<number | null>(
    channels.length > 0 ? channels[0].id : null
  );
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Generate dates for the next 7 days
  const generateDates = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const dates = generateDates();

  const handleChannelClick = (channelId: number) => {
    setSelectedChannelId(channelId);
    if (onChannelSelect) {
      onChannelSelect(channelId);
    }
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }
  };

  const selectedChannel = channels.find(ch => ch.id === selectedChannelId);

  return (
    <div className="absolute top-0 left-0 w-full h-full bg-black/95 backdrop-blur-md z-50 flex flex-col">
      {/* Header with Date Selection */}
      <div className="border-b border-white/10 p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-white text-2xl font-bold">TV Guide</h2>
          <button 
            onClick={onClose}
            className="text-white hover:text-orange-400 transition-colors p-2"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {dates.map((date, index) => (
            <button
              key={index}
              onClick={() => setSelectedDate(date)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                date.toDateString() === selectedDate.toDateString()
                  ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-semibold'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              {formatDate(date)}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Channels List - Left Side */}
        <div className="w-64 border-r border-white/10 overflow-y-auto">
          <div className="p-2">
            {channels.length === 0 ? (
              <div className="text-white/50 text-center py-8">
                No channels available
              </div>
            ) : (
              channels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => handleChannelClick(channel.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg mb-2 transition-all ${
                    selectedChannelId === channel.id
                      ? 'bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border border-orange-500/50'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                    {channel.logo ? (
                      <img src={channel.logo} alt={channel.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-white text-sm font-bold">
                        {channel.name.substring(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className="text-white font-medium text-left">{channel.name}</span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Program List - Right Side */}
        <div className="flex-1 overflow-y-auto p-4">
          {selectedChannel ? (
            <div>
              <h3 className="text-white text-xl font-semibold mb-4">
                {selectedChannel.name} - {formatDate(selectedDate)}
              </h3>
              
              {selectedChannel.programs.length === 0 ? (
                <div className="text-white/50 text-center py-8">
                  No programs scheduled for this date
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedChannel.programs.map((program) => (
                    <div
                      key={program.id}
                      className={`p-4 rounded-lg border transition-all ${
                        program.isLive
                          ? 'bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border-orange-500/50'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-white font-semibold text-lg">{program.title}</h4>
                        {program.isLive && (
                          <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded">
                            LIVE
                          </span>
                        )}
                      </div>
                      <div className="text-orange-400 text-sm mb-2">
                        {program.startTime} - {program.endTime}
                      </div>
                      {program.description && (
                        <p className="text-white/70 text-sm">{program.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-white/50 text-center py-8">
              Select a channel to view programs
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Sample data for demonstration
const sampleChannels: Channel[] = [
  {
    id: 1,
    name: 'HBO',
    programs: [
      {
        id: 101,
        title: 'Morning News',
        startTime: '6:00 AM',
        endTime: '8:00 AM',
        description: 'Start your day with the latest news and updates'
      },
      {
        id: 102,
        title: 'The Breakfast Show',
        startTime: '8:00 AM',
        endTime: '10:00 AM',
        description: 'Entertainment and lifestyle morning show'
      },
      {
        id: 103,
        title: 'Game of Thrones Marathon',
        startTime: '10:00 AM',
        endTime: '2:00 PM',
        description: 'Epic fantasy drama series - Season 1 episodes'
      },
      {
        id: 104,
        title: 'Afternoon Movie: Inception',
        startTime: '2:00 PM',
        endTime: '4:30 PM',
        description: 'Mind-bending thriller by Christopher Nolan'
      },
      {
        id: 105,
        title: 'The Last of Us',
        startTime: '4:30 PM',
        endTime: '5:30 PM',
        description: 'Post-apocalyptic drama based on the video game'
      },
      {
        id: 106,
        title: 'Evening News',
        startTime: '5:30 PM',
        endTime: '6:30 PM',
        description: 'Your daily dose of world news'
      },
      {
        id: 107,
        title: 'House of the Dragon',
        startTime: '6:30 PM',
        endTime: '7:30 PM',
        description: 'Prequel to Game of Thrones',
        isLive: true
      },
      {
        id: 108,
        title: 'True Detective',
        startTime: '7:30 PM',
        endTime: '8:30 PM',
        description: 'Crime anthology series'
      },
      {
        id: 109,
        title: 'Succession',
        startTime: '8:30 PM',
        endTime: '9:30 PM',
        description: 'Drama about a media dynasty'
      },
      {
        id: 110,
        title: 'Late Night Talk Show',
        startTime: '9:30 PM',
        endTime: '11:00 PM',
        description: 'Comedy and celebrity interviews'
      }
    ]
  },
  {
    id: 2,
    name: 'ESPN',
    programs: [
      {
        id: 201,
        title: 'SportsCenter AM',
        startTime: '6:00 AM',
        endTime: '9:00 AM',
        description: 'Morning sports highlights and analysis'
      },
      {
        id: 202,
        title: 'First Take',
        startTime: '9:00 AM',
        endTime: '11:00 AM',
        description: 'Hot sports debate show'
      },
      {
        id: 203,
        title: 'NFL Live',
        startTime: '11:00 AM',
        endTime: '12:00 PM',
        description: 'Latest NFL news and updates'
      },
      {
        id: 204,
        title: 'NBA Today',
        startTime: '12:00 PM',
        endTime: '1:00 PM',
        description: 'Basketball news and highlights'
      },
      {
        id: 205,
        title: 'College Football',
        startTime: '1:00 PM',
        endTime: '4:00 PM',
        description: 'Alabama vs Georgia - SEC Championship'
      },
      {
        id: 206,
        title: 'Around the Horn',
        startTime: '4:00 PM',
        endTime: '4:30 PM',
        description: 'Panel discussion on sports topics'
      },
      {
        id: 207,
        title: 'Pardon the Interruption',
        startTime: '4:30 PM',
        endTime: '5:00 PM',
        description: 'Sports debate with Tony and Mike'
      },
      {
        id: 208,
        title: 'NBA Live: Lakers vs Warriors',
        startTime: '5:00 PM',
        endTime: '7:30 PM',
        description: 'Western Conference showdown',
        isLive: true
      },
      {
        id: 209,
        title: 'SportsCenter',
        startTime: '7:30 PM',
        endTime: '8:30 PM',
        description: 'Daily sports news and highlights'
      },
      {
        id: 210,
        title: 'Monday Night Countdown',
        startTime: '8:30 PM',
        endTime: '11:00 PM',
        description: 'Pre-game show for Monday Night Football'
      }
    ]
  },
  {
    id: 3,
    name: 'CNN',
    programs: [
      {
        id: 301,
        title: 'Early Start',
        startTime: '5:00 AM',
        endTime: '6:00 AM',
        description: 'News before the day begins'
      },
      {
        id: 302,
        title: 'New Day',
        startTime: '6:00 AM',
        endTime: '9:00 AM',
        description: 'Morning news program'
      },
      {
        id: 303,
        title: 'CNN News Central',
        startTime: '9:00 AM',
        endTime: '12:00 PM',
        description: 'Midday news coverage'
      },
      {
        id: 304,
        title: 'Inside Politics',
        startTime: '12:00 PM',
        endTime: '1:00 PM',
        description: 'Political analysis and discussion'
      },
      {
        id: 305,
        title: 'CNN Newsroom',
        startTime: '1:00 PM',
        endTime: '4:00 PM',
        description: 'Afternoon news updates'
      },
      {
        id: 306,
        title: 'The Lead with Jake Tapper',
        startTime: '4:00 PM',
        endTime: '5:00 PM',
        description: 'In-depth news analysis'
      },
      {
        id: 307,
        title: 'The Situation Room',
        startTime: '5:00 PM',
        endTime: '7:00 PM',
        description: 'Breaking news with Wolf Blitzer',
        isLive: true
      },
      {
        id: 308,
        title: 'Erin Burnett OutFront',
        startTime: '7:00 PM',
        endTime: '8:00 PM',
        description: 'Evening news program'
      },
      {
        id: 309,
        title: 'Anderson Cooper 360',
        startTime: '8:00 PM',
        endTime: '9:00 PM',
        description: 'In-depth news analysis'
      },
      {
        id: 310,
        title: 'CNN Tonight',
        startTime: '9:00 PM',
        endTime: '11:00 PM',
        description: 'Late evening news coverage'
      }
    ]
  },
  {
    id: 4,
    name: 'Discovery',
    programs: [
      {
        id: 401,
        title: 'How It\'s Made',
        startTime: '6:00 AM',
        endTime: '7:00 AM',
        description: 'Behind the scenes of everyday products'
      },
      {
        id: 402,
        title: 'Mythbusters',
        startTime: '7:00 AM',
        endTime: '9:00 AM',
        description: 'Science entertainment program'
      },
      {
        id: 403,
        title: 'Deadliest Catch',
        startTime: '9:00 AM',
        endTime: '11:00 AM',
        description: 'Life of Alaskan crab fishermen'
      },
      {
        id: 404,
        title: 'Gold Rush',
        startTime: '11:00 AM',
        endTime: '1:00 PM',
        description: 'Modern-day gold mining adventures'
      },
      {
        id: 405,
        title: 'Planet Earth III',
        startTime: '1:00 PM',
        endTime: '2:00 PM',
        description: 'Nature documentary narrated by David Attenborough'
      },
      {
        id: 406,
        title: 'Blue Planet',
        startTime: '2:00 PM',
        endTime: '3:00 PM',
        description: 'Exploring ocean life'
      },
      {
        id: 407,
        title: 'Shark Week Special',
        startTime: '3:00 PM',
        endTime: '5:00 PM',
        description: 'All about sharks',
        isLive: true
      },
      {
        id: 408,
        title: 'Street Outlaws',
        startTime: '5:00 PM',
        endTime: '7:00 PM',
        description: 'Underground street racing'
      },
      {
        id: 409,
        title: 'Naked and Afraid',
        startTime: '7:00 PM',
        endTime: '9:00 PM',
        description: 'Survival challenge series'
      },
      {
        id: 410,
        title: 'Ancient Aliens',
        startTime: '9:00 PM',
        endTime: '11:00 PM',
        description: 'Investigating alien theories'
      }
    ]
  },
  {
    id: 5,
    name: 'National Geographic',
    programs: [
      {
        id: 501,
        title: 'Brain Games',
        startTime: '6:00 AM',
        endTime: '7:00 AM',
        description: 'Interactive experiments about the brain'
      },
      {
        id: 502,
        title: 'Cosmos: Possible Worlds',
        startTime: '7:00 AM',
        endTime: '8:00 AM',
        description: 'Neil deGrasse Tyson explores the universe'
      },
      {
        id: 503,
        title: 'Wicked Tuna',
        startTime: '8:00 AM',
        endTime: '10:00 AM',
        description: 'Bluefin tuna fishing in New England'
      },
      {
        id: 504,
        title: 'Life Below Zero',
        startTime: '10:00 AM',
        endTime: '12:00 PM',
        description: 'Survival in Alaska'
      },
      {
        id: 505,
        title: 'Gordon Ramsay: Uncharted',
        startTime: '12:00 PM',
        endTime: '1:00 PM',
        description: 'Chef explores global cuisine'
      },
      {
        id: 506,
        title: 'Drain the Oceans',
        startTime: '1:00 PM',
        endTime: '2:00 PM',
        description: 'Revealing underwater mysteries',
        isLive: true
      },
      {
        id: 507,
        title: 'Running Wild with Bear Grylls',
        startTime: '2:00 PM',
        endTime: '3:00 PM',
        description: 'Celebrities in the wild'
      },
      {
        id: 508,
        title: 'Explorer',
        startTime: '3:00 PM',
        endTime: '5:00 PM',
        description: 'Documentary series on various topics'
      },
      {
        id: 509,
        title: 'The World According to Jeff Goldblum',
        startTime: '5:00 PM',
        endTime: '6:00 PM',
        description: 'Jeff explores everyday marvels'
      },
      {
        id: 510,
        title: 'Genius',
        startTime: '6:00 PM',
        endTime: '8:00 PM',
        description: 'Anthology about brilliant minds'
      }
    ]
  },
  {
    id: 6,
    name: 'Comedy Central',
    programs: [
      {
        id: 601,
        title: 'South Park Reruns',
        startTime: '6:00 AM',
        endTime: '10:00 AM',
        description: 'Classic episodes'
      },
      {
        id: 602,
        title: 'The Office',
        startTime: '10:00 AM',
        endTime: '2:00 PM',
        description: 'Workplace comedy marathon'
      },
      {
        id: 603,
        title: 'Parks and Recreation',
        startTime: '2:00 PM',
        endTime: '4:00 PM',
        description: 'Leslie Knope and the Pawnee gang'
      },
      {
        id: 604,
        title: 'The Daily Show',
        startTime: '4:00 PM',
        endTime: '5:00 PM',
        description: 'Satirical news program',
        isLive: true
      },
      {
        id: 605,
        title: 'Stand-Up Comedy Special',
        startTime: '5:00 PM',
        endTime: '6:30 PM',
        description: 'Top comedians perform'
      },
      {
        id: 606,
        title: 'Workaholics',
        startTime: '6:30 PM',
        endTime: '8:00 PM',
        description: 'Three friends and their shenanigans'
      },
      {
        id: 607,
        title: 'Chappelle\'s Show',
        startTime: '8:00 PM',
        endTime: '9:00 PM',
        description: 'Classic sketch comedy'
      },
      {
        id: 608,
        title: 'South Park',
        startTime: '9:00 PM',
        endTime: '11:00 PM',
        description: 'New episodes'
      }
    ]
  },
  {
    id: 7,
    name: 'Food Network',
    programs: [
      {
        id: 701,
        title: 'Pioneer Woman',
        startTime: '6:00 AM',
        endTime: '8:00 AM',
        description: 'Ree Drummond cooks on her ranch'
      },
      {
        id: 702,
        title: 'The Kitchen',
        startTime: '8:00 AM',
        endTime: '10:00 AM',
        description: 'Weekend cooking show'
      },
      {
        id: 703,
        title: 'Diners, Drive-Ins and Dives',
        startTime: '10:00 AM',
        endTime: '12:00 PM',
        description: 'Guy Fieri explores American eateries'
      },
      {
        id: 704,
        title: 'Chopped',
        startTime: '12:00 PM',
        endTime: '2:00 PM',
        description: 'Cooking competition with mystery baskets'
      },
      {
        id: 705,
        title: 'Beat Bobby Flay',
        startTime: '2:00 PM',
        endTime: '4:00 PM',
        description: 'Chefs compete to beat Bobby',
        isLive: true
      },
      {
        id: 706,
        title: 'Iron Chef America',
        startTime: '4:00 PM',
        endTime: '6:00 PM',
        description: 'Ultimate cooking showdown'
      },
      {
        id: 707,
        title: 'Guy\'s Grocery Games',
        startTime: '6:00 PM',
        endTime: '8:00 PM',
        description: 'Cooking challenges in a supermarket'
      },
      {
        id: 708,
        title: 'Cake Wars',
        startTime: '8:00 PM',
        endTime: '10:00 PM',
        description: 'Bakers compete for the best cake'
      }
    ]
  },
  {
    id: 8,
    name: 'MTV',
    programs: [
      {
        id: 801,
        title: 'Ridiculousness',
        startTime: '6:00 AM',
        endTime: '10:00 AM',
        description: 'Viral video commentary'
      },
      {
        id: 802,
        title: 'Teen Mom',
        startTime: '10:00 AM',
        endTime: '12:00 PM',
        description: 'Reality show about young mothers'
      },
      {
        id: 803,
        title: 'Catfish',
        startTime: '12:00 PM',
        endTime: '2:00 PM',
        description: 'Investigating online relationships'
      },
      {
        id: 804,
        title: 'The Challenge',
        startTime: '2:00 PM',
        endTime: '4:00 PM',
        description: 'Competition reality show',
        isLive: true
      },
      {
        id: 805,
        title: 'Jersey Shore: Family Vacation',
        startTime: '4:00 PM',
        endTime: '6:00 PM',
        description: 'The gang is back together'
      },
      {
        id: 806,
        title: 'Wild \'N Out',
        startTime: '6:00 PM',
        endTime: '8:00 PM',
        description: 'Improv comedy show'
      },
      {
        id: 807,
        title: 'MTV Movie Awards',
        startTime: '8:00 PM',
        endTime: '11:00 PM',
        description: 'Annual awards show'
      }
    ]
  }
];

export default ChannelsPanelDemo;

// Sample data export for testing
export { sampleChannels };
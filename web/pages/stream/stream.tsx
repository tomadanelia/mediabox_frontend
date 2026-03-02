'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '@/config';
import VideoPlayer from '@/hmcomponents/videoplayer';
import DataTableDemo from '@/components/shadcn-studio/data-table/data-table-11';
import Timeline from '@/hmcomponents/timeline';
import DataTableDemoCL from '@/components/shadcn-studio/data-table/data-table-c1';
import IconButtonDemo from '@/components/shadcn-studio/button/button-31';
import ButtonCopyDemo from '@/components/shadcn-studio/button/custom/button-02';
import IconButtonCalendar from '@/components/shadcn-studio/button/custom/button-01';
import ButtonMenuDemo from '@/components/shadcn-studio/button/custom/button-31';
import ButtonGroupSocialDemo from '@/components/shadcn-studio/button-group/button-group-05';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import ChannelCalendar from '@/hmcomponents/calendar';
import MobileCalendar from '@/hmcomponents/mobilecalendar';
import { ChevronLeft,ChevronRight } from 'lucide-react';
import InputSearchIconDemo from '@/components/shadcn-studio/cadditions/inp1';
import {
  Clapperboard, ChessRook, Gamepad2, Newspaper,
  Music, Camera, Code,
} from 'lucide-react';
import { GeorgiaLogo } from '@/components/svg_telecom_production/svglib';
import { CategoryIcon } from '@/hmcomponents/IconMapper';
import PlansModal from '@/hmcomponents/planspopup';
import api from '@/lib/axios';
import { useIsMobile } from '@/hooks/useIsMobile';


// ─── Types ────────────────────────────────────────────────────────────────────

export type Channel = {
  id: string;
  uuid: string;
  name: string;
  logo: string;
  number: number;
  category: string;
  category_id: string;
  is_free?: boolean;  // optional
};

type Plan = {
  id: string
  name_ka: string
  name_en: string
  description_ka: string
  description_en: string
  price: string
  duration_days: number
  is_active: boolean
  created_at: string
  updated_at: string
}
type ChannelWithPlans = Channel & {
  is_free: boolean
  plans: Plan[]
}
export type ProgramItem = {
  UID: number;
  CHANNEL_ID: number;
  START_TIME: number;
  END_TIME: number;
  TITLE: string;
  GANRE: string;
  DESCRIPTION: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toApiDate(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}/${m}/${d}`;
}

function addOneDay(dateStr: string): string {
  // dateStr is "YYYY/MM/DD"
  const d = new Date(dateStr.replace(/\//g, '-'));
  d.setDate(d.getDate() + 1);
  return toApiDate(d);
}

// ─── Component ────────────────────────────────────────────────────────────────

export const Stream: React.FC = () => {
  const [LeftList, setLeftList] = useState(false);
  const [RightList, setRightList] = useState(false);
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [selectedCategory, setselectedCategory] = useState<string>("");

  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);

  const [streamUrl, setStreamUrl] = useState<string>('');
  const [mode, setMode] = useState<'live' | 'archive'>('live');
  const [archiveTimestamp, setArchiveTimestamp] = useState<number | null>(null);
  const [isStreamLoading, setIsStreamLoading] = useState(false);

  const [programs, setPrograms] = useState<ProgramItem[]>([]);
  const [nextDayPrograms, setNextDayPrograms] = useState<ProgramItem[]>([]);
  const [programDate, setProgramDate] = useState(toApiDate());

  const [rewindableHours, setRewindableHours] = useState<number>(168);
  const rewindableDays = Math.ceil(rewindableHours / 24);

  const [liveUnixSec, setLiveUnixSec] = useState(Math.floor(Date.now() / 1000));
  const [pendingChannel, setPendingChannel] = useState<ChannelWithPlans | null>(null);
const isMobile = useIsMobile();
const [leftExpanded, setLeftExpanded] = useState(false);
const [rightExpanded, setRightExpanded] = useState(false);
  type Category = {
    id: string
    name_ka: string
    name_en: string
    description_en: string | null
    description_ka: string | null
    icon_url: string | null
    created_at: string
    updated_at: string
  }

  const handleChannelSelect = async (channel: Channel) => {
    try {
      const res = await api.get(`/api/channels/${channel.id}/plans`);
      const data = res.data;

      if (data.is_free) {
        setSelectedChannel(channel);
        return;
      }

      if (data.required_plans && data.required_plans.length > 0) {
        setPendingChannel({ ...channel, is_free: data.is_free, plans: data.required_plans } as ChannelWithPlans);
      }
    } catch (err) {
      console.error('Failed to fetch channel plans:', err);
    }
  };

  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    api.get('/api/channels/categories')
      .then(res => setCategories(res.data))
      .catch(err => console.error('Failed to fetch categories:', err));
  }, []);

  useEffect(() => {
    const id = setInterval(() => setLiveUnixSec(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  // ─── API ─────────────────────────────────────────────────────────────────────

  const goLive = useCallback(async (channelId: string) => {
    setIsStreamLoading(true);
    try {
      const res = await api.get(`/api/channels/${channelId}/stream`);
      setStreamUrl(res.data.url);
      setMode('live');
      setArchiveTimestamp(null);
    } catch (e) {
      console.error('[goLive]', e);
    } finally {
      setIsStreamLoading(false);
    }
  }, []);

  const goArchive = useCallback(async (channelId: string, timestamp: number) => {
    const oldestValid = Math.floor(Date.now() / 1000) - rewindableHours * 3600 + 60;
    const safeTs = Math.max(timestamp, oldestValid);

    setIsStreamLoading(true);
    try {
      const res = await api.get(`/api/channels/${channelId}/archive`, {
        params: { timestamp: safeTs },
      });
      const data = res.data;
      setStreamUrl(data.url);
      setMode('archive');
      setArchiveTimestamp(safeTs);
      const hours = parseInt(data.hoursBack, 10);
      if (!isNaN(hours)) setRewindableHours(hours);
    } catch (e) {
      console.error('[goArchive]', e);
    } finally {
      setIsStreamLoading(false);
    }
  }, [rewindableHours]);

  // Fetches today's programs and also the next day's for timeline range
  const fetchPrograms = useCallback(async (channelId: string, date: string) => {
    try {
      const res = await api.get(`/api/channels/${channelId}/programs`, {
        params: { date },
      });
      setPrograms(res.data);
    } catch (e) {
      console.error('[fetchPrograms]', e);
    }
    try {
      const nextDate = addOneDay(date);
      const res = await api.get(`/api/channels/${channelId}/programs`, {
        params: { date: nextDate },
      });
      setNextDayPrograms(res.data);
    } catch (e) {
      console.error('[fetchNextDayPrograms]', e);
      setNextDayPrograms([]);
    }
  }, []);

  // ─── Effects ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/api/channels');
        const data = res.data;
        const channelList: Channel[] = data.channels ?? (Array.isArray(data) ? data : []);
        setChannels(channelList);
        const firstFree = channelList.find((ch: any) => ch.is_free) ?? channelList[0];
        if (firstFree) setSelectedChannel(firstFree);
      } catch (e) {
        console.error('[fetchChannels]', e);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedChannel) return;
    const today = toApiDate();
    goLive(selectedChannel.id);
    fetchPrograms(selectedChannel.id, today);
    setProgramDate(today);
  }, [selectedChannel?.id]);

  useEffect(() => {
    if (!selectedChannel) return;
    fetchPrograms(selectedChannel.id, programDate);
  }, [programDate]);

  // ─── Callbacks ───────────────────────────────────────────────────────────────

const handleRewind = useCallback((timestamp: number) => {
  if (!selectedChannel) return;
  goArchive(selectedChannel.id, timestamp);
}, [selectedChannel, goArchive]);

  const handleGoLive = useCallback(() => {
    if (!selectedChannel) return;
    goLive(selectedChannel.id);
    const today = toApiDate();
    fetchPrograms(selectedChannel.id, today);
    setProgramDate(today);
  }, [selectedChannel, goLive, fetchPrograms]);

  const handleProgramSelect = useCallback((startTime: number) => {
    if (!selectedChannel) return;
    goArchive(selectedChannel.id, startTime);
  }, [selectedChannel, goArchive]);

  const handleCalendarToggle = async () => {
    if (selectedChannel) {
      const probeTs = Math.floor(Date.now() / 1000) - 10;
      try {
        const res = await api.get(`/api/channels/${selectedChannel.id}/archive`, {
          params: { timestamp: probeTs },
        });
        const hours = parseInt(res.data.hoursBack, 10);
        if (!isNaN(hours)) setRewindableHours(hours);
      } catch (e) {
        console.error('[calendarProbe]', e);
      }
    }
    setIsCalendarVisible(v => !v);
  };

  const handleCalendarDateSelect = (date: Date) => {
    if (!selectedChannel) return;
    const midnight = new Date(date);
    midnight.setHours(0, 0, 0, 0);
    goArchive(selectedChannel.id, Math.floor(midnight.getTime() / 1000));
    const dateStr = toApiDate(date);
    fetchPrograms(selectedChannel.id, dateStr);
    setProgramDate(dateStr);
    setIsCalendarVisible(false);
  };

  // ─── Categories ───────────────────────────────────────────────────────────────
  const filteredChannels = selectedCategory != ""
    ? channels.filter(ch => selectedCategory == ch.category)
    : channels;

  const toggleCategory = (id: string) => selectedCategory == id
    ? setselectedCategory("")
    : setselectedCategory(id);

  // Convert programDate string back to Date for the calendar initialDate
  const programDateAsDate = new Date(programDate.replace(/\//g, '-'));

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col justify-between w-full h-[calc(100vh-80px)] relative">
      {pendingChannel && (
        <div className='absolute w-full h-full bg-black/50 z-30'>
          <PlansModal
            channel={pendingChannel}
            lang="en"
            onClose={() => setPendingChannel(null)}
            onSelectPlan={(plan, ch) => { /* handle subscription */ }}
          />
        </div>
      )}
      <div className="flex-1 flex w-full">
        <div className='w-[65px] flex lg:hidden' />

        {/* LEFT */}
    {/* LEFT */}
<div className={`
  lg:relative lg:w-1/5
  absolute z-20 flex flex-col h-[calc(100vh-146px)] overflow bg-yel
  transition-all duration-300 ease-in-out
  ${isMobile ? (leftExpanded ? 'w-2/5' : 'w-[65px]') : ''}
`}>

  {isMobile && (
    <button
      onClick={() => setLeftExpanded(v => !v)}
      className="absolute -right-3 top-1/2 -translate-y-1/2 z-30
        w-6 h-10 flex items-center justify-center
        bg-white dark:bg-zinc-800
        border border-black/10 dark:border-white/10
        rounded-r-lg shadow-md
        text-black/40 dark:text-white/40
        hover:text-orange-400 transition-colors"
    >
      {leftExpanded ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
    </button>
  )}

  <div className="flex-1 relative overflow-y-auto bg-gray">
    <DataTableDemo
      filteredChannels={filteredChannels}
      onChannelSelect={handleChannelSelect}
      selectedChannel={selectedChannel}
      iconOnly={isMobile && !leftExpanded}
    />
  </div>
</div>

        {/* CENTER */}
        <div className="w-[calc(100vw-130px)] lg:w-3/5 relative h-full flex flex-col justify- ">
          <div className='flex flex-col'>
            <VideoPlayer
              programs={programs}
              nextDayPrograms={nextDayPrograms}
              streamUrl={streamUrl}
              mode={mode}
              archiveTimestamp={archiveTimestamp}
              isLoading={isStreamLoading}
              onRewind={handleRewind}
              onGoLive={handleGoLive}
              onChannelSelect={handleChannelSelect}
              currentChannelId={selectedChannel?.id}
              rewindableDays={rewindableDays}
            />
          </div>
          {isCalendarVisible && (
          <div className="lg:hidden z-20  w-full h-full absolute flex top-0">
            <MobileCalendar
              archiveDays={rewindableDays}
              initialDate={programDateAsDate}
              onSelect={handleCalendarDateSelect}
            />
          </div>
          )}
          {/* <div className=''>
            <div className='h-10 flex items-center justify-between px-4'>
              <div className='flex items-center z-2 gap-2' />
              <div className='h-[40px] mt-20 absolute w-full scale-105 flex z-1 items-center justify-center gap-2'>
                <ButtonGroupSocialDemo />
                <ButtonCopyDemo />
              </div>
              <div className='flex items-center h-full gap-2 z-2' />
            </div>
          </div> */}
          <div className='w-full h-full flex justify-center items-center'>
            <div className="shrink-0 w-full flex items-center gap-3 px-1 py-2 overflow-x-auto justify-center mt-">

              <div className="flex items-center shrink-0">
                <IconButtonDemo />
              </div>

              <div className="flex gap-2">
                {categories.map((category) => {
                  const isSelected = selectedCategory == category.name_en
                  return (
                    <div
                      key={category.id}
                      onClick={() => toggleCategory(category.name_en)}
                      className={`
                        relative flex items-center gap-1.5 h-10 px-3 rounded-lg cursor-pointer
                        text-xs font-medium transition-all duration-150
                        ${isSelected
                          ? 'bg-gradient-to-br from-orange-500 to-yellow-400 text-white shadow-sm shadow-orange-300/30'
                          : 'bg-white/70 dark:bg-white/5 border-black/8 dark:border-white/10 backdrop-blur-md text-black/50 dark:text-white/40 hover:text-black/70 dark:hover:text-white/60 hover:bg-white dark:hover:bg-white/10'
                        }
                      `}
                    >
                      {category.icon_url && (
                        <div className="w-5 h-5 flex items-center justify-center flex-none transition-transform duration-150 text-gray-900 dark:text-blue-200">
                          <div className={isSelected ? "scale-125" : "scale-100"}><CategoryIcon name={category.icon_url} /></div>
                        </div>
                      )}

                      <span className="whitespace-nowrap text-gray-800 dark:text-white ml-2">{category.name_ka}</span>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="absolute inset-0" />
                        </TooltipTrigger>
                        <TooltipContent side="bottom">{category.name_en}</TooltipContent>
                      </Tooltip>
                    </div>
                  )
                })}
              </div>

            </div>
          </div>
        </div>

        {/* RIGHT */}
<div className={`
  lg:relative lg:w-1/5
  absolute right-0 z-10 flex flex-col h-full bg-yel
  transition-all duration-300 ease-in-out
  ${isMobile ? (rightExpanded ? 'w-4/5' : 'w-[65px]') : ''}
`}>

  {/* Toggle tab — mobile only */}
  {isMobile && (
    <button
      onClick={() => setRightExpanded(v => !v)}
      className="absolute -left-3 top-1/2 -translate-y-1/2 z-30
        w-6 h-10 flex items-center justify-center
        bg-white dark:bg-zinc-800
        border border-black/10 dark:border-white/10
        rounded-l-lg shadow-md
        text-black/40 dark:text-white/40
        hover:text-orange-400 transition-colors"
    >
      {rightExpanded ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
    </button>
  )}

  {/* Header — only when expanded or desktop */}
  {(!isMobile || rightExpanded) && (
    <div className="h-13 flex items-center pb-2">
      <div className="px-3 w-full h-full bg-white/70 dark:bg-white/5 border border-black/8 dark:border-white/10 backdrop-blur-md rounded-xl flex items-center justify-between transition-all duration-200">
        <div className='flex items-center gap-2.5'>
          <div className='w-8 h-8 rounded-lg bg-white dark:bg-white/10 shadow-sm flex items-center justify-center shrink-0 overflow-hidden'>
            {selectedChannel && (
              <img src={selectedChannel.logo} className='w-10/12 h-10/12 object-contain rounded-[3px]' alt="" />
            )}
          </div>
          <span className='text-sm font-medium text-black/80 dark:text-white/75 truncate'>
            {selectedChannel?.name}
          </span>
        </div>
        <div
          className='w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer text-black/40 dark:text-white/35 hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-400/10 transition-all duration-150'
          onClick={handleCalendarToggle}
        >
          <IconButtonCalendar />
        </div>
      </div>
    </div>
  )}

  {/* Calendar button only — collapsed mobile */}
  {isMobile && !rightExpanded && (
    <div className="flex justify-center py-2">
      <div
        className='w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer text-black/40 dark:text-white/35 hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-400/10 transition-all duration-150'
        onClick={handleCalendarToggle}
      >
        <IconButtonCalendar />
      </div>
    </div>
  )}

  <div className="flex-1 overflow-y-auto relative">
    <DataTableDemoCL
      timeProgramm={programs}
      mode={mode}
      archiveTimestamp={archiveTimestamp}
      onProgramSelect={handleProgramSelect}
      iconOnly={isMobile && !rightExpanded}
    />
    {isCalendarVisible && (!isMobile || rightExpanded) && (
      <div className='absolute top-0 right-0 w-full ml-4 mt-0'>
        <div className="hidden lg:block">
          <ChannelCalendar
            archiveDays={rewindableDays}
            channelName={selectedChannel?.name || 'Channel'}
            onSelect={handleCalendarDateSelect}
            initialDate={programDateAsDate}
          />
        </div>
        <div className="block lg:hidden">
          <MobileCalendar
            archiveDays={rewindableDays}
            initialDate={programDateAsDate}
            onSelect={handleCalendarDateSelect}
          />
        </div>
      </div>
    )}
  </div>
</div>
  
      </div>

      {/* BOTTOM */}
      <div>
        <div className='flex-1 h-10'>
          <Timeline
            timeProgramm={programs}
            nextDayPrograms={nextDayPrograms}
            liveUnixSec={liveUnixSec}
            currentUnixSec={archiveTimestamp}
            onSelectTime={handleRewind}
          />
        </div>
      </div>
    </div>
  );
};

export default Stream;
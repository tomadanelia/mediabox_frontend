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
import InputSearchIconDemo from '@/components/shadcn-studio/cadditions/inp1';
import {
  Clapperboard, ChessRook, Gamepad2, Newspaper,
  Music, Camera, Code,
} from 'lucide-react';
import { GeorgiaLogo } from '@/components/svg_telecom_production/svglib';

// ─── Types ────────────────────────────────────────────────────────────────────

export type Channel = {
  id: string;
  uuid: string;
  name: string;
  logo: string;
  number: number;
  category: string;
  category_id: string;
};

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
const API_BASE = `${API_BASE_URL}/api`;

function toApiDate(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}/${m}/${d}`;
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
  const [programDate, setProgramDate] = useState(toApiDate());

  const [rewindableHours, setRewindableHours] = useState<number>(168);
  const rewindableDays = Math.ceil(rewindableHours / 24);

  const [liveUnixSec, setLiveUnixSec] = useState(Math.floor(Date.now() / 1000));
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
console.log(selectedCategory,"selected");

const [categories, setCategories] = useState<Category[]>([]);

useEffect(() => {
  fetch('http://159.89.20.100/api/channels/categories')
    .then(res => res.json())
    .then(data => setCategories(data))
    .catch(err => console.error('Failed to fetch categories:', err))
}, [])


  useEffect(() => {
    const id = setInterval(() => setLiveUnixSec(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  // ─── API ─────────────────────────────────────────────────────────────────────

  const goLive = useCallback(async (channelId: string) => {
    setIsStreamLoading(true);
    try {
      const res = await fetch(`${API_BASE}/channels/${channelId}/stream`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setStreamUrl(data.url);
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
      const res = await fetch(`${API_BASE}/channels/${channelId}/archive?timestamp=${safeTs}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
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

  const fetchPrograms = useCallback(async (channelId: string, date: string) => {
    try {
      const res = await fetch(`${API_BASE}/channels/${channelId}/programs?date=${date}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setPrograms(await res.json());
    } catch (e) {
      console.error('[fetchPrograms]', e);
    }
  }, []);

  // ─── Effects ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/channels`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: Channel[] = await res.json();
        setChannels(data);
        if (data.length > 0) setSelectedChannel(data[0]);
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
    const dateStr = toApiDate(new Date(timestamp * 1000));
    fetchPrograms(selectedChannel.id, dateStr);
    setProgramDate(dateStr);
  }, [selectedChannel, goArchive, fetchPrograms]);

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
        const res = await fetch(`${API_BASE}/channels/${selectedChannel.id}/archive?timestamp=${probeTs}`);
        if (res.ok) {
          const data = await res.json();
          const hours = parseInt(data.hoursBack, 10);
          if (!isNaN(hours)) setRewindableHours(hours);
        }
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
    : setselectedCategory(id)
    

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col justify-between w-full h-[calc(100vh-80px)] relative">

      <div className="flex-1 flex w-full">
        <div className='w-[65px] flex lg:hidden' />

        {/* LEFT */}
        <div className={`absolute z-10 lg:relative flex flex-col h-full overflow-hidden bg-yel
          ${!LeftList ? 'w-1/5' : 'w-[65px] lg:w-1/5'}`}>

          <div className="flex-1 relative overflow-y-auto bg-gray">
            <DataTableDemo
              filteredChannels={filteredChannels}
              onChannelSelect={setSelectedChannel}
              selectedChannel={selectedChannel}
            />
          </div>
        </div>

        {/* CENTER */}
        <div className="w-[calc(100vw-130px)] lg:w-3/5 relative h-full flex flex-col">
          <div className='flex flex-col'>
            <VideoPlayer
              streamUrl={streamUrl}
              mode={mode}
              archiveTimestamp={archiveTimestamp}
              isLoading={isStreamLoading}
              onRewind={handleRewind}
              onGoLive={handleGoLive}
              onChannelSelect={setSelectedChannel}
              currentChannelId={selectedChannel?.id}
              rewindableDays={rewindableDays}
            />
          </div>
          <div className=''>
            <div className='h-10 flex items-center justify-between px-4'>
              <div className='flex items-center z-2 gap-2' />
              <div className='h-[40px] absolute w-full flex z-1 items-center justify-center gap-2'>
                <ButtonGroupSocialDemo />
                <ButtonCopyDemo />
              </div>
              <div className='flex items-center h-full gap-2 z-2' />
            </div>
          </div>
          <div className=''><div className='h-10 flex items-center justify-between px-4' /></div>
        </div>

        {/* RIGHT */}
        <div className={`absolute right-0 z-10 lg:relative flex flex-col h-full overflow-hidden bg-yel
          ${!RightList ? 'w-1/5' : 'w-[65px] lg:w-1/5'}`}>
    <div className="h-13 flex items-center pb-2">
          <div className="px-3 w-full h-full bg-white/70 dark:bg-white/5 border border-black/8 dark:border-white/10 backdrop-blur-md rounded-xl flex items-center justify-between transition-all duration-200">

            {/* Channel info */}
            <div className='flex items-center gap-2.5'>
              <div className='w-8 h-8 rounded-lg bg-white dark:bg-white/10 shadow-sm flex items-center justify-center shrink-0 overflow-hidden'>
                {selectedChannel && (
                  <img
                    src={selectedChannel.logo}
                    className='w-10/12 h-10/12 object-contain rounded-[3px]'
                    alt=""
                  />
                )}
              </div>

              <span className='text-sm font-medium text-black/80 dark:text-white/75 truncate'>
                {selectedChannel?.name}
              </span>
            </div>

            {/* Calendar button */}
            <div
              className='w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer text-black/40 dark:text-white/35 hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-400/10 transition-all duration-150'
              onClick={handleCalendarToggle}
            >
              <IconButtonCalendar />
            </div>

          </div>
        </div>
          <div className="flex-1 overflow-y-auto relative">
            <DataTableDemoCL
              timeProgramm={programs}
              mode={mode}
              archiveTimestamp={archiveTimestamp}
              onProgramSelect={handleProgramSelect}
            />
            {isCalendarVisible && (
              <div className='absolute top-0 right-0 p-1 w-full rounded-md ml-4 mt-14'>
                <ChannelCalendar
                  archiveDays={rewindableDays}
                  channelName={selectedChannel?.name || 'Channel'}
                  onSelect={handleCalendarDateSelect}
                />
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
            liveUnixSec={liveUnixSec}
            currentUnixSec={archiveTimestamp}
            onSelectTime={handleRewind}
          />
        </div>
        <div className="shrink-0 w-full flex items-center gap-3 px-1 py-2 overflow-x-auto justify-center">

          <div className="flex items-center shrink-0">
            <IconButtonDemo />
          </div>

          <div className="flex gap-2 ">
            {categories.map((category) => {
              const isSelected = selectedCategory == category.name_en
              return (
                <div
                  key={category.id}
                  onClick={() => toggleCategory(category.name_en)}
                  className={`
                    relative flex items-center gap-1.5 h-10 w-10 px-3 rounded-lg cursor-pointer shrink-0
                    text-xs font-medium transition-all duration-150
                    ${isSelected
                      ? 'bg-gradient-to-br from-orange-500 to-yellow-400 text-white shadow-sm shadow-orange-300/30'
                      : 'bg-white/70 dark:bg-white/5 border border-black/8 dark:border-white/10 backdrop-blur-md text-black/50 dark:text-white/40 hover:text-black/70 dark:hover:text-white/60 hover:bg-white dark:hover:bg-white/10'
                    }
                  `}
                >
                  {category.icon_url && (
                    <img src={category.icon_url} alt="" className="w-3.5 h-3.5 object-contain" />
                  )}
                  

                  <div className='absolute w-full h-full left-0'>
                    <Tooltip>
                      <TooltipTrigger asChild><div className='w-full h-full' /></TooltipTrigger>
                      <TooltipContent side='bottom'>{category.name_en}</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              )
            })}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Stream;
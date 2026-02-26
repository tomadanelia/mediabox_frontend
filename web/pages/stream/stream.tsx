'use client'

import React, { useState, useEffect, useCallback } from 'react';
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

const API_BASE = 'http://159.89.20.100/api';

function toApiDate(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}/${m}/${d}`;
}

/**
 * Rewrites an absolute HLS stream URL like:
 *   http://159.89.20.100/archive-free/tv/…/video.m3u8?token=…
 * to a relative path:
 *   /archive-free/tv/…/video.m3u8?token=…
 *
 * This routes the request through Vite's dev proxy (see vite.config.ts),
 * which strips the duplicate `Access-Control-Allow-Origin: *, *` header
 * that the media server returns, fixing the CORS error.
 *
 * In production, configure your reverse-proxy (nginx / Caddy) to forward
 * /stream-free and /archive-free to http://159.89.20.100 and set the
 * CORS header correctly.
 */
function proxyStreamUrl(absoluteUrl: string): string {
  try {
    const u = new URL(absoluteUrl);
    return u.pathname + u.search; // strip the host, keep path + query tokens
  } catch {
    return absoluteUrl;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export const Stream: React.FC = () => {
  const [LeftList, setLeftList] = useState(false);
  const [RightList, setRightList] = useState(false);
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

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
      setStreamUrl(proxyStreamUrl(data.url));
      setMode('live');
      setArchiveTimestamp(null);
    } catch (e) {
      console.error('[goLive]', e);
    } finally {
      setIsStreamLoading(false);
    }
  }, []);

  const goArchive = useCallback(async (channelId: string, timestamp: number) => {
    // Clamp: never request a timestamp older than what the server supports.
    // Use rewindableHours (default 168h) minus a small safety margin (60s).
    const oldestValid = Math.floor(Date.now() / 1000) - rewindableHours * 3600 + 60;
    const safeTs = Math.max(timestamp, oldestValid);

    setIsStreamLoading(true);
    try {
      const res = await fetch(`${API_BASE}/channels/${channelId}/archive?timestamp=${safeTs}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setStreamUrl(proxyStreamUrl(data.url));
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

  const categories = [
    { id: 'Georgian', icon: null, logo: GeorgiaLogo },
    { id: 'movies', icon: Clapperboard, logo: null },
    { id: 'chess', icon: ChessRook, logo: null },
    { id: 'gaming', icon: Gamepad2, logo: null },
    { id: 'news', icon: Newspaper, logo: null },
    { id: 'music', icon: Music, logo: null },
    { id: 'photography', icon: Camera, logo: null },
    { id: 'coding', icon: Code, logo: null },
  ];

  const filteredChannels = selectedCategories.length > 0
    ? channels.filter(ch => selectedCategories.includes(ch.category))
    : channels;

  const toggleCategory = (id: string) =>
    setSelectedCategories(prev => prev.includes(id) ? [] : [id]);

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col justify-between w-full h-[calc(100vh-80px)] relative">

      <div className="flex-1 flex w-full">
        <div className='w-[65px] flex lg:hidden' />

        {/* LEFT */}
        <div className={`absolute z-10 lg:relative flex flex-col h-full overflow-hidden bg-yel
          ${!LeftList ? 'w-1/5' : 'w-[65px] lg:w-1/5'}`}>
          <div className="h-15 flex items-center py-2">
            <div className='px-1 w-full h-full bg-gray-800 rounded-r-[10px] flex items-center justify-center'>
              <div className="font-bold flex items-center justify-between w-full">
                {!LeftList && (
                  <div className='lg:left-0 absolute'>
                    <InputSearchIconDemo />
                  </div>
                )}
                <div className='absolute flex items-center justify-center right-0 w-11 h-11'>
                  <div className='bg-black rounded-sm w-8 h-8' onClick={() => setLeftList(p => !p)}>
                    <ButtonMenuDemo />
                  </div>
                </div>
              </div>
            </div>
          </div>
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
          <div className="h-15 flex items-center py-2">
            <div className="px-1 w-full h-full bg-gray-800 rounded-l-[10px] flex items-center justify-between">
              <div className='flex items-center justify-center'>
                <div className='h-9 w-9 rounded-[8px]'>
                  <div className="h-full w-full bg-white rounded-[8px] flex items-center justify-center text-white font-bold text-sm">
                    {selectedChannel && (
                      <img src={selectedChannel.logo} className='rounded-[10px] w-11/12 h-11/12' alt="" />
                    )}
                    <div className='absolute flex items-center justify-center left-0 w-11 h-11'>
                      <div className='bg-black rounded-sm w-8 h-8' onClick={() => setRightList(p => !p)}>
                        <ButtonMenuDemo />
                      </div>
                    </div>
                  </div>
                </div>
                <div className='ml-2 flex items-center justify-center text-white font-bold'>
                  {selectedChannel?.name}
                </div>
              </div>
              <div className='iclefts w-10 h-10 flex items-center justify-center cursor-pointer' onClick={handleCalendarToggle}>
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
                    <IconOrLogo className={isSelected ? 'text-white' : 'text-gray-500 dark:text-white'} />
                  )}
                  <div className='absolute w-full h-full'>
                    <Tooltip>
                      <TooltipTrigger asChild><div className='w-full h-full' /></TooltipTrigger>
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
'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import InputSearchIconDemo from '@/components/shadcn-studio/cadditions/inp1';
import {
  Clapperboard, ChessRook, Gamepad2, Newspaper,
  Music, Camera, Code,
} from 'lucide-react';
import { GeorgiaLogo } from '@/components/svg_telecom_production/svglib';
import { CategoryIcon } from '@/hmcomponents/IconMapper';
import PlansModal from '@/hmcomponents/planspopup';
import api from '@/lib/axios';
import { getLiveUrl, getArchiveUrl, probeRewindableHours } from '../../src/services/streamService';
import { getProgramsForTimeline } from '../../src/services/programService'
import { useIsMobile } from '@/hooks/useIsMobile';
import { useNavigate } from 'react-router-dom';
import { useOrientation } from '@/hooks/useOrientation';

// ─── Types ────────────────────────────────────────────────────────────────────

export type Channel = {
  id: string;
  uuid: string;
  name: string;
  logo: string;
  number: number;
  category: string;
  category_id: string;
  is_free?: boolean;
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


function formatTime(unixSec: number): string {
  const d = new Date(unixSec * 1000);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ─── Hook: detect portrait orientation ───────────────────────────────────────

function useIsPortrait(): boolean {
  const [isPortrait, setIsPortrait] = useState(
    () => typeof window !== 'undefined' && window.innerHeight > window.innerWidth
  );
  useEffect(() => {
    const mq = window.matchMedia('(orientation: portrait)');
    const handler = (e: MediaQueryListEvent) => setIsPortrait(e.matches);
    mq.addEventListener('change', handler);
    setIsPortrait(mq.matches);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isPortrait;
}

// ─── Mobile Portrait: Channel Grid ───────────────────────────────────────────

interface ChannelGridProps {
  channels: Channel[];
  selectedChannel: Channel | null;
  onChannelSelect: (ch: Channel) => void;
  favorites: any[];
  markFavorite: (id: number) => void;
  unmarkFavorite: (id: number) => void;
  categories: any[];
  selectedCategory: string;
  onToggleCategory: (name: string) => void;
}

const ChannelGrid: React.FC<ChannelGridProps> = ({
  channels, selectedChannel, onChannelSelect,
  favorites, markFavorite, unmarkFavorite,
  categories, selectedCategory, onToggleCategory,
}) => {
  const [search, setSearch] = useState('');
  const favoriteIds = new Set((Array.isArray(favorites) ? favorites : []).map((f: any) => f.id ?? f.channel_id ?? f));

  const filtered = (Array.isArray(channels) ? channels : []).filter(ch => {
    const matchesCat = selectedCategory === '' || ch.category === selectedCategory;
    const matchesSearch = ch.name.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search channels..."
        className="w-full h-9 px-3 rounded-xl text-sm
          bg-white/70 dark:bg-white/5
          border border-black/10 dark:border-white/10
          text-black/80 dark:text-white/80
          placeholder:text-black/30 dark:placeholder:text-white/30
          outline-none focus:ring-2 focus:ring-orange-400/40"
      />

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => onToggleCategory('')}
          className={`shrink-0 h-7 px-3 rounded-full text-xs font-medium transition-all
            ${selectedCategory === ''
              ? 'bg-gradient-to-br from-orange-500 to-yellow-400 text-white shadow-sm shadow-orange-300/30'
              : 'bg-white/70 dark:bg-white/5 border border-black/10 dark:border-white/10 text-black/50 dark:text-white/40'
            }`}
        >
          ყველა
        </button>
        {(Array.isArray(categories) ? categories : []).map(cat => (
          <button
            key={cat.id}
            onClick={() => onToggleCategory(cat.name_en)}
            className={`shrink-0 h-7 px-3 rounded-full text-xs font-medium transition-all flex items-center gap-1.5
              ${selectedCategory === cat.name_en
                ? 'bg-gradient-to-br from-orange-500 to-yellow-400 text-white shadow-sm shadow-orange-300/30'
                : 'bg-white/70 dark:bg-white/5 border border-black/10 dark:border-white/10 text-black/50 dark:text-white/40'
              }`}
          >
            {cat.icon_url && (
              <span className="w-3.5 h-3.5 flex items-center justify-center">
                <CategoryIcon name={cat.icon_url} />
               
              </span>
            )}
            {cat.name_ka}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-4 gap-2">
        {filtered.map(ch => {
          const isSelected = selectedChannel?.id === ch.id;
          const isFav = favoriteIds.has(Number(ch.id));
          return (
            <div
              key={ch.id}
              onClick={() => onChannelSelect(ch)}
              className={`
                relative flex flex-col items-center justify-center gap-1.5
                p-2 rounded-xl cursor-pointer
                transition-all duration-150 active:scale-95
                ${isSelected
                  ? 'bg-gradient-to-br from-orange-500/20 to-yellow-400/10 border border-orange-400/40 shadow-sm shadow-orange-300/20'
                  : 'bg-white/60 dark:bg-white/5 border border-black/8 dark:border-white/8'
                }
              `}
            >
              {isFav && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-orange-400" />
              )}
              <span className="absolute top-1.5 left-1.5 text-[9px] font-bold text-black/25 dark:text-white/20">
                {ch.number}
              </span>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden
                bg-white dark:bg-white/10 shadow-sm
                ${isSelected ? 'ring-2 ring-orange-400/60' : ''}
              `}>
                <img src={ch.logo} alt={ch.name} className="w-9/12 h-9/12 object-contain" />
              </div>
              <span className={`text-[10px] font-medium text-center leading-tight line-clamp-2
                ${isSelected ? 'text-orange-500 dark:text-orange-400' : 'text-black/60 dark:text-white/50'}
              `}>
                {ch.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Mobile Portrait: Programs List (mirrors ChannelScheduleCL logic) ─────

const timeFormatter = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit', minute: '2-digit', hour12: false,
});
function formatUnix(unixSec: number): string {
  return timeFormatter.format(new Date(unixSec * 1000));
}

interface ProgramsListProps {
  programs: ProgramItem[];
  mode: 'live' | 'archive';
  archiveTimestamp: number | null;
  onProgramSelect: (startTime: number) => void;
  liveUnixSec: number;
}

const ProgramsList: React.FC<ProgramsListProps> = ({
  programs, mode, archiveTimestamp, onProgramSelect, liveUnixSec,
}) => {
  const sorted = useMemo(
    () => [...programs].sort((a, b) => a.START_TIME - b.START_TIME),
    [programs]
  );

  const nowSec = liveUnixSec;
  const activeSec = mode === 'archive' && archiveTimestamp !== null ? archiveTimestamp : nowSec;

  const activeUID = useMemo(() => {
    if (!sorted.length) return null;
    const match = sorted.find(p => activeSec >= p.START_TIME && activeSec < p.END_TIME);
    if (match) return match.UID;
    if (activeSec <= sorted[0].START_TIME) return sorted[0].UID;
    return null;
  }, [sorted, activeSec]);

  if (!sorted.length) {
    return (
      <div className="px-4 py-6 text-sm text-black/35 dark:text-white/30 text-center">
        No programs for this date.
      </div>
    );
  }

  return (
    <div className="divide-y divide-black/5 dark:divide-white/5">
      {sorted.map(p => {
        const isCurrent = p.UID === activeUID;
        const isPast    = nowSec >= p.END_TIME;
        // Matches ChannelScheduleCL: only past/current programs are clickable
        const isClickable = p.START_TIME <= nowSec;
        const isFuture  = !isClickable;

        return (
          <div
            key={p.UID}
            onClick={() => isClickable && onProgramSelect(p.START_TIME)}
            title={isFuture ? 'Not yet available' : undefined}
            className={[
              'flex items-center gap-3 px-4 py-3 border-l-2 transition-all duration-150',
              isClickable ? 'cursor-pointer' : 'cursor-default',
              isCurrent
                ? 'bg-gradient-to-r from-orange-50 to-yellow-50/60 dark:from-orange-500/10 dark:to-yellow-400/5 border-l-orange-400'
                : isPast
                ? 'border-l-transparent opacity-50 active:opacity-80 active:bg-black/3 dark:active:bg-white/4'
                : 'border-l-transparent opacity-40',
            ].join(' ')}
          >
            <span className={[
              'text-sm font-medium w-10 shrink-0 tabular-nums',
              isCurrent ? 'text-orange-400' : 'text-black/30 dark:text-white/25',
            ].join(' ')}>
              {formatUnix(p.START_TIME)}
            </span>

            <span className="flex-1 text-sm truncate text-black/80 dark:text-white/75">
              {p.TITLE}
            </span>

            {isCurrent && (
              <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0 animate-pulse" />
            )}
            {isFuture && (
              <span className="text-xs text-black/25 dark:text-white/20 shrink-0 select-none">🔒</span>
            )}
          </div>
        );
      })}
    </div>
  );
};


type PortraitTab = 'channels' | 'programs';

// ─── Component ────────────────────────────────────────────────────────────────

export const Stream: React.FC = () => {
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [selectedCategory, setselectedCategory] = useState<string>("");

  const [channels, setChannels] = useState<Channel[]>([]);
  const [accessibleIds, setAccessibleIds] = useState<string[]>([]);
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
  const isPortrait = useIsPortrait();
  const isMobilePortrait = isMobile && isPortrait;

  const [leftExpanded, setLeftExpanded] = useState(false);
  const [rightExpanded, setRightExpanded] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [portraitTab, setPortraitTab] = useState<PortraitTab>('channels');

  const navigate = useNavigate();

  // ─── URL caches live in streamService.ts ─────────────────────────────────

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
  const hasAccess = accessibleIds.includes(channel.id);

  if (hasAccess) {
    setSelectedChannel(channel);
    return;
  }
  try {
    const res = await api.get(`/api/channels/${channel.id}/plans`);
    const data = res.data;
    setPendingChannel({ 
        ...channel, 
        is_free: data.is_free, 
        plans: data.required_plans 
    } as ChannelWithPlans);
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

  useEffect(() => {
    api.get('/api/user/preferences/favourite-channels')
      .then(res => setFavorites(res.data))
      .catch(err => console.error('Failed to fetch favorites:', err));
  }, []);

  const markFavorite = (channelId: number) => {
    api.post('/api/user/preferences/favourite-channels', { channelId })
      .then(() => api.get('/api/user/preferences/favourite-channels'))
      .then(res => setFavorites(res.data))
      .catch(err => console.error('Failed to mark channel as favorite:', err));
  };

  const unmarkFavorite = (channelId: number) => {
    api.delete(`/api/user/preferences/favourites/${channelId}`)
      .then(() => api.get('/api/user/preferences/favourite-channels'))
      .then(res => setFavorites(res.data))
      .catch(err => console.error('Failed to remove channel from favorites:', err));
  };

  // ─── API ─────────────────────────────────────────────────────────────────────

  const goLive = useCallback(async (channelId: string) => {
    setIsStreamLoading(true);
    try {
      const { url } = await getLiveUrl(channelId);
      setStreamUrl(url);
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
      const { url, rewindableHours: hours } = await getArchiveUrl(channelId, safeTs);
      setStreamUrl(url);
      setMode('archive');
      setArchiveTimestamp(safeTs);
      if (!isNaN(hours)) setRewindableHours(hours);
    } catch (e) {
      console.error('[goArchive]', e);
    } finally {
      setIsStreamLoading(false);
    }
  }, [rewindableHours]);

  const fetchPrograms = useCallback(async (channelId: string, date: string) => {
    try {
      const { programs, nextDayPrograms } = await getProgramsForTimeline(channelId, date);
      setPrograms(programs);
      setNextDayPrograms(nextDayPrograms);
    } catch (e) {
      console.error('[fetchPrograms]', e);
    }
  }, []);

  // ─── Effects ─────────────────────────────────────────────────────────────────

 useEffect(() => {
  (async () => {
    try {
      const res = await api.get('/api/channels');
      const data = res.data;
      
      setChannels(data.channels || []);
      setAccessibleIds(data.accessible_external_ids || []); 

      const firstAccessible = data.channels.find((ch:Channel) => 
        data.accessible_external_ids.includes(ch.id)
      ) ?? data.channels[0];

      if (firstAccessible) setSelectedChannel(firstAccessible);
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
      try {
        const hours = await probeRewindableHours(selectedChannel.id);
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

  const filteredChannels = selectedCategory !== ""
    ? channels.filter(ch => selectedCategory === ch.category)
    : channels;

  const toggleCategory = (id: string) => selectedCategory === id
    ? setselectedCategory("")
    : setselectedCategory(id);

  const programDateAsDate = new Date(programDate.replace(/\//g, '-'));

  // ════════════════════════════════════════════════════════════
  // MOBILE PORTRAIT LAYOUT
  // ════════════════════════════════════════════════════════════

  if (isMobilePortrait) {
    return (
      <div className="flex flex-col w-full h-[calc(100vh-80px)] bg-gray-50 dark:bg-[#21262c] overflow-hidden">

        {pendingChannel && (
          <div className="absolute inset-0 bg-black/50 z-30">
            <PlansModal
              channel={pendingChannel}
              lang="en"
              onClose={() => setPendingChannel(null)}
              onSelectPlan={() => navigate('/packets')}
            />
          </div>
        )}

        {/* Video */}
        <div className="w-full shrink-0 bg-black">
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

        {/* Now-watching strip */}
        <div className="shrink-0 flex items-center gap-2.5 px-3 py-2
          bg-white/80 dark:bg-white/5
          border-b border-black/8 dark:border-white/8
          backdrop-blur-md"
        >
          <div className="w-8 h-8 rounded-lg bg-white dark:bg-white/10 shadow-sm flex items-center justify-center shrink-0 overflow-hidden">
            {selectedChannel && (
              <img src={selectedChannel.logo} className="w-10/12 h-10/12 object-contain rounded-[3px]" alt="" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-black/80 dark:text-white/80 truncate">
              {selectedChannel?.name}
            </p>
            {(() => {
              const now = mode === 'live' ? liveUnixSec : (archiveTimestamp ?? liveUnixSec);
              const cur = programs.find(p => p.START_TIME <= now && p.END_TIME > now);
              return cur
                ? <p className="text-[10px] text-black/40 dark:text-white/35 truncate">{cur.TITLE}</p>
                : null;
            })()}
          </div>
          <button
            onClick={handleCalendarToggle}
            className="w-8 h-8 flex items-center justify-center rounded-lg
              text-black/40 dark:text-white/35
              hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-400/10
              transition-all duration-150 shrink-0"
          >
            <CalendarDays size={16} />
          </button>
          {mode === 'live' && (
            <div className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/10">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[9px] font-bold text-red-500 uppercase tracking-wide">Live</span>
            </div>
          )}
        </div>

        {/* Calendar overlay */}
        {isCalendarVisible && (
          <div className="absolute inset-0 z-20">
            <MobileCalendar
              archiveDays={rewindableDays}
              initialDate={programDateAsDate}
              onSelect={handleCalendarDateSelect}
            />
          </div>
        )}

        {/* Tab bar */}
        <div className="shrink-0 flex bg-white/70 dark:bg-zinc-900/80 backdrop-blur-md border-b border-black/8 dark:border-white/8">
          {(['channels', 'programs'] as PortraitTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setPortraitTab(tab)}
              className={`flex-1 py-2.5 text-[12px] font-semibold capitalize transition-all relative
                ${portraitTab === tab ? 'text-orange-500' : 'text-black/40 dark:text-white/35'}`}
            >
              {tab === 'programs' ? 'პროგრამა' : 'არხები'}
              {portraitTab === tab && (
                <span className="absolute bottom-0 left-1/4 right-1/4 h-[2px] rounded-full bg-gradient-to-r from-orange-500 to-yellow-400" />
              )}
            </button>
          ))}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {portraitTab === 'channels' ? (
            <div className="p-3">
              <ChannelGrid
                channels={channels}
                selectedChannel={selectedChannel}
                onChannelSelect={ch => { handleChannelSelect(ch); setPortraitTab('programs'); }}
                favorites={favorites}
                markFavorite={markFavorite}
                unmarkFavorite={unmarkFavorite}
                categories={categories}
                selectedCategory={selectedCategory}
                onToggleCategory={toggleCategory}
              />
            </div>
          ) : (
            <div className="py-2">
              <ProgramsList
                programs={programs}
                mode={mode}
                archiveTimestamp={archiveTimestamp}
                onProgramSelect={handleProgramSelect}
                liveUnixSec={liveUnixSec}
              />
            </div>
          )}
        </div>

      </div>
    );
  }

  // ════════════════════════════════════════════════════════════
  // DESKTOP + MOBILE LANDSCAPE (unchanged)
  // ════════════════════════════════════════════════════════════

  return (
    <div className="flex flex-col justify-between w-full h-[calc(100vh-80px)] bg-[#21262c] relative">
      {pendingChannel && (
        <div className='absolute w-full h-full bg-black/50 z-30'>
          <PlansModal
            channel={pendingChannel}
            lang="en"
            onClose={() => setPendingChannel(null)}
            onSelectPlan={() => navigate('/packets')}
          />
        </div>
      )}
      <div className="flex-1 flex w-full">
        <div className='w-[65px] flex lg:hidden' />

        {/* LEFT */}
        <div className={`
          lg:relative lg:w-1/5
          absolute z-20 flex flex-col h-screen lg:h-[calc(100vh-128px)] overflow bg-yel
          transition-all duration-300 ease-in-out
          ${isMobile ? (leftExpanded ? 'w-2/5' : 'w-[65px]') : ''}
        `}>
          {isMobile && (
            <button
              onClick={() => setLeftExpanded(v => !v)}
              className="absolute -right-3 top-[50vh] -translate-y-1/2 z-30
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
              markFavorite={markFavorite}
              unmarkFavorite={unmarkFavorite}
              favlist={favorites}
            />
          </div>
        </div>

        {/* CENTER */}
        <div className="w-[calc(100vw-130px)] lg:w-3/5 relative lg:h-full flex flex-col">
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
            <div className="lg:hidden z-20 w-full h-full absolute flex top-0">
              <MobileCalendar
                archiveDays={rewindableDays}
                initialDate={programDateAsDate}
                onSelect={handleCalendarDateSelect}
              />
            </div>
          )}
          {!isMobile && (
            <div className='w-full h-full flex justify-center items-center'>
              <div className="shrink-0 w-full flex items-center gap-3 px-1 py-2 overflow-x-auto justify-center">
                <div className="flex items-center shrink-0">
                  <IconButtonDemo />
                </div>
                <div className="flex gap-2">
                  {(Array.isArray(categories) ? categories : []).map((category) => {
                    const isSelected = selectedCategory === category.name_en
                    return (
                      <div
                        key={category.id}
                        onClick={() => toggleCategory(category.name_en)}
                        className={`
                          relative flex items-center gap-1.5 h-10 px-3 rounded-lg cursor-pointer
                          text-xs font-medium transition-all duration-150
                          ${isSelected
                            ? 'bg-linear-to-br from-[#f82719] to-[#da2b1e] text-white '
                            : 'bg-white/70 dark:bg-white/5 border-black/8 dark:border-white/10 backdrop-blur-md text-black/50 dark:text-white/40 hover:text-black/70 dark:hover:text-white/60 hover:bg-white dark:hover:bg-white/10'
                          }
                        `}
                      >
                        {category.icon_url && (
                          <div className="w-5 h-5 flex items-center justify-center flex-none transition-transform duration-150  text-gray-900 dark:text-blue-200">
                            <div className={isSelected ? "scale-125" : "scale-100"}>

                               <span  style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }} className="material-symbols-outlined">{category.icon_url}</span>
                            </div>
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
          )}
        </div>

        {/* RIGHT */}
        <div className={`
          lg:relative lg:w-1/5
          absolute right-0 z-10 flex flex-col h-screen lg:h-[calc(100vh-128px)] bg-yel
          transition-all duration-300 ease-in-out
          ${isMobile ? (rightExpanded ? 'w-2/5' : 'w-[65px]') : ''}
        `}>
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
      {!isMobile && (
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
      )}
    </div>
  );
};

export default Stream;
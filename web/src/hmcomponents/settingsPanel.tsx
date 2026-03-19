import { useState, useEffect, useRef } from 'react';
import type { PlayerSettings } from './playerSettingsService';
import { PlayerSettingsService, SPEED_OPTIONS } from './playerSettingsService';

type SubPage = null | 'quality' | 'speed' | 'subtitles' | 'audio';

interface SettingsPanelProps {
  service:  PlayerSettingsService;
  onClose:  () => void;
}

// ─── Shared option-list sub-page ─────────────────────────────────────────────

const OptionList = ({
  title, options, selectedIndex, onSelect, onBack,
}: {
  title:         string;
  options:       { index: number; label: string; sub?: string }[];
  selectedIndex: number;
  onSelect:      (i: number) => void;
  onBack:        () => void;
}) => (
  <>
    <button
      onMouseDown={e => e.preventDefault()}
      onClick={onBack}
      className="w-full flex items-center gap-2.5 px-4 py-3
        border-b border-white/6 hover:bg-white/5
        cursor-pointer transition-colors"
    >
      <span className="material-symbols-outlined text-zinc-500" style={{ fontSize: '17px' }}>
        arrow_back
      </span>
      <span className="text-sm font-semibold text-zinc-300">{title}</span>
    </button>

    <div className="py-1 max-h-56 overflow-y-auto">
      {options.map(opt => {
        const active = opt.index === selectedIndex;
        return (
          <button
            key={opt.index}
            onMouseDown={e => e.preventDefault()}
            onClick={() => onSelect(opt.index)}
            className="w-full flex items-center gap-3 px-4 py-2.5
              hover:bg-white/6 cursor-pointer transition-colors group"
          >
            <span
              className="material-symbols-outlined shrink-0"
              style={{
                fontSize: '15px',
                color: active ? '#ef4444' : 'transparent',
                fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24",
              }}
            >
              check
            </span>
            <div className="flex flex-col text-left">
              <span className={`text-sm transition-colors ${active ? 'text-white' : 'text-zinc-400 group-hover:text-white'}`}>
                {opt.label}
              </span>
              {opt.sub && (
                <span className="text-[10px] text-zinc-700">{opt.sub}</span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  </>
);

// ─── Main panel ───────────────────────────────────────────────────────────────

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ service, onClose }) => {
  const [settings, setSettings] = useState<PlayerSettings>(service.getState());
  const [subPage,  setSubPage]  = useState<SubPage>(null);

  useEffect(() => service.subscribe(setSettings), [service]);

  const { levels, currentLevel, audioTracks, currentAudio,
          subTracks, currentSub, speed } = settings;

  const qualityLabel = levels.find(l => l.index === currentLevel)?.label ?? 'Auto';
  const audioLabel   = audioTracks.find(t => t.index === currentAudio)?.name ?? '—';
  const subLabel     = currentSub === -1
    ? 'Off'
    : subTracks.find(t => t.index === currentSub)?.name ?? 'Off';

  // ── Row ──────────────────────────────────────────────────────────────────────

  const Row = ({
    icon, label, value, onClick, active = false, disabled = false,
  }: {
    icon: string; label: string; value: string;
    onClick?: () => void; active?: boolean; disabled?: boolean;
  }) => (
    <button
      onMouseDown={e => e.preventDefault()}   // ← prevents blur before click
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
        ${disabled  ? 'opacity-30 cursor-default'
          : onClick ? 'cursor-pointer hover:bg-white/6'
                    : 'cursor-default'}
      `}
    >
      <span
        className="material-symbols-outlined shrink-0"
        style={{
          fontSize: '18px',
          color: active ? '#ef4444' : 'rgba(255,255,255,0.4)',
          fontVariationSettings: active
            ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24"
            : "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
        }}
      >
        {icon}
      </span>
      <span className={`flex-1 text-sm ${active ? 'text-white' : 'text-zinc-400 group-hover:text-white'}`}>
        {label}
      </span>
      <span className="text-xs text-zinc-600 shrink-0">{value}</span>
      {onClick && !disabled && (
        <span className="material-symbols-outlined text-zinc-700 shrink-0" style={{ fontSize: '15px' }}>
          chevron_right
        </span>
      )}
    </button>
  );

  return (
    <div
      // onMouseDown stops the video-container's mouseleave from firing
      onMouseDown={e => e.stopPropagation()}
      className="absolute bottom-10 right-0 z-50 w-56 rounded-xl overflow-hidden
        shadow-2xl shadow-black/80"
      style={{
        background:     'rgba(16,16,16,0.92)',
        backdropFilter: 'blur(16px)',
        border:         '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* ── Main menu ── */}
      {subPage === null && (
        <div className="py-1">
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-white/6">
            <span className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">
              Settings
            </span>
            <button
              onMouseDown={e => e.preventDefault()}
              onClick={onClose}
              className="text-zinc-700 hover:text-zinc-400 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>close</span>
            </button>
          </div>

          <Row
            icon="hd"
            label="Quality"
            value={qualityLabel}
            onClick={levels.length > 1 ? () => setSubPage('quality') : undefined}
            active={currentLevel !== -1}
            disabled={levels.length <= 1}
          />
          <Row
            icon="speed"
            label="Speed"
            value={PlayerSettingsService.speedLabel(speed)}
            onClick={() => setSubPage('speed')}
            active={speed !== 1}
          />
          <Row
            icon="subtitles"
            label="Subtitles"
            value={subLabel}
            onClick={subTracks.length > 0 ? () => setSubPage('subtitles') : undefined}
            active={currentSub !== -1}
            disabled={subTracks.length === 0}
          />
          <Row
            icon="volume_up"
            label="Audio"
            value={audioLabel}
            onClick={audioTracks.length > 1 ? () => setSubPage('audio') : undefined}
            active={false}
            disabled={audioTracks.length <= 1}
          />
        </div>
      )}

      {/* ── Quality ── */}
      {subPage === 'quality' && (
        <OptionList
          title="Quality"
          selectedIndex={currentLevel}
          onBack={() => setSubPage(null)}
          onSelect={i => { service.setQuality(i); setSubPage(null); }}
          options={levels.map(l => ({
            index: l.index,
            label: l.label,
            sub:   l.bitrate ? PlayerSettingsService.bitrateLabel(l.bitrate) : undefined,
          }))}
        />
      )}

      {/* ── Speed ── */}
      {subPage === 'speed' && (
        <OptionList
          title="Speed"
          selectedIndex={SPEED_OPTIONS.indexOf(speed)}
          onBack={() => setSubPage(null)}
          onSelect={i => { service.setSpeed(SPEED_OPTIONS[i]); setSubPage(null); }}
          options={SPEED_OPTIONS.map((s, i) => ({
            index: i,
            label: PlayerSettingsService.speedLabel(s),
          }))}
        />
      )}

      {/* ── Subtitles ── */}
      {subPage === 'subtitles' && (
        <OptionList
          title="Subtitles"
          selectedIndex={currentSub}
          onBack={() => setSubPage(null)}
          onSelect={i => { service.setSubtitleTrack(i); setSubPage(null); }}
          options={[
            { index: -1, label: 'Off' },
            ...subTracks.map(t => ({ index: t.index, label: t.name, sub: t.lang || undefined })),
          ]}
        />
      )}

      {/* ── Audio ── */}
      {subPage === 'audio' && (
        <OptionList
          title="Audio"
          selectedIndex={currentAudio}
          onBack={() => setSubPage(null)}
          onSelect={i => { service.setAudioTrack(i); setSubPage(null); }}
          options={audioTracks.map(t => ({ index: t.index, label: t.name, sub: t.lang || undefined }))}
        />
      )}
    </div>
  );
};
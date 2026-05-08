import { useState } from 'react';
import { DownloadPopup } from './downloadPopup';

interface DownloadButtonProps {
  channelId: string | undefined;
  /** Current playback position in unix seconds — used as default trim center */
  currentTimestamp: number | null;
  /** Oldest rewindable unix second */
  oldestTimestamp: number;
}

export const DownloadButton: React.FC<DownloadButtonProps> = ({
  channelId,
  currentTimestamp,
  oldestTimestamp,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
  onClick={() => setOpen(true)}
  className="
    h-8 px-3 flex items-center gap-1.5
    rounded-lg cursor-pointer
    text-black/40 dark:text-white/35
    transition-all duration-150
    hover:text-emerald-400
    hover:bg-emerald-50 dark:hover:bg-emerald-500/10
  "
  title="Download clip"
>
  <span
    className="material-symbols-outlined"
    style={{
      fontSize: '20px',
      color: '#aec8bf',
      fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
      transition: 'font-variation-settings 0.15s',
    }}
    onMouseEnter={e => {
      (e.currentTarget as HTMLElement).style.fontVariationSettings =
        "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24";
    }}
    onMouseLeave={e => {
      (e.currentTarget as HTMLElement).style.fontVariationSettings =
        "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24";
    }}
  >
    content_cut
  </span>

  <span className="text-xs font-medium">
    Clip
  </span>
</button>

      {open && (
        <DownloadPopup
          channelId={channelId}
          currentTimestamp={currentTimestamp}
          oldestTimestamp={oldestTimestamp}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
};
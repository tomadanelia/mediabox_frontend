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
        className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer
          transition-all duration-150
          hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
        title="Download clip"
      >
        <span
          className="material-symbols-outlined"
          style={{
            fontSize: '20px',
            color: '#10b981',
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
          download
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
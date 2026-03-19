import { useState, useRef, useEffect } from 'react';
import { SettingsPanel } from './settingsPanel';
import { PlayerSettingsService } from './playerSettingsService';

interface SettingsButtonProps {
  service: PlayerSettingsService;
}

export const SettingsButton: React.FC<SettingsButtonProps> = ({ service }) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    // Use mousedown so it fires before blur
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div
      ref={rootRef}
      className="relative inline-flex items-center"
      onMouseLeave={e => e.stopPropagation()}
    >
      <button
        onMouseDown={e => e.preventDefault()}
        onClick={() => setOpen(v => !v)}
        title="Settings"
        className="cursor-pointer transition-colors duration-150 flex items-center justify-center w-8 h-8"
        style={{ color: open ? '#ef4444' : 'white' }}
        onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
        onMouseLeave={e => { if (!open) e.currentTarget.style.color = 'white'; }}
      >
        <div className="w-5 h-5 flex items-center justify-center">
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: '20px',
              display: 'block',
              lineHeight: 1,
              fontVariationSettings: open
                ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24"
                : "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
              transition: 'font-variation-settings 0.15s',
            }}
          >
            settings
          </span>
        </div>
      </button>

      {open && (
        <SettingsPanel
          service={service}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
};
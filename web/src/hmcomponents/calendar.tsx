import { useState, useMemo } from "react";


interface ChannelCalendarProps {
  
  archiveDays: number;

  onSelect?: (date: Date) => void;
  
  channelName?: string;
}

function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function addDays(d: Date, n: number): Date {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function monthLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDOW(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

/* ─────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────── */
const DOW_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export default function ChannelCalendar({
  archiveDays,
  onSelect,
  channelName = "Channel",
}: ChannelCalendarProps) {
  const TODAY    = useMemo(() => startOfDay(new Date()), []);
  const MIN_DATE = useMemo(() => startOfDay(addDays(TODAY, -archiveDays)), [TODAY, archiveDays]);

  const [viewYear,  setViewYear]  = useState(TODAY.getFullYear());
  const [viewMonth, setViewMonth] = useState(TODAY.getMonth());
  const [selected,  setSelected]  = useState<Date | null>(null);

  const cells = useMemo<(Date | null)[]>(() => {
    const firstDOW = getFirstDOW(viewYear, viewMonth);
    const total    = getDaysInMonth(viewYear, viewMonth);
    const arr: (Date | null)[] = Array(firstDOW).fill(null);
    for (let d = 1; d <= total; d++) {
      arr.push(new Date(viewYear, viewMonth, d));
    }
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [viewYear, viewMonth]);

  /* ── Month navigation boundaries ── */
  const canGoPrev = !(
    viewYear === MIN_DATE.getFullYear() && viewMonth === MIN_DATE.getMonth()
  );
  const canGoNext = !(
    viewYear === TODAY.getFullYear() && viewMonth === TODAY.getMonth()
  );

  const prevMonth = () => {
    if (!canGoPrev) return;
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (!canGoNext) return;
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  /* ── Day state helpers ── */
  const isInWindow  = (d: Date) => d >= MIN_DATE && d <= TODAY;
  const isToday     = (d: Date) => sameDay(d, TODAY);
  const isMinDay    = (d: Date) => sameDay(d, MIN_DATE);
  const isSelected  = (d: Date) => !!selected && sameDay(d, selected);
  const isDisabled  = (d: Date) => !isInWindow(d);

  // For the range strip — is this day between MIN_DATE and TODAY (the pre-highlighted band)?
  const isWindowStart = (d: Date) => sameDay(d, MIN_DATE);
  const isWindowEnd   = (d: Date) => sameDay(d, TODAY);

  /* ── Handle pick ── */
  const handleClick = (day: Date) => {
    if (isDisabled(day)) return;
    setSelected(day);
    onSelect?.(day);
  };

  /* ── Days since selected ── */
  const daysAgo = selected
    ? Math.round((TODAY.getTime() - selected.getTime()) / 86400000)
    : null;

  return (
    <div className="w-full max-w-sm">
      <div className="rounded-3xl bg-zinc-900 border border-zinc-800 overflow-hidden shadow-2xl shadow-black/50">

        {/* ── Header ── */}
        <div className="px-5 pt-5 pb-4 border-b border-zinc-800/70">
          {/* Channel label */}
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/60" />
            <span className="text-[0.65rem] font-semibold text-zinc-500 uppercase tracking-widest">
              {channelName}
            </span>
          </div>

          {/* Archive window info */}
          <div className="flex items-stretch gap-2">
            {/* Window pill */}
            <div className="flex-1 rounded-xl bg-violet-500/8 border border-violet-500/20 px-3 py-2.5">
              <p className="text-[0.57rem] font-semibold text-violet-500/70 uppercase tracking-widest mb-1">
                Archive Window
              </p>
              <p className="text-sm font-semibold text-violet-300 leading-tight">
                Last {archiveDays} {archiveDays === 1 ? "day" : "days"}
              </p>
              <p className="text-[0.63rem] text-zinc-600 mt-0.5">
                {formatDate(MIN_DATE).split(",")[0] + ", " + MIN_DATE.toLocaleDateString("en-US", { month: "short", day: "numeric" })} — Today
              </p>
            </div>

            {/* Selected date */}
            <div className={`flex-1 rounded-xl border px-3 py-2.5 transition-colors duration-200 ${
              selected
                ? "bg-zinc-800/60 border-zinc-700"
                : "bg-zinc-800/20 border-zinc-800"
            }`}>
              <p className="text-[0.57rem] font-semibold text-zinc-600 uppercase tracking-widest mb-1">
                Selected
              </p>
              {selected ? (
                <>
                  <p className="text-sm font-semibold text-zinc-100 leading-tight">
                    {selected.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                  <p className="text-[0.63rem] text-zinc-500 mt-0.5">
                    {daysAgo === 0 ? "Today" : `${daysAgo}d ago`}
                  </p>
                </>
              ) : (
                <p className="text-sm text-zinc-700">Pick a date</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Month navigation ── */}
        <div className="flex items-center justify-between px-5 py-3.5">
          <button
            onClick={prevMonth}
            disabled={!canGoPrev}
            className={`w-8 h-8 rounded-xl border flex items-center justify-center text-base transition-all ${
              canGoPrev
                ? "bg-zinc-800/60 border-zinc-700/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/60"
                : "bg-zinc-800/20 border-zinc-800/30 text-zinc-800 cursor-not-allowed"
            }`}
          >
            ‹
          </button>

          <div className="text-center">
            <p className="text-sm font-semibold text-zinc-200 tracking-wide">
              {monthLabel(viewYear, viewMonth)}
            </p>
          </div>

          <button
            onClick={nextMonth}
            disabled={!canGoNext}
            className={`w-8 h-8 rounded-xl border flex items-center justify-center text-base transition-all ${
              canGoNext
                ? "bg-zinc-800/60 border-zinc-700/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/60"
                : "bg-zinc-800/20 border-zinc-800/30 text-zinc-800 cursor-not-allowed"
            }`}
          >
            ›
          </button>
        </div>

        {/* ── Calendar grid ── */}
        <div className="px-4 pb-5">
          {/* DOW header */}
          <div className="grid grid-cols-7 mb-1">
            {DOW_LABELS.map((d) => (
              <div
                key={d}
                className="text-center text-[0.58rem] font-semibold text-zinc-700 uppercase tracking-widest py-1.5"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7">
            {cells.map((day, idx) => {
              if (!day) return <div key={`e${idx}`} style={{ height: 40 }} />;

              const inWindow  = isInWindow(day);
              const todayDay  = isToday(day);
              const minDay    = isMinDay(day);
              const selDay    = isSelected(day);
              const disabled  = isDisabled(day);

              const dow = day.getDay();
              const isRowStart = dow === 0;
              const isRowEnd   = dow === 6;
              const isWinStart = isWindowStart(day);
              const isWinEnd   = isWindowEnd(day);

              // The continuous strip behind the window days
              // Strip goes full-width for middle days, half for first/last
              const showStrip     = inWindow;
              const stripLeft     = isWinStart || isRowStart;
              const stripRight    = isWinEnd   || isRowEnd;
              const stripRoundL   = isWinStart;
              const stripRoundR   = isWinEnd;

              return (
                <div
                  key={day.toISOString()}
                  className="relative flex items-center justify-center"
                  style={{ height: 40 }}
                >
                  {/* ── Window highlight strip ── */}
                  {showStrip && (
                    <div
                      className="absolute inset-y-1.5"
                      style={{
                        left:  stripLeft  ? "50%" : 0,
                        right: stripRight ? "50%" : 0,
                        background: selDay
                          ? "rgba(139,92,246,0.18)"
                          : "rgba(139,92,246,0.09)",
                        borderRadius: stripRoundL && stripRoundR
                          ? "8px"
                          : stripRoundL
                          ? "8px 0 0 8px"
                          : stripRoundR
                          ? "0 8px 8px 0"
                          : undefined,
                        transition: "background 0.15s",
                      }}
                    />
                  )}

                  {/* ── Day cell ── */}
                  <button
                    onClick={() => handleClick(day)}
                    disabled={disabled}
                    title={disabled ? "Outside archive window" : formatDate(day)}
                    className={[
                      "relative z-10 w-9 h-9 rounded-xl text-sm font-medium transition-all duration-100 select-none",
                      disabled && !inWindow
                        ? "text-zinc-800 cursor-not-allowed"
                        : "",
                      selDay
                        ? "bg-violet-500 text-white shadow-lg shadow-violet-500/40 scale-110 font-semibold"
                        : todayDay && !selDay
                        ? "ring-1 ring-violet-400/50 text-violet-300 hover:bg-zinc-700/60"
                        : inWindow && !selDay
                        ? "text-zinc-200 hover:bg-zinc-700/70 hover:scale-105"
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {day.getDate()}

                    {/* Today dot */}
                    {todayDay && !selDay && (
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-violet-400" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Legend / footer ── */}
        <div className="px-5 py-3.5 border-t border-zinc-800/60 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <LegendItem color="bg-violet-500/25 border border-violet-500/30" label="Archive" />
            <LegendItem color="bg-violet-500" label="Selected" />
            <LegendItem color="ring-1 ring-violet-400/50" label="Today" />
          </div>

          {selected && (
            <button
              onClick={() => { setSelected(null); }}
              className="text-[0.62rem] text-zinc-700 hover:text-rose-400 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Confirmation chip ── */}
      <div
        className={`mt-3 overflow-hidden transition-all duration-300 ${
          selected ? "max-h-20 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="p-3.5 rounded-2xl bg-zinc-900/70 border border-zinc-800 flex items-center justify-between">
          <div>
            <p className="text-[0.6rem] text-zinc-600 uppercase tracking-widest mb-0.5">Viewing shows from</p>
            <p className="text-sm font-semibold text-zinc-100">{selected ? formatDate(selected) : ""}</p>
          </div>
          <span className="text-[0.65rem] font-medium px-2.5 py-1 rounded-xl bg-violet-500/15 border border-violet-500/25 text-violet-300">
            {daysAgo === 0 ? "Today" : daysAgo === 1 ? "Yesterday" : `${daysAgo} days ago`}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   LEGEND ITEM
───────────────────────────────────────────── */
function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-2.5 h-2.5 rounded-sm ${color}`} />
      <span className="text-[0.6rem] text-zinc-600">{label}</span>
    </div>
  );
}
import { useState, useMemo } from "react";

interface ChannelCalendarProps {
  archiveDays: number;
  onSelect?: (date: Date) => void;
  channelName?: string;
  initialDate?: Date | null;
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

const DOW_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const R        = "#d52b1e";
const R_LIGHT  = "rgba(213,43,30,0.10)";
const R_MED    = "rgba(213,43,30,0.18)";
const R_STRIP  = "rgba(213,43,30,0.09)";
const R_SEL    = "rgba(213,43,30,0.18)";
const R_GLOW   = "rgba(213,43,30,0.35)";
const R_SOFT   = "#f87171";
const R_RING   = "rgba(213,43,30,0.45)";

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  return (
    <span
      className="material-symbols-outlined select-none"
      style={{ fontSize: size, lineHeight: 1, display: "block" }}
    >
      {name}
    </span>
  );
}

export default function ChannelCalendar({
  archiveDays,
  onSelect,
  channelName = "Channel",
  initialDate,
}: ChannelCalendarProps) {
  const TODAY    = useMemo(() => startOfDay(new Date()), []);
  const MIN_DATE = useMemo(() => startOfDay(addDays(TODAY, -archiveDays)), [TODAY, archiveDays]);

  const initSelected = useMemo(() => {
    if (!initialDate) return null;
    const d = startOfDay(initialDate);
    return d <= TODAY && d >= MIN_DATE ? d : null;
  }, []);

  const [viewYear,  setViewYear]  = useState(() => (initSelected ?? TODAY).getFullYear());
  const [viewMonth, setViewMonth] = useState(() => (initSelected ?? TODAY).getMonth());
  const [selected,  setSelected]  = useState<Date | null>(initSelected);

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

  const canGoPrev = !(viewYear === MIN_DATE.getFullYear() && viewMonth === MIN_DATE.getMonth());
  const canGoNext = !(viewYear === TODAY.getFullYear() && viewMonth === TODAY.getMonth());

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

  const isInWindow  = (d: Date) => d >= MIN_DATE && d <= TODAY;
  const isToday     = (d: Date) => sameDay(d, TODAY);
  const isSelected  = (d: Date) => !!selected && sameDay(d, selected);
  const isDisabled  = (d: Date) => !isInWindow(d);

  const isWindowStart = (d: Date) => sameDay(d, MIN_DATE);
  const isWindowEnd   = (d: Date) => sameDay(d, TODAY);

  const handleClick = (day: Date) => {
    if (isDisabled(day)) return;
    setSelected(day);
    onSelect?.(day);
  };

  const daysAgo = selected
    ? Math.round((TODAY.getTime() - selected.getTime()) / 86400000)
    : null;

  return (
    <div className="w-full max-w-sm">
      <div className="rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden shadow-2xl shadow-black/50">

        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-zinc-800/70">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: R, boxShadow: `0 0 6px ${R_GLOW}` }} />
            <span className="text-[0.65rem] font-semibold text-zinc-500 uppercase tracking-widest">
              {channelName}
            </span>
          </div>

          <div className="flex items-stretch gap-2">
            <div className="flex-1 rounded-xl px-3 py-2.5" style={{ background: R_LIGHT, border: `1px solid ${R_MED}` }}>
              <p className="text-[0.57rem] font-semibold uppercase tracking-widest mb-1" style={{ color: 'rgba(213,43,30,0.60)' }}>
                Archive Window
              </p>
              <p className="text-sm font-semibold leading-tight" style={{ color: R_SOFT }}>
                Last {archiveDays} {archiveDays === 1 ? "day" : "days"}
              </p>
              <p className="text-[0.63rem] text-zinc-600 mt-0.5">
                {formatDate(MIN_DATE).split(",")[0] + ", " + MIN_DATE.toLocaleDateString("en-US", { month: "short", day: "numeric" })} — Today
              </p>
            </div>

            <div className={`flex-1 rounded-xl border px-3 py-2.5 transition-colors duration-200 ${
              selected ? "bg-zinc-800/60 border-zinc-700" : "bg-zinc-800/20 border-zinc-800"
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

        {/* Month navigation */}
        <div className="flex items-center justify-between px-5 py-3.5">
          <button
            onClick={prevMonth}
            disabled={!canGoPrev}
            className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all ${
              canGoPrev
                ? "bg-zinc-800/60 border-zinc-700/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/60"
                : "bg-zinc-800/20 border-zinc-800/30 text-zinc-800 cursor-not-allowed"
            }`}
          >
            <Icon name="chevron_left" size={18} />
          </button>

          <p className="text-sm font-semibold text-zinc-200 tracking-wide">
            {monthLabel(viewYear, viewMonth)}
          </p>

          <button
            onClick={nextMonth}
            disabled={!canGoNext}
            className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all ${
              canGoNext
                ? "bg-zinc-800/60 border-zinc-700/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/60"
                : "bg-zinc-800/20 border-zinc-800/30 text-zinc-800 cursor-not-allowed"
            }`}
          >
            <Icon name="chevron_right" size={18} />
          </button>
        </div>

        {/* Calendar grid */}
        <div className="px-4 pb-5">
          <div className="grid grid-cols-7 mb-1">
            {DOW_LABELS.map((d) => (
              <div key={d} className="text-center text-[0.58rem] font-semibold text-zinc-700 uppercase tracking-widest py-1.5">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {cells.map((day, idx) => {
              if (!day) return <div key={`e${idx}`} style={{ height: 40 }} />;

              const inWindow  = isInWindow(day);
              const todayDay  = isToday(day);
              const selDay    = isSelected(day);
              const disabled  = isDisabled(day);

              const dow        = day.getDay();
              const isRowStart = dow === 0;
              const isRowEnd   = dow === 6;
              const isWinStart = isWindowStart(day);
              const isWinEnd   = isWindowEnd(day);

              const showStrip   = inWindow;
              const stripLeft   = isWinStart || isRowStart;
              const stripRight  = isWinEnd   || isRowEnd;
              const stripRoundL = isWinStart;
              const stripRoundR = isWinEnd;

              return (
                <div
                  key={day.toISOString()}
                  className="relative flex items-center justify-center"
                  style={{ height: 40 }}
                >
                  {showStrip && (
                    <div
                      className="absolute inset-y-1.5"
                      style={{
                        left:  stripLeft  ? "50%" : 0,
                        right: stripRight ? "50%" : 0,
                        background: selDay ? R_SEL : R_STRIP,
                        borderRadius: stripRoundL && stripRoundR
                          ? "8px"
                          : stripRoundL ? "8px 0 0 8px"
                          : stripRoundR ? "0 8px 8px 0"
                          : undefined,
                        transition: "background 0.15s",
                      }}
                    />
                  )}

                  <button
                    onClick={() => handleClick(day)}
                    disabled={disabled}
                    title={disabled ? "Outside archive window" : formatDate(day)}
                    style={selDay ? {
                      background: `linear-gradient(135deg, ${R}, #b71c1c)`,
                      boxShadow: `0 4px 12px ${R_GLOW}`,
                    } : todayDay && !selDay ? {
                      outline: `1px solid ${R_RING}`,
                      outlineOffset: '-1px',
                      color: R_SOFT,
                    } : {}}
                    className={[
                      "relative z-10 w-9 h-9 rounded-xl text-sm font-medium transition-all duration-100 select-none",
                      disabled && !inWindow ? "text-zinc-800 cursor-not-allowed" : "",
                      selDay
                        ? "text-white scale-110 font-semibold"
                        : todayDay && !selDay
                        ? "hover:bg-zinc-700/60"
                        : inWindow && !selDay
                        ? "text-zinc-200 hover:bg-zinc-700/70 hover:scale-105"
                        : "",
                    ].filter(Boolean).join(" ")}
                  >
                    {day.getDate()}
                    {todayDay && !selDay && (
                      <span
                        className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                        style={{ backgroundColor: R }}
                      />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-zinc-800/60 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <LegendItem dot={R_STRIP} border={R_MED}  label="Archive"  />
            <LegendItem dot={R}       border=""        label="Selected" />
            <LegendItem dot=""        border={R_RING}  label="Today"    />
          </div>
          {selected && (
            <button
              onClick={() => setSelected(null)}
              className="text-[0.62rem] text-zinc-700 transition-colors"
              style={{}}
              onMouseEnter={e => (e.currentTarget.style.color = R_SOFT)}
              onMouseLeave={e => (e.currentTarget.style.color = '')}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className={`mt-3 overflow-hidden transition-all duration-300 ${selected ? "max-h-20 opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="p-3.5 rounded-2xl bg-zinc-900/70 border border-zinc-800 flex items-center justify-between">
          <div>
            <p className="text-[0.6rem] text-zinc-600 uppercase tracking-widest mb-0.5">Viewing shows from</p>
            <p className="text-sm font-semibold text-zinc-100">{selected ? formatDate(selected) : ""}</p>
          </div>
          <span
            className="text-[0.65rem] font-medium px-2.5 py-1 rounded-xl"
            style={{ background: R_LIGHT, border: `1px solid ${R_MED}`, color: R_SOFT }}
          >
            {daysAgo === 0 ? "Today" : daysAgo === 1 ? "Yesterday" : `${daysAgo} days ago`}
          </span>
        </div>
      </div>
    </div>
  );
}

function LegendItem({ dot, border, label }: { dot: string; border: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="w-2.5 h-2.5 rounded-sm"
        style={{
          backgroundColor: dot || 'transparent',
          outline: border ? `1px solid ${border}` : undefined,
          outlineOffset: border && !dot ? '-1px' : undefined,
        }}
      />
      <span className="text-[0.6rem] text-zinc-600">{label}</span>
    </div>
  );
}
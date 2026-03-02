'use client'

import { useState, useMemo, useRef, useEffect } from "react";

interface MobileCalendarProps {
  archiveDays: number;
  onSelect?: (date: Date) => void;
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
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const ITEM_H = 44;

// ─── Scroll Drum ─────────────────────────────────────────────────────────────

function Drum({
  items,
  selectedIndex,
  onSelect,
  disabledIndices = new Set(),
}: {
  items: string[]
  selectedIndex: number
  onSelect: (i: number) => void
  disabledIndices?: Set<number>
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startScroll = useRef(0);

  // Snap scroll to selected
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollTop = selectedIndex * ITEM_H;
  }, [selectedIndex]);

  const handleScroll = () => {
    const el = ref.current;
    if (!el || isDragging.current) return;
    const i = Math.round(el.scrollTop / ITEM_H);
    const clamped = Math.max(0, Math.min(items.length - 1, i));
    if (clamped !== selectedIndex && !disabledIndices.has(clamped)) {
      onSelect(clamped);
    }
  };

  return (
    <div className="relative flex-1 flex flex-col items-center">
      {/* Fade top */}
      <div className="absolute top-0 left-0 right-0 h-16 z-10 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, rgba(24,24,27,1) 0%, transparent 100%)" }} />
      {/* Fade bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-16 z-10 pointer-events-none"
        style={{ background: "linear-gradient(to top, rgba(24,24,27,1) 0%, transparent 100%)" }} />

      {/* Selection highlight */}
      <div className="absolute left-1 right-1 top-1/2 -translate-y-1/2 z-10 pointer-events-none"
        style={{ height: ITEM_H, borderRadius: 10, background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)" }} />

      <div
        ref={ref}
        onScroll={handleScroll}
        className="w-full overflow-y-scroll"
        style={{
          height: ITEM_H * 5,
          scrollSnapType: "y mandatory",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {/* padding top/bottom so first/last items can center */}
        <div style={{ height: ITEM_H * 2 }} />
        {items.map((label, i) => {
          const isSelected = i === selectedIndex;
          const isDisabled = disabledIndices.has(i);
          return (
            <div
              key={i}
              onClick={() => !isDisabled && onSelect(i)}
              style={{ height: ITEM_H, scrollSnapAlign: "center" }}
              className={[
                "flex items-center justify-center text-sm font-medium transition-all duration-150 cursor-pointer select-none",
                isSelected ? "text-white scale-110" : "",
                isDisabled ? "text-zinc-800 cursor-not-allowed" : !isSelected ? "text-zinc-500 hover:text-zinc-300" : "",
              ].join(" ")}
            >
              {label}
            </div>
          );
        })}
        <div style={{ height: ITEM_H * 2 }} />
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MobileCalendar({
  archiveDays,
  onSelect,
  initialDate,
}: MobileCalendarProps) {
  const TODAY    = useMemo(() => startOfDay(new Date()), []);
  const MIN_DATE = useMemo(() => startOfDay(addDays(TODAY, -archiveDays)), [TODAY, archiveDays]);

  const initDate = useMemo(() => {
    if (initialDate) {
      const d = startOfDay(initialDate);
      if (d >= MIN_DATE && d <= TODAY) return d;
    }
    return TODAY;
  }, []);

  const [year,  setYear]  = useState(initDate.getFullYear());
  const [month, setMonth] = useState(initDate.getMonth());
  const [day,   setDay]   = useState(initDate.getDate());

  // Available years
  const years = useMemo(() => {
    const ys: number[] = [];
    for (let y = MIN_DATE.getFullYear(); y <= TODAY.getFullYear(); y++) ys.push(y);
    return ys;
  }, [MIN_DATE, TODAY]);

  // Days in current month
  const daysInMonth = useMemo(() => getDaysInMonth(year, month), [year, month]);
  const days = useMemo(() => Array.from({ length: daysInMonth }, (_, i) => i + 1), [daysInMonth]);

  // When month/year changes, auto-select last valid day (going back) or first valid day (going forward)
  const prevMonthRef = useRef(month);
  const prevYearRef  = useRef(year);
  useEffect(() => {
    const prevDate = new Date(prevYearRef.current, prevMonthRef.current, 1);
    const currDate = new Date(year, month, 1);
    const goingBack = currDate < prevDate;

    if (goingBack) {
      // Select last valid day of this month
      const lastDay = new Date(year, month + 1, 0);
      lastDay.setHours(0, 0, 0, 0);
      const clamped = lastDay > TODAY ? TODAY : lastDay < MIN_DATE ? MIN_DATE : lastDay;
      setDay(clamped.getDate());
    } else {
      // Select first valid day of this month
      const firstDay = new Date(year, month, 1);
      firstDay.setHours(0, 0, 0, 0);
      const clamped = firstDay < MIN_DATE ? MIN_DATE : firstDay > TODAY ? TODAY : firstDay;
      setDay(clamped.getDate());
    }

    prevMonthRef.current = month;
    prevYearRef.current  = year;
  }, [month, year]);

  // Compute the selected date and check if valid
  const selectedDate = useMemo(() => {
    const d = new Date(year, month, Math.min(day, daysInMonth));
    d.setHours(0, 0, 0, 0);
    return d;
  }, [year, month, day, daysInMonth]);

  const isValid = selectedDate >= MIN_DATE && selectedDate <= TODAY;

  // Disabled sets
  const disabledMonths = useMemo(() => {
    const s = new Set<number>();
    for (let m = 0; m < 12; m++) {
      const lastDayOfMonth = new Date(year, m + 1, 0);
      lastDayOfMonth.setHours(0, 0, 0, 0);
      const firstDayOfMonth = new Date(year, m, 1);
      firstDayOfMonth.setHours(0, 0, 0, 0);
      if (lastDayOfMonth < MIN_DATE || firstDayOfMonth > TODAY) s.add(m);
    }
    return s;
  }, [year, MIN_DATE, TODAY]);

  const disabledDays = useMemo(() => {
    const s = new Set<number>();
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      date.setHours(0, 0, 0, 0);
      if (date < MIN_DATE || date > TODAY) s.add(d - 1); // index
    }
    return s;
  }, [year, month, daysInMonth, MIN_DATE, TODAY]);

  const handleConfirm = () => {
    if (!isValid) return;
    onSelect?.(selectedDate);
  };

  const daysAgo = Math.round((TODAY.getTime() - selectedDate.getTime()) / 86400000);
  const label = daysAgo === 0 ? "Today" : daysAgo === 1 ? "Yesterday" : `${daysAgo} days ago`;

  return (
    <div className="w-full max-w-xs mx-auto">
      <div className="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden shadow-2xl shadow-black/60">

        {/* Drums */}
        <div className="flex px-3 pt-3 gap-1" style={{ height: ITEM_H * 5 }}>
          {/* Day */}
          <Drum
            items={days.map(d => String(d).padStart(2, "0"))}
            selectedIndex={Math.min(day, daysInMonth) - 1}
            onSelect={i => setDay(i + 1)}
            disabledIndices={disabledDays}
          />
          {/* Divider */}
          <div className="flex items-center justify-center text-zinc-700 text-lg font-light pb-px">/</div>
          {/* Month */}
          <Drum
            items={MONTHS}
            selectedIndex={month}
            onSelect={i => setMonth(i)}
            disabledIndices={disabledMonths}
          />
          {/* Divider */}
          <div className="flex items-center justify-center text-zinc-700 text-lg font-light pb-px">/</div>
          {/* Year */}
          <Drum
            items={years.map(String)}
            selectedIndex={years.indexOf(year)}
            onSelect={i => setYear(years[i])}
          />
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-zinc-800 flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-[0.6rem] text-zinc-600 uppercase tracking-widest">Selected</span>
            <span className={`text-sm font-semibold ${isValid ? "text-zinc-100" : "text-red-400"}`}>
              {isValid
                ? selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                : "Out of range"}
            </span>
            {isValid && <span className="text-[0.6rem] text-zinc-500">{label}</span>}
          </div>

          <button
            onClick={handleConfirm}
            disabled={!isValid}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
              isValid
                ? "bg-violet-500 hover:bg-violet-400 text-white shadow-lg shadow-violet-500/30"
                : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
            }`}
          >
            Go
          </button>
        </div>
      </div>
    </div>
  );
}
'use client'

import { useState, useMemo, useRef, useEffect } from "react";

interface MobileCalendarProps {
  archiveDays: number;
  onSelect?: (date: Date) => void;
  initialDate?: Date | null;
  onClose?: () => void;
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

const MONTHS = ["იან","თებ","მარ","აპრ","მაი","ივნ","ივლ","აგვ","სექ","ოქტ","ნოე","დეკ"];
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
        style={{ background: "linear-gradient(to bottom, #21262c 0%, transparent 100%)" }} />
      {/* Fade bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-16 z-10 pointer-events-none"
        style={{ background: "linear-gradient(to top, #21262c 0%, transparent 100%)" }} />

      {/* Selection highlight — red tint */}
      <div className="absolute left-1 right-1 top-1/2 -translate-y-1/2 z-10 pointer-events-none"
        style={{ height: ITEM_H, borderRadius: 10, background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.25)" }} />

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
                isDisabled ? "text-white/10 cursor-not-allowed" : !isSelected ? "text-gray-500 hover:text-gray-300" : "",
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
  onClose,
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

  const years = useMemo(() => {
    const ys: number[] = [];
    for (let y = MIN_DATE.getFullYear(); y <= TODAY.getFullYear(); y++) ys.push(y);
    return ys;
  }, [MIN_DATE, TODAY]);

  const daysInMonth = useMemo(() => getDaysInMonth(year, month), [year, month]);
  const days = useMemo(() => Array.from({ length: daysInMonth }, (_, i) => i + 1), [daysInMonth]);

  const prevMonthRef = useRef(month);
  const prevYearRef  = useRef(year);
  useEffect(() => {
    const prevDate = new Date(prevYearRef.current, prevMonthRef.current, 1);
    const currDate = new Date(year, month, 1);
    const goingBack = currDate < prevDate;

    if (goingBack) {
      const lastDay = new Date(year, month + 1, 0);
      lastDay.setHours(0, 0, 0, 0);
      const clamped = lastDay > TODAY ? TODAY : lastDay < MIN_DATE ? MIN_DATE : lastDay;
      setDay(clamped.getDate());
    } else {
      const firstDay = new Date(year, month, 1);
      firstDay.setHours(0, 0, 0, 0);
      const clamped = firstDay < MIN_DATE ? MIN_DATE : firstDay > TODAY ? TODAY : firstDay;
      setDay(clamped.getDate());
    }

    prevMonthRef.current = month;
    prevYearRef.current  = year;
  }, [month, year]);

  const selectedDate = useMemo(() => {
    const d = new Date(year, month, Math.min(day, daysInMonth));
    d.setHours(0, 0, 0, 0);
    return d;
  }, [year, month, day, daysInMonth]);

  const isValid = selectedDate >= MIN_DATE && selectedDate <= TODAY;

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
      if (date < MIN_DATE || date > TODAY) s.add(d - 1);
    }
    return s;
  }, [year, month, daysInMonth, MIN_DATE, TODAY]);

  const handleConfirm = () => {
    if (!isValid) return;
    onSelect?.(selectedDate);
  };

  const daysAgo = Math.round((TODAY.getTime() - selectedDate.getTime()) / 86400000);
  const label = daysAgo === 0 ? "დღეს" : daysAgo === 1 ? "გუშინ" : `${daysAgo} დღის წინ`;

  return (
    <div className="w-full lg:max-w-lg max-w-xs mx-auto">
      <div className="rounded-2xl bg-[#21262c] border border-white/5 overflow-hidden shadow-2xl shadow-black/40">

        {/* Drums */}
        <div className="flex px-3 pt-3 gap-1" style={{ height: ITEM_H * 5 }}>
          {/* Day */}
          <Drum
            items={days.map(d => String(d).padStart(2, "0"))}
            selectedIndex={Math.min(day, daysInMonth) - 1}
            onSelect={i => setDay(i + 1)}
            disabledIndices={disabledDays}
          />
          <div className="flex items-center justify-center text-white/10 text-lg font-light pb-px">/</div>
          {/* Month */}
          <Drum
            items={MONTHS}
            selectedIndex={month}
            onSelect={i => setMonth(i)}
            disabledIndices={disabledMonths}
          />
          <div className="flex items-center justify-center text-white/10 text-lg font-light pb-px">/</div>
          {/* Year */}
          <Drum
            items={years.map(String)}
            selectedIndex={years.indexOf(year)}
            onSelect={i => setYear(years[i])}
          />
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-white/5 flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-[0.6rem] text-gray-600 uppercase tracking-widest">მონიშნული</span>
            <span className={`text-sm font-semibold ${isValid ? "text-gray-100" : "text-red-400"}`}>
              {isValid
                ? selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                : "Out of range"}
            </span>
            {isValid && <span className="text-[0.6rem] text-gray-500">{label}</span>}
          </div>

          <div className="flex items-center gap-2">
            {onClose && (
              <button
                onClick={onClose}
                className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:text-white hover:bg-white/10 transition-all duration-150"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
              </button>
            )}

            <button
              onClick={handleConfirm}
              disabled={!isValid}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
                isValid
                  ? "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20"
                  : "bg-white/5 text-white/20 cursor-not-allowed"
              }`}
            >
              Go
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
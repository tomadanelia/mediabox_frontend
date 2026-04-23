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

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

const MONTHS_DRUM   = ["იან","თებ","მარ","აპრ","მაი","ივნ","ივლ","აგვ","სექ","ოქტ","ნოე","დეკ"];
const MONTHS_FOOTER = ["იანვარი","თებერვალი","მარტი","აპრილი","მაისი","ივნისი","ივლისი","აგვისტო","სექტემბერი","ოქტომბერი","ნოემბერი","დეკემბერი"];
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
  const ref               = useRef<HTMLDivElement>(null);
  const hasMountedRef     = useRef(false);
  const lastScrolledIndex = useRef<number>(-1);

  useEffect(() => {
    const el = ref.current;
    if (!el || hasMountedRef.current) return;
    hasMountedRef.current = true;
    requestAnimationFrame(() => {
      el.scrollTop = selectedIndex * ITEM_H;
      lastScrolledIndex.current = selectedIndex;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hasMountedRef.current) return;
    if (selectedIndex === lastScrolledIndex.current) return;
    const el = ref.current;
    if (!el) return;
    lastScrolledIndex.current = selectedIndex;
    el.scrollTo({ top: selectedIndex * ITEM_H, behavior: 'smooth' });
  }, [selectedIndex]);

  const handleScroll = () => {
    const el = ref.current;
    if (!el) return;
    const i = Math.round(el.scrollTop / ITEM_H);
    const clamped = Math.max(0, Math.min(items.length - 1, i));
    if (clamped !== selectedIndex && !disabledIndices.has(clamped)) {
      lastScrolledIndex.current = clamped;
      onSelect(clamped);
    }
  };

  return (
    <div className="relative flex-1 flex flex-col items-center">
      {/* Fade top */}
      <div
        className="absolute top-0 left-0 right-0 z-10 pointer-events-none"
        style={{
          height: ITEM_H * 1.5,
          background: "linear-gradient(to bottom, var(--cal-bg) 0%, transparent 100%)",
        }}
      />
      {/* Fade bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none"
        style={{
          height: ITEM_H * 1.5,
          background: "linear-gradient(to top, var(--cal-bg) 0%, transparent 100%)",
        }}
      />

      {/* Selection highlight */}
      <div
        className="absolute left-1 right-1 top-1/2 -translate-y-1/2 z-10 pointer-events-none"
        style={{
          height: ITEM_H,
          borderRadius: 10,
          background: "rgba(220,38,38,0.1)",
          border: "1px solid rgba(220,38,38,0.25)",
        }}
      />

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
                isSelected
                  ? "text-black dark:text-white scale-110"
                  : "",
                isDisabled
                  ? "text-black/15 dark:text-white/10 cursor-not-allowed"
                  : !isSelected
                  ? "text-black/35 dark:text-white/35 hover:text-black/60 dark:hover:text-gray-300"
                  : "",
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

  const prevMonthRef  = useRef(month);
  const prevYearRef   = useRef(year);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevMonthRef.current  = month;
      prevYearRef.current   = year;
      return;
    }

    const prevDate  = new Date(prevYearRef.current, prevMonthRef.current, 1);
    const currDate  = new Date(year, month, 1);
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
      const lastDayOfMonth  = new Date(year, m + 1, 0); lastDayOfMonth.setHours(0,0,0,0);
      const firstDayOfMonth = new Date(year, m, 1);     firstDayOfMonth.setHours(0,0,0,0);
      if (lastDayOfMonth < MIN_DATE || firstDayOfMonth > TODAY) s.add(m);
    }
    return s;
  }, [year, MIN_DATE, TODAY]);

  const disabledDays = useMemo(() => {
    const s = new Set<number>();
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d); date.setHours(0,0,0,0);
      if (date < MIN_DATE || date > TODAY) s.add(d - 1);
    }
    return s;
  }, [year, month, daysInMonth, MIN_DATE, TODAY]);

  const handleConfirm = () => {
    if (!isValid) return;
    onSelect?.(selectedDate);
  };

  const daysAgo = Math.round((TODAY.getTime() - selectedDate.getTime()) / 86400000);
  const label   = daysAgo === 0 ? "დღეს" : daysAgo === 1 ? "გუშინ" : `${daysAgo} დღის წინ`;

  const footerDateStr = isValid
    ? `${selectedDate.getDate()} ${MONTHS_FOOTER[selectedDate.getMonth()]}, ${selectedDate.getFullYear()}`
    : "დიაპაზონის გარეთ";

  return (
    <>
      {/* CSS variable bridge for the drum fade gradient */}
      <style>{`
        .cal-wrap { --cal-bg: #ffffff; }
        .dark .cal-wrap { --cal-bg: #21262c; }
      `}</style>

      <div className="cal-wrap relative w-full max-w-xl mx-auto">

        <div className="rounded-2xl bg-white dark:bg-[#21262c] border border-black/10 dark:border-white/5 overflow-hidden shadow-2xl shadow-black/10 dark:shadow-black/40">

          {/* Close button — top-right corner, inside the card */}
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-3 right-3 z-20 w-7 h-7 rounded-lg
                bg-black/5 dark:bg-white/8
                text-black/40 dark:text-gray-400
                hover:text-black dark:hover:text-white
                hover:bg-black/10 dark:hover:bg-white/15
                flex items-center justify-center text-sm
                transition-all duration-150"
              aria-label="დახურვა"
            >
              ✕
            </button>
          )}

          {/* Drums */}
          <div className="flex px-4 pt-3 gap-1" style={{ height: ITEM_H * 5 }}>
            <Drum
              items={days.map(d => String(d).padStart(2, "0"))}
              selectedIndex={Math.min(day, daysInMonth) - 1}
              onSelect={i => setDay(i + 1)}
              disabledIndices={disabledDays}
            />
            <div className="flex items-center justify-center text-black/15 dark:text-white/10 text-lg font-light pb-px">/</div>
            <Drum
              items={MONTHS_DRUM}
              selectedIndex={month}
              onSelect={i => setMonth(i)}
              disabledIndices={disabledMonths}
            />
            <div className="flex items-center justify-center text-black/15 dark:text-white/10 text-lg font-light pb-px">/</div>
            <Drum
              items={years.map(String)}
              selectedIndex={years.indexOf(year)}
              onSelect={i => setYear(years[i])}
            />
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-black/8 dark:border-white/5 flex items-center justify-between gap-3">
            <div className="flex flex-col">
              <span className="text-[0.6rem] text-black/30 dark:text-gray-600 uppercase tracking-widest">მონიშნული</span>
              <span className={`text-sm font-semibold ${isValid ? "text-black/80 dark:text-gray-100" : "text-red-400"}`}>
                {footerDateStr}
              </span>
              {isValid && <span className="text-[0.6rem] text-black/35 dark:text-gray-500">{label}</span>}
            </div>

            <button
              onClick={handleConfirm}
              disabled={!isValid}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
                isValid
                  ? "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20"
                  : "bg-black/5 dark:bg-white/5 text-black/20 dark:text-white/20 cursor-not-allowed"
              }`}
            >
              Go
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
import { useState, useMemo } from "react";
import type { Channel } from "../../src/types/channel";

interface Category {
  id: string;
  name_en: string;
  name_ka: string;
  icon_url: string;
  channels_count?: number;
}

interface Props {
  channels: Channel[];
  channelsLoading: boolean;
  categories: Category[];
  catsLoading: boolean;
  onBulkAssign: (selectedUuids: string[], categoryId: string) => Promise<void>;
}

const IconSpinner = () => (
  <svg className="animate-spin" width="14" height="14" viewBox="0 0 14 14" fill="none">
    <circle cx="7" cy="7" r="6" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2"/>
    <path d="M7 1a6 6 0 016 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const IconCheck = () => (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 7l3.5 3.5L12 3"/>
  </svg>
);

export default function AdminCategoryChannelsSection({
  channels,
  channelsLoading,
  categories,
  catsLoading,
  onBulkAssign,
}: Props) {
  const [channelSearch, setChannelSearch] = useState("");
  const [selectedChannelUuids, setSelectedChannelUuids] = useState<string[]>([]);
  const [sortAlpha, setSortAlpha] = useState(false);
  // The category the admin is "viewing" — channels in this category are highlighted & grouped top
  const [activeCategoryId, setActiveCategoryId] = useState<string>("");

  // The category the admin wants to ASSIGN selected channels INTO (shown in modal)
  const [assignToCategoryId, setAssignToCategoryId] = useState<string>("");
  const [bulkAssignModal, setBulkAssignModal] = useState(false);
  const [bulkAssigning, setBulkAssigning] = useState(false);

  const activeCategory = categories.find(c => c.id === activeCategoryId) ?? null;

  const sortedFilteredChannels = useMemo(() => {
  const q = channelSearch.toLowerCase();
  const filtered = channels.filter(c => c.name.toLowerCase().includes(q));

  if (!activeCategoryId) {
    return sortAlpha ? [...filtered].sort((a, b) => a.name.localeCompare(b.name)) : filtered;
  }

  const inCategory = filtered.filter(c => c.category_id === activeCategoryId);
  const others = filtered.filter(c => c.category_id !== activeCategoryId);

  if (sortAlpha) {
    inCategory.sort((a, b) => a.name.localeCompare(b.name));
    others.sort((a, b) => a.name.localeCompare(b.name));
  }

  return [...inCategory, ...others];
}, [channels, channelSearch, activeCategoryId, sortAlpha]);

  const inCategoryCount = activeCategoryId
    ? channels.filter(c => c.category_id === activeCategoryId).length
    : 0;

  // Select / deselect
  const toggleSelect = (uuid: string) =>
    setSelectedChannelUuids(prev =>
      prev.includes(uuid) ? prev.filter(id => id !== uuid) : [...prev, uuid]
    );

  // Select all visible
  const allVisibleUuids = sortedFilteredChannels.map(c => c.uuid);
  const allSelected =
    allVisibleUuids.length > 0 &&
    allVisibleUuids.every(u => selectedChannelUuids.includes(u));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedChannelUuids(prev => prev.filter(u => !allVisibleUuids.includes(u)));
    } else {
      setSelectedChannelUuids(prev => {
        const set = new Set([...prev, ...allVisibleUuids]);
        return Array.from(set);
      });
    }
  };

  const handleOpenAssignModal = () => {
    setAssignToCategoryId("");
    setBulkAssignModal(true);
  };

  const handleConfirmAssign = async () => {
    if (!assignToCategoryId || !selectedChannelUuids.length) return;
    setBulkAssigning(true);
    try {
      await onBulkAssign(selectedChannelUuids, assignToCategoryId);
      setBulkAssignModal(false);
      setSelectedChannelUuids([]);
    } finally {
      setBulkAssigning(false);
    }
  };

  return (
    <div className="space-y-4">

      {/* ── Category picker row ── */}
      <div className="space-y-2">
        <p className="text-[0.65rem] text-zinc-500 uppercase tracking-widest">
          ჟანრის ფილტრი — აირჩიეთ ჟანრი არხების სანახავად
        </p>
        {catsLoading ? (
          <div className="flex items-center gap-2 text-zinc-500 text-xs py-2">
            <IconSpinner /><span>Loading categories…</span>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {/* "All" pill */}
            <button
              onClick={() => setActiveCategoryId("")}
              className={`cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                activeCategoryId === ""
                  ? "bg-zinc-100 text-zinc-900 border-zinc-100"
                  : "bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
              }`}
            >
              ყველა
            </button>

            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategoryId(prev => prev === cat.id ? "" : cat.id)}
                className={`cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                  activeCategoryId === cat.id
                    ? "bg-violet-600 text-white border-violet-500 shadow"
                    : "bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
                }`}
              >
                {cat.icon_url && (
                  <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                    {cat.icon_url}
                  </span>
                )}
                {cat.name_en}
                {activeCategoryId === cat.id && inCategoryCount > 0 && (
                  <span className="ml-0.5 bg-white/20 text-white text-[0.55rem] px-1.5 py-0.5 rounded-md">
                    {inCategoryCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Active category info bar */}
        {activeCategory && (
          <div className="flex items-center gap-2 bg-violet-500/5 border border-violet-500/20 rounded-xl px-4 py-2.5">
            <span className="w-2 h-2 rounded-full bg-violet-400 shrink-0" />
            <p className="text-xs text-violet-300 font-medium flex-1">
              <span className="font-bold">{activeCategory.name_en}</span>
              <span className="text-violet-400/70"> — ამ ჟანრის </span>
              <span className="font-bold text-violet-300">{inCategoryCount}</span>
              <span className="text-violet-400/70"> არხი დაჯგუფებულია სიის სათავეში</span>
            </p>
            <button
              onClick={() => setActiveCategoryId("")}
              className="cursor-pointer text-violet-500 hover:text-violet-300 transition-colors text-xs"
            >
              გასუფთავება ✕
            </button>
          </div>
        )}
      </div>

      {/* ── Search + selection bar ── */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Search channels…"
          value={channelSearch}
          onChange={e => setChannelSearch(e.target.value)}
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 focus:outline-none focus:border-zinc-600 transition-colors text-sm"
        />

        {/* Select all */}
        <button
          onClick={toggleSelectAll}
          disabled={sortedFilteredChannels.length === 0}
          className="cursor-pointer flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-xs font-medium px-3 py-2 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <div className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
            allSelected ? "border-violet-500 bg-violet-500" : "border-zinc-500"
          }`}>
            {allSelected && (
              <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1.5 5l2.5 2.5 4.5-4.5"/>
              </svg>
            )}
          </div>
          {allSelected ? "გაუქმება" : "ყველა"}
        </button>

        {/* Bulk assign button — shown when something is selected */}
        {selectedChannelUuids.length > 0 && (
          <button
            onClick={handleOpenAssignModal}
            className="cursor-pointer flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 transition-colors text-white text-xs font-medium px-4 py-2 rounded-xl"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span className="text-violet-200 font-bold">{selectedChannelUuids.length}</span> დამატება ჟანრში
          </button>
        )}

        {selectedChannelUuids.length > 0 && (
          <button
            onClick={() => setSelectedChannelUuids([])}
            className="cursor-pointer text-xs text-zinc-500 hover:text-zinc-300 px-2 py-2 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            გასუფთავება
          </button>
        )}
      </div>

      {/* ── Channel table ── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        {channelsLoading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-zinc-500 text-sm">
            <IconSpinner /><span>Loading…</span>
          </div>
        ) : sortedFilteredChannels.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-zinc-600 text-sm">
            არხები ვერ მოიძებნა
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-zinc-800/50 text-[0.6rem] uppercase tracking-widest text-zinc-500 sticky top-0">
              <tr>
                <th className="p-4 w-10">
                  {/* header checkbox */}
                  <div
                    onClick={toggleSelectAll}
                    className={`cursor-pointer w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                      allSelected ? "border-violet-500 bg-violet-500" : "border-zinc-600 hover:border-zinc-400"
                    }`}
                  >
                    {allSelected && (
                      <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1.5 5l2.5 2.5 4.5-4.5"/>
                      </svg>
                    )}
                  </div>
                </th>
                  <th className="p-4">
  <button
    onClick={() => setSortAlpha(v => !v)}
    className={`cursor-pointer flex items-center gap-1.5 uppercase tracking-widest text-[0.6rem] font-medium transition-colors ${
      sortAlpha ? "text-violet-400" : "text-zinc-500 hover:text-zinc-300"
    }`}
  >
    არხი
    <svg
      width="9" height="9" viewBox="0 0 10 12" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      className={`transition-opacity ${sortAlpha ? "opacity-100" : "opacity-40"}`}
    >
      <path d="M2 4l3-3 3 3M8 8l-3 3-3-3"/>
    </svg>
  </button>
</th>                <th className="p-4">UUID</th>
                <th className="p-4">ჟანრი</th>
              </tr>
            </thead>
            <tbody>
              {sortedFilteredChannels.map((c, idx) => {
                const isInActiveCategory = activeCategoryId && c.category_id === activeCategoryId;
                const isSelected = selectedChannelUuids.includes(c.uuid);
                // Show divider between "in category" group and "others"
                const showDivider =
                  activeCategoryId &&
                  idx === inCategoryCount &&
                  inCategoryCount > 0 &&
                  sortedFilteredChannels.length > inCategoryCount;

                return (
                  <>
                    {showDivider && (
                      <tr key={`divider-${c.uuid}`}>
                        <td colSpan={4} className="px-4 py-2 bg-zinc-800/30">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-px bg-zinc-700/60" />
                            <span className="text-[0.6rem] text-zinc-600 uppercase tracking-widest font-medium">
                              სხვა ჟანრები
                            </span>
                            <div className="flex-1 h-px bg-zinc-700/60" />
                          </div>
                        </td>
                      </tr>
                    )}
                    <tr
                      key={c.uuid}
                      onClick={() => toggleSelect(c.uuid)}
                      className={`border-t cursor-pointer transition-colors select-none ${
                        isSelected
                          ? "bg-violet-500/10 hover:bg-violet-500/15 border-zinc-800"
                          : isInActiveCategory
                          ? "bg-violet-500/5 hover:bg-violet-500/10 border-violet-500/10"
                          : "hover:bg-zinc-800/30 border-zinc-800"
                      }`}
                    >
                      <td className="p-4">
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                          isSelected
                            ? "border-violet-500 bg-violet-500"
                            : isInActiveCategory
                            ? "border-violet-500/40"
                            : "border-zinc-600"
                        }`}>
                          {isSelected && (
                            <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1.5 5l2.5 2.5 4.5-4.5"/>
                            </svg>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`relative shrink-0 ${isInActiveCategory ? "ring-1 ring-violet-500/40 ring-offset-1 ring-offset-zinc-900 rounded" : ""}`}>
                            <img
                              src={(c as any).logo}
                              className="w-8 h-8 rounded bg-zinc-800 object-contain"
                              onError={e => (e.currentTarget.style.display = "none")}
                            />
                          </div>
                          <div className="min-w-0">
                            <span className="text-zinc-200 text-sm">{c.name}</span>
                            {isInActiveCategory && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className="w-1 h-1 rounded-full bg-violet-400" />
                                <span className="text-[0.55rem] text-violet-400">ამ ჟანრში</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-[0.65rem] text-zinc-500 truncate max-w-40">{c.uuid}</td>
                      <td className="p-4">
                        {(c as any).category_ka ? (
                          <span className={`inline-block px-2 py-1 rounded-md text-xs font-medium ${
                            isInActiveCategory
                              ? "bg-violet-600/30 text-violet-200 ring-1 ring-violet-500/30"
                              : "bg-violet-600/20 text-violet-300"
                          }`}>
                            {(c as any).category_ka}
                          </span>
                        ) : (
                          <span className="text-[0.65rem] text-zinc-700">— უჟანრო</span>
                        )}
                      </td>
                    </tr>
                  </>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ══════════════════════════════════════════
          BULK ASSIGN MODAL
      ══════════════════════════════════════════ */}
      {bulkAssignModal && (
        <div
          className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) setBulkAssignModal(false); }}
        >
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-start">
              <div>
                <h3 className="font-bold text-zinc-100 text-base">დამატება ჟანრში</h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  მონიშნული{" "}
                  <span className="text-violet-400 font-semibold">{selectedChannelUuids.length}</span>{" "}
                  არხის დამატება
                </p>
              </div>
              <button
                onClick={() => setBulkAssignModal(false)}
                className="cursor-pointer w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-2 max-h-72 overflow-y-auto">
              {categories.map(cat => (
                <label
                  key={cat.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    assignToCategoryId === cat.id
                      ? "border-violet-500 bg-violet-500/10"
                      : "border-zinc-800 bg-zinc-800/30 hover:border-zinc-700 hover:bg-zinc-800/60"
                  }`}
                >
                  <input
                    type="radio"
                    name="bulkCat"
                    value={cat.id}
                    checked={assignToCategoryId === cat.id}
                    onChange={() => setAssignToCategoryId(cat.id)}
                    className="accent-violet-500"
                  />
                  <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                    {cat.icon_url
                      ? <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{cat.icon_url}</span>
                      : <span className="text-sm">📁</span>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-zinc-100 font-medium text-sm truncate">{cat.name_en}</p>
                    <p className="text-[0.6rem] text-zinc-500 truncate">{cat.name_ka}</p>
                  </div>
                  {assignToCategoryId === cat.id && (
                    <span className="text-violet-400 shrink-0"><IconCheck /></span>
                  )}
                </label>
              ))}
            </div>

            <div className="p-4 border-t border-zinc-800 flex gap-2 justify-end">
              <button
                onClick={() => setBulkAssignModal(false)}
                className="cursor-pointer px-4 py-2 rounded-xl text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
              >
                გაუქმება
              </button>
              <button
                onClick={handleConfirmAssign}
                disabled={!assignToCategoryId || bulkAssigning}
                className="cursor-pointer px-5 py-2 rounded-xl text-xs bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium transition-colors flex items-center gap-2"
              >
                {bulkAssigning ? <><IconSpinner />Assigning…</> : "OK — Assign"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
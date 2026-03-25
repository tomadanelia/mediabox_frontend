import { useEffect, useState, useRef } from 'react'
import api from '../../src/lib/axios'

interface TvDevice {
  device_id: string
  device_name?: string
}

interface TvDeviceInfo {
  tv_limit: number
  active_count: number
  slots_remaining: number
  devices: TvDevice[]
}

const TvDeviceAddon = ({
  tx,
  extraDevices,
  setExtraDevices,
  isAuthenticated,
  navigate,
  DEFAULT_TV_DEVICES,
  TV_DEVICE_PRICE,
  MAX_TV_DEVICES,
  onPriceLoaded,
}: {
  tx: any
  extraDevices: number
  setExtraDevices: (n: number) => void
  isAuthenticated: boolean
  navigate: (path: string) => void
  TV_DEVICE_PRICE: number
  DEFAULT_TV_DEVICES: number
  MAX_TV_DEVICES: number
  /** Called when the real price is fetched from the server */
  onPriceLoaded?: (price: number) => void
}) => {
  // ── state ──────────────────────────────────────────────────────────────────
  const [deviceInfo, setDeviceInfo] = useState<TvDeviceInfo | null>(null)
  const [loadingInfo, setLoadingInfo] = useState(false)
  const [pricePerDevice, setPricePerDevice] = useState<number>(TV_DEVICE_PRICE)

  const [showPopup, setShowPopup] = useState(false)

  // per-device UI states
  const [freeing, setFreeing] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [savingName, setSavingName] = useState<string | null>(null)
  const [deviceErrors, setDeviceErrors] = useState<Record<string, string>>({})

  const editRef = useRef<HTMLInputElement>(null)

  // ── fetch device info ──────────────────────────────────────────────────────
  const fetchDeviceInfo = async () => {
    if (!isAuthenticated) return
    setLoadingInfo(true)
    try {
      const res = await api.get('/api/tv/logged-in/devices')
      setDeviceInfo(res.data)
    } catch {
      // silently fail – don't block the plans page
    } finally {
      setLoadingInfo(false)
    }
  }

  // ── fetch price ────────────────────────────────────────────────────────────
  const fetchPrice = async () => {
    try {
      const res = await api.get('/api/settings/tv-price')
      const price = parseFloat(res.data.extra_tv_price)
      if (!isNaN(price)) {
        setPricePerDevice(price)
        onPriceLoaded?.(price)
      }
    } catch {
      // keep default
    }
  }

  useEffect(() => {
    fetchPrice()
    if (isAuthenticated) fetchDeviceInfo()
  }, [isAuthenticated])

  // ── free a device slot ─────────────────────────────────────────────────────
  const handleFreeDevice = async (device_id: string) => {
    setFreeing(device_id)
    setDeviceErrors(prev => ({ ...prev, [device_id]: '' }))
    try {
      await api.post('/api/tv/free/device-slots', { device_id })
      await fetchDeviceInfo()
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to free slot'
      setDeviceErrors(prev => ({ ...prev, [device_id]: msg }))
    } finally {
      setFreeing(null)
    }
  }

  // ── save device name ───────────────────────────────────────────────────────
  const handleSaveName = async (device_id: string) => {
    if (!editName.trim()) { setEditingId(null); return }
    setSavingName(device_id)
    try {
      await api.post('/api/tv/device-name', { device_id, device_name: editName.trim() })
      setDeviceInfo(prev =>
        prev
          ? {
              ...prev,
              devices: prev.devices.map(d =>
                d.device_id === device_id ? { ...d, device_name: editName.trim() } : d
              ),
            }
          : prev
      )
      setEditingId(null)
    } catch {
      // ignore
    } finally {
      setSavingName(null)
    }
  }

  // ── derived ────────────────────────────────────────────────────────────────
  const currentDefaultLimit = DEFAULT_TV_DEVICES
  const newLimit = currentDefaultLimit + extraDevices
  const totalFee = extraDevices * pricePerDevice

  const activeCount = deviceInfo?.active_count ?? 0
  const tvLimit = deviceInfo?.tv_limit ?? currentDefaultLimit

  // ── popup focus ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (editingId && editRef.current) editRef.current.focus()
  }, [editingId])

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="mb-6 relative">
        {/* Subtle top accent line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />

        <div
          className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-transparent to-amber-600/5 overflow-hidden"
          style={{ boxShadow: '0 0 40px rgba(245,158,11,0.06), inset 0 1px 0 rgba(245,158,11,0.1)' }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center gap-6 p-5 sm:p-6">

            {/* Left: Icon + Text */}
            <div className="flex items-start gap-4 flex-1 min-w-0">
              {/* Icon box */}
              <div className="shrink-0 w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="2" y="3" width="20" height="14" rx="2" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M8 21h8M12 17v4" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-500/80">{tx.tvAddonLabel}</span>
                </div>
                <h3 className="text-sm font-semibold text-foreground">{tx.tvAddonTitle}</h3>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{tx.tvAddonSubtitle}</p>

                {/* Limit + active device count */}
                <div className="flex items-center gap-3 mt-3 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">{tx.tvAddonCurrentLimit}:</span>
                    <span className="text-xs font-semibold text-foreground tabular-nums">
                      {loadingInfo ? '…' : tvLimit}
                    </span>
                  </div>

                  {extraDevices > 0 && (
                    <>
                      <svg className="w-3 h-3 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">{tx.tvAddonNewLimit}:</span>
                        <span className="text-xs font-bold text-amber-400 tabular-nums">{tvLimit + extraDevices}</span>
                      </div>
                    </>
                  )}

                  {/* Active device badge — clickable to open popup */}
                  {isAuthenticated && deviceInfo && (
                    <button
                      onClick={() => setShowPopup(true)}
                      className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-colors cursor-pointer"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      <span className="text-[11px] font-semibold text-amber-400 tabular-nums">
                        {activeCount}/{tvLimit}
                      </span>
                      <span className="text-[11px] text-amber-500/70">{tx.tvAddonActiveDevices ?? 'active'}</span>
                      <svg className="w-3 h-3 text-amber-500/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Price + Counter */}
            <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-start sm:items-center lg:items-end xl:items-center gap-4 lg:gap-3 shrink-0">

              {/* Price badge */}
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-amber-400 tabular-nums">{pricePerDevice}</span>
                <span className="text-sm text-amber-400">₾</span>
                <span className="text-xs text-muted-foreground ml-0.5">/ {tx.tvAddonPricePerDevice}</span>
              </div>

              {/* Stepper */}
              <div className="flex items-center gap-0 rounded-xl border border-plans-divider bg-plans-card-bg overflow-hidden">
                <button
                  onClick={() => setExtraDevices(Math.max(0, extraDevices - 1))}
                  disabled={extraDevices === 0}
                  className="w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-plans-skeleton-bg transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  aria-label="Remove device"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14" />
                  </svg>
                </button>

                <div className="w-10 h-9 flex items-center justify-center border-x border-plans-divider">
                  <span className="text-sm font-bold text-foreground tabular-nums">{extraDevices}</span>
                </div>

                <button
                  onClick={() => setExtraDevices(Math.min(MAX_TV_DEVICES, extraDevices + 1))}
                  disabled={extraDevices === MAX_TV_DEVICES}
                  className="w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  aria-label="Add device"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 5v14M5 12h14" />
                  </svg>
                </button>
              </div>

              {/* Fee summary pill */}
              {extraDevices > 0 ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <span className="text-xs text-amber-400 font-semibold tabular-nums">
                    +{totalFee.toFixed(2)} ₾
                  </span>
                  <span className="text-xs text-amber-500/60">·</span>
                  <span className="text-xs text-amber-500/80">{tx.tvAddonDevices(extraDevices)}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-plans-skeleton-bg border border-plans-divider">
                  <span className="text-xs text-muted-foreground">{tx.tvAddonIncluded}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Device Management Popup ────────────────────────────────────────── */}
      {showPopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowPopup(false)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl border border-amber-500/25 bg-auth-card-bg shadow-2xl overflow-hidden"
            style={{ boxShadow: '0 0 0 1px rgba(245,158,11,0.15), 0 24px 64px rgba(0,0,0,0.45)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Accent top line */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-plans-divider">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="2" y="3" width="20" height="14" rx="2" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M8 21h8M12 17v4" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-sm font-bold text-foreground">{tx.tvAddonTitle}</h2>
                  {deviceInfo && (
                    <p className="text-xs text-muted-foreground">
                      {activeCount} {tx.tvAddonActiveDevices ?? 'active'} · {tx.tvAddonCurrentLimit}: {tvLimit}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowPopup(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-plans-skeleton-bg hover:text-foreground transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="p-5 max-h-[60vh] overflow-y-auto">

              {loadingInfo ? (
                <div className="flex items-center justify-center py-10 gap-3">
                  <span className="w-5 h-5 border-2 border-amber-500/30 border-t-amber-400 rounded-full animate-spin" />
                  <span className="text-sm text-muted-foreground">Loading…</span>
                </div>
              ) : !deviceInfo || deviceInfo.devices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <div className="w-12 h-12 rounded-xl bg-plans-skeleton-bg border border-plans-divider flex items-center justify-center mb-1">
                    <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="2" y="3" width="20" height="14" rx="2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M8 21h8M12 17v4" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </div>
                  <p className="text-sm text-muted-foreground">{tx.tvAddonNoDevices ?? 'No active devices'}</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {deviceInfo.devices.map((device) => {
                    const label = device.device_name || device.device_id
                    const isEditing = editingId === device.device_id
                    const isFreeing = freeing === device.device_id
                    const isSaving = savingName === device.device_id
                    const err = deviceErrors[device.device_id]

                    return (
                      <li
                        key={device.device_id}
                        className="rounded-xl border border-plans-divider bg-plans-card-bg overflow-hidden transition-all"
                      >
                        <div className="flex items-center gap-3 px-4 py-3">
                          {/* Device icon */}
                          <div className="shrink-0 w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/15 flex items-center justify-center">
                            <svg className="w-4 h-4 text-amber-400/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <rect x="2" y="3" width="20" height="14" rx="2" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                              <path d="M8 21h8M12 17v4" strokeWidth="1.8" strokeLinecap="round" />
                            </svg>
                          </div>

                          {/* Name / edit input */}
                          <div className="flex-1 min-w-0">
                            {isEditing ? (
                              <input
                                ref={editRef}
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') handleSaveName(device.device_id)
                                  if (e.key === 'Escape') setEditingId(null)
                                }}
                                placeholder={device.device_id}
                                className="w-full rounded-lg bg-plans-skeleton-bg border border-amber-500/30 focus:border-amber-400 px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none transition-colors"
                              />
                            ) : (
                              <div>
                                <p className="text-sm font-medium text-foreground truncate">{label}</p>
                                {device.device_name && (
                                  <p className="text-xs text-muted-foreground truncate">{device.device_id}</p>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Action buttons */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {isEditing ? (
                              <>
                                <button
                                  onClick={() => handleSaveName(device.device_id)}
                                  disabled={isSaving}
                                  className="h-7 px-2.5 rounded-lg text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/25 hover:bg-amber-500/25 transition-colors disabled:opacity-50 cursor-pointer"
                                >
                                  {isSaving ? (
                                    <span className="w-3 h-3 border border-amber-400/40 border-t-amber-400 rounded-full animate-spin inline-block" />
                                  ) : (
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </button>
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="h-7 px-2.5 rounded-lg text-xs bg-plans-skeleton-bg text-muted-foreground border border-plans-divider hover:text-foreground transition-colors cursor-pointer"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </>
                            ) : (
                              <>
                                {/* Rename button */}
                                <button
                                  onClick={() => { setEditingId(device.device_id); setEditName(device.device_name || '') }}
                                  title={tx.tvAddonRename ?? 'Rename'}
                                  className="h-7 px-2.5 rounded-lg text-xs bg-plans-skeleton-bg text-muted-foreground border border-plans-divider hover:text-foreground hover:border-amber-500/30 transition-colors cursor-pointer"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>

                                {/* Free / logout button */}
                                <button
                                  onClick={() => handleFreeDevice(device.device_id)}
                                  disabled={isFreeing}
                                  title={tx.tvAddonFreeSlot ?? 'Free slot'}
                                  className="h-7 px-2.5 rounded-lg text-xs bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors disabled:opacity-50 cursor-pointer"
                                >
                                  {isFreeing ? (
                                    <span className="w-3 h-3 border border-red-400/40 border-t-red-400 rounded-full animate-spin inline-block" />
                                  ) : (
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                  )}
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Inline error */}
                        {err && (
                          <div className="px-4 pb-3">
                            <p className="text-xs text-red-400">{err}</p>
                          </div>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}

              {/* Slots info bar */}
              {deviceInfo && (
                <div className="mt-4 flex items-center justify-between px-4 py-3 rounded-xl bg-plans-skeleton-bg border border-plans-divider">
                  <span className="text-xs text-muted-foreground">{tx.tvAddonSlotsRemaining ?? 'Slots remaining'}</span>
                  <span className={`text-xs font-bold tabular-nums ${deviceInfo.slots_remaining <= 0 ? 'text-red-400' : 'text-amber-400'}`}>
                    {deviceInfo.slots_remaining}
                  </span>
                </div>
              )}
            </div>

            {/* Footer hint */}
            <div className="px-5 pb-5 pt-1">
              <p className="text-xs text-center text-muted-foreground leading-relaxed">
                {tx.tvAddonPopupHint ?? 'Free a slot to allow a new device to connect, or rename devices for easy identification.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default TvDeviceAddon

const TvDeviceAddon = ({
  tx,
  extraDevices,
  setExtraDevices,
  isAuthenticated,
  navigate,
  DEFAULT_TV_DEVICES,
  TV_DEVICE_PRICE,
  MAX_TV_DEVICES
}: {
  tx: any
  extraDevices: number
  setExtraDevices: (n: number) => void
  isAuthenticated: boolean
  navigate: (path: string) => void
  TV_DEVICE_PRICE: number
  DEFAULT_TV_DEVICES: number
  MAX_TV_DEVICES:number
}) => {
  const currentDefaultLimit = DEFAULT_TV_DEVICES
  const newLimit = currentDefaultLimit + extraDevices
  const totalFee = extraDevices * TV_DEVICE_PRICE

  return (
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

              {/* Limit display */}
              <div className="flex items-center gap-3 mt-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">{tx.tvAddonCurrentLimit}:</span>
                  <span className="text-xs font-semibold text-foreground tabular-nums">
                    {currentDefaultLimit}
                  </span>
                </div>
                {extraDevices > 0 && (
                  <>
                    <svg className="w-3 h-3 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">{tx.tvAddonNewLimit}:</span>
                      <span className="text-xs font-bold text-amber-400 tabular-nums">{newLimit}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right: Price + Counter */}
          <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-start sm:items-center lg:items-end xl:items-center gap-4 lg:gap-3 shrink-0">

            {/* Price badge */}
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-amber-400 tabular-nums">{TV_DEVICE_PRICE}</span>
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
  )
}
export default TvDeviceAddon;
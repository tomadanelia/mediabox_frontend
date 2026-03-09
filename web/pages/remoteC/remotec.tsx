'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Maximize2, Minimize2, Tv2, RefreshCw, WifiOff, Wifi, ChevronDown } from 'lucide-react'
import api from '@/lib/axios'

// ─── Install deps: npm install laravel-echo pusher-js ─────────────────────
// Echo is booted lazily on first connect so SSR / non-browser envs are safe.

/* ─── Types ───────────────────────────────────────────────────────────────── */
interface Device {
  device_id: string
  name: string
  is_ready: boolean
  channel: string
}

type ConnectionStatus =
  | 'idle'
  | 'fetching'
  | 'not_ready'
  | 'connecting'
  | 'connected'
  | 'error'

/* ─── Key map: button id → whisper key string ─────────────────────────────── */
const KEY_MAP: Record<string, string> = {
  // Navigation — Android KeyEvent constants (as requested)
  up:     'KEYCODE_DPAD_UP',
  down:   'KEYCODE_DPAD_DOWN',
  left:   'KEYCODE_DPAD_LEFT',
  right:  'KEYCODE_DPAD_RIGHT',
  ok:     'KEYCODE_DPAD_CENTER',  // also doubles as KEYCODE_ENTER for confirm
  back:   'KEYCODE_BACK',

  // Media
  play:   'KEYCODE_MEDIA_PLAY_PAUSE',
  rew:    'KEYCODE_MEDIA_REWIND',
  fwd:    'KEYCODE_MEDIA_FAST_FORWARD',
  mute:   'KEYCODE_VOLUME_MUTE',
  'vol+': 'KEYCODE_VOLUME_UP',
  'vol-': 'KEYCODE_VOLUME_DOWN',

  // TV
  'ch+':  'KEYCODE_CHANNEL_UP',
  'ch-':  'KEYCODE_CHANNEL_DOWN',
  home:   'KEYCODE_HOME',
  power:  'KEYCODE_POWER',

  // Numpad
  num0:'KEYCODE_0', num1:'KEYCODE_1', num2:'KEYCODE_2',
  num3:'KEYCODE_3', num4:'KEYCODE_4', num5:'KEYCODE_5',
  num6:'KEYCODE_6', num7:'KEYCODE_7', num8:'KEYCODE_8',
  num9:'KEYCODE_9',

  // Quick shortcuts — no standard keycode; handled custom on TV side
  sc0:'KEYCODE_SHORTCUT_1', sc1:'KEYCODE_SHORTCUT_2',
  sc2:'KEYCODE_SHORTCUT_3', sc3:'KEYCODE_SHORTCUT_4',
}

/* ─── Press feedback hook ─────────────────────────────────────────────────── */
function usePress() {
  const [pressed, setPressed] = useState<string | null>(null)
  const press = useCallback((id: string) => {
    setPressed(id)
    setTimeout(() => setPressed(null), 160)
  }, [])
  return { pressed, press }
}

/* ─── Haptic hint ─────────────────────────────────────────────────────────── */
function haptic(ms = 18) {
  try { navigator.vibrate?.(ms) } catch {}
}

/* ─── Ripple button ───────────────────────────────────────────────────────── */
interface BtnProps {
  id: string
  children: React.ReactNode
  bg?: string
  color?: string
  w?: string | number
  h?: number
  radius?: number
  fontSize?: number
  glow?: string
  title?: string
  pressed: string | null
  onPress: (id: string) => void
  className?: string
  style?: React.CSSProperties
  disabled?: boolean
}

function Btn({
  id, children, bg = '#e2e8f0', color = '#334155',
  w = '100%', h = 44, radius = 22, fontSize = 14,
  glow = '', title = '', pressed, onPress, style: extraStyle,
  disabled = false,
}: BtnProps) {
  const isPressed = pressed === id
  const rippleRef = useRef<HTMLSpanElement>(null)

  const handlePointerDown = (_e: React.PointerEvent) => {
    if (disabled) return
    haptic()
    onPress(id)
    if (rippleRef.current) {
      const el = rippleRef.current
      el.style.animation = 'none'
      void el.offsetWidth
      el.style.animation = 'ripple 0.45s ease-out forwards'
    }
  }

  return (
    <button
      title={title}
      onPointerDown={handlePointerDown}
      disabled={disabled}
      style={{
        position: 'relative', overflow: 'hidden',
        width: w, height: h, borderRadius: radius,
        background: bg, color,
        border: 'none', fontSize, fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
        boxShadow: isPressed
          ? 'inset 0 3px 12px rgba(0,0,0,0.2)'
          : glow
            ? `0 6px 18px ${glow}, 0 2px 5px rgba(0,0,0,0.1)`
            : '0 3px 8px rgba(0,0,0,0.09), 0 1px 2px rgba(0,0,0,0.05)',
        transform: isPressed ? 'scale(0.93)' : 'scale(1)',
        transition: 'all 0.13s cubic-bezier(.4,0,.2,1)',
        fontFamily: "'Nunito', 'Segoe UI', sans-serif",
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation',
        ...extraStyle,
      }}
    >
      <span
        ref={rippleRef}
        style={{
          position: 'absolute', width: 80, height: 80, borderRadius: '50%',
          background: 'rgba(255,255,255,0.35)',
          top: '50%', left: '50%',
          transform: 'translate(-50%,-50%) scale(0)',
          pointerEvents: 'none',
        }}
      />
      {children}
    </button>
  )
}

/* ─── D-pad ring ──────────────────────────────────────────────────────────── */
function DPad({ pressed, onPress, disabled }: { pressed: string | null; onPress: (id: string) => void; disabled?: boolean }) {
  const size = 148

  const Arrow = ({ id, label, style }: { id: string; label: string; style: React.CSSProperties }) => (
    <button
      title={id}
      disabled={disabled}
      onPointerDown={() => { if (disabled) return; haptic(12); onPress(id) }}
      style={{
        position: 'absolute', width: 40, height: 40, borderRadius: '50%',
        background: 'transparent', border: 'none',
        color: pressed === id ? '#334155' : '#94a3b8',
        fontSize: 13, cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'color 0.1s',
        fontFamily: "'Nunito','Segoe UI',sans-serif",
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation',
        ...style,
      }}
    >{label}</button>
  )

  return (
    <div style={{ position: 'relative', width: size, height: size, margin: '0 auto', flexShrink: 0 }}>
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: 'linear-gradient(145deg, #e8edf4, #dde3ec)',
        boxShadow: '0 6px 24px rgba(100,116,139,0.22), inset 0 1px 0 rgba(255,255,255,0.85)',
      }} />
      <div style={{
        position: 'absolute', top: 24, left: 24, right: 24, bottom: 24,
        borderRadius: '50%', background: '#f8fafc',
        boxShadow: '0 2px 10px rgba(100,116,139,0.18), inset 0 1px 0 rgba(255,255,255,0.95)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Btn id="ok" title="OK / Select"
          bg="linear-gradient(135deg,#6366f1,#8b5cf6)" color="#fff"
          w={46} h={46} radius={23} fontSize={12}
          glow="rgba(99,102,241,0.4)"
          pressed={pressed} onPress={onPress}
          disabled={disabled}
        >OK</Btn>
      </div>
      <Arrow id="up"    label="▲" style={{ top: 5,     left: '50%', transform: 'translateX(-50%)' }} />
      <Arrow id="down"  label="▼" style={{ bottom: 5,  left: '50%', transform: 'translateX(-50%)' }} />
      <Arrow id="left"  label="◀" style={{ top: '50%', left: 5,     transform: 'translateY(-50%)' }} />
      <Arrow id="right" label="▶" style={{ top: '50%', right: 5,    transform: 'translateY(-50%)' }} />
    </div>
  )
}

/* ─── Fullscreen hook ─────────────────────────────────────────────────────── */
function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  const request = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen({ navigationUI: 'hide' })
        try { await (screen.orientation as any).lock('portrait') } catch {}
      } else {
        await document.exitFullscreen()
        try { screen.orientation.unlock() } catch {}
      }
    } catch (e) {
      console.warn('Fullscreen not supported:', e)
    }
  }, [])

  return { isFullscreen, request }
}

/* ─── Label map ───────────────────────────────────────────────────────────── */
const LABELS: Record<string, string> = {
  power: 'Power', ok: 'Select', up: 'Up', down: 'Down', left: 'Left', right: 'Right',
  play: 'Play / Pause', rew: 'Rewind', fwd: 'Fast-Forward',
  'vol+': 'Volume ▲', 'vol-': 'Volume ▼', 'ch+': 'Channel ▲', 'ch-': 'Channel ▼',
  mute: 'Mute', home: 'Home', back: 'Back',
  num0:'0',num1:'1',num2:'2',num3:'3',num4:'4',num5:'5',num6:'6',num7:'7',num8:'8',num9:'9',
  sc0:'Quick CH 1', sc1:'Quick CH 2', sc2:'Quick CH 3', sc3:'Quick CH 4',
}

/* ─── Status badge styles ─────────────────────────────────────────────────── */
const STATUS_STYLE: Record<ConnectionStatus, { bg: string; color: string; label: string }> = {
  idle:       { bg: '#e2e8f0', color: '#64748b', label: 'Not connected' },
  fetching:   { bg: '#dbeafe', color: '#2563eb', label: 'Finding devices…' },
  not_ready:  { bg: '#fef9c3', color: '#ca8a04', label: 'TV app not ready' },
  connecting: { bg: '#e0e7ff', color: '#6366f1', label: 'Connecting…' },
  connected:  { bg: '#dcfce7', color: '#16a34a', label: 'Connected' },
  error:      { bg: '#fee2e2', color: '#dc2626', label: 'Error' },
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
export default function RemotePage() {
  const { pressed, press } = usePress()
  const { isFullscreen, request: toggleFullscreen } = useFullscreen()

  // ── Connection state ────────────────────────────────────────────────────
  const [status, setStatus]                 = useState<ConnectionStatus>('idle')
  const [devices, setDevices]               = useState<Device[]>([])
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [errorMsg, setErrorMsg]             = useState<string | null>(null)
  const [showDevicePicker, setShowDevicePicker] = useState(false)

  // Stable refs for Echo instance and the active private channel
  const echoRef    = useRef<any>(null)
  const channelRef = useRef<any>(null)

  // ── UI feedback ─────────────────────────────────────────────────────────
  const [lastAction, setLastAction] = useState<string | null>(null)
  const actionTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Token helper ────────────────────────────────────────────────────────
  const getToken = (): string | null =>
    localStorage.getItem('token') ?? localStorage.getItem('access_token')

  // ── Boot Echo once (lazy) ───────────────────────────────────────────────
  const bootEcho = useCallback(async (): Promise<any> => {
     console.log("--- Initializing Echo ---");
    console.log("Host:", import.meta.env.VITE_REVERB_HOST);
    console.log("Key:", import.meta.env.VITE_REVERB_APP_KEY);
    if (echoRef.current) return echoRef.current

    const token = getToken()

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore – laravel-echo types may not be installed
    const [{ default: Echo }, pusherModule] = await Promise.all([
      // @ts-ignore
      import('laravel-echo'),
      // @ts-ignore
      import('pusher-js'),
    ])

    // Make Pusher globally available (required by Echo internals)
    ;(window as any).Pusher = pusherModule.default ?? pusherModule

    echoRef.current = new Echo({
      broadcaster:       'reverb',
      key:               import.meta.env.VITE_REVERB_APP_KEY,
      wsHost:            import.meta.env.VITE_REVERB_HOST,
      wsPort:            443,
      wssPort:           443,
      forceTLS:          true,
      enabledTransports: ['ws', 'wss'],
      authEndpoint:      '/api/broadcasting/auth',
      auth: {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
          Accept: 'application/json',
        },
      },
    })
    
    return echoRef.current
  }, [])

  // ── Connect to a specific device channel ───────────────────────────────
 const connectToDevice = useCallback(async (device: Device) => {
    console.log("Attempting to connect to device:", device.name);
    console.log("Channel Name:", device.channel);
    
    setStatus('connecting');
    try {
      const echo = await bootEcho();

      // Echo.private(name) results in 'private-name'
      const ch = echo.private(device.channel);
      channelRef.current = ch;

      console.log("Subscribing to channel...");

      ch.subscribed(() => {
        console.log("SUCCESS: Fully subscribed to channel!");
        setStatus('connected');
      });

      // If this fires, your 'routes/channels.php' is returning false or 403
      ch.error((err: any) => {
        console.error("CHANNEL AUTH ERROR:", err);
        setStatus('error');
      });
      
    } catch (e: any) {
      console.error("ConnectToDevice Crash:", e);
      setStatus('error');
    }
}, [bootEcho]);
  // ── Fetch available devices ─────────────────────────────────────────────
  const fetchDevices = useCallback(async () => {
    setStatus('fetching')
    setErrorMsg(null)
    try {
      const res = await api.get("/api/user/devices");
      const data: Device[] =  res.data;
      setDevices(data)

      const ready = data.filter(d => d.is_ready)
      if (ready.length === 0) {
        setStatus('not_ready')
        return
      }

      if (ready.length === 1) {
        // Auto-connect if exactly one TV is ready
        await connectToDevice(ready[0])
      } else {
        // Let user pick from multiple ready devices
        setStatus('not_ready') // hold state until user picks
        setShowDevicePicker(true)
      }
    } catch (e: any) {
      setStatus('error')
      setErrorMsg(e?.message ?? 'Failed to fetch devices')
    }
  }, [connectToDevice])

  // ── Cleanup on unmount ──────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (echoRef.current && channelRef.current) {
        try { echoRef.current.leave(channelRef.current.name ?? '') } catch {}
      }
    }
  }, [])

  // ── Whisper a keypress event ────────────────────────────────────────────
  const whisperKey = useCallback((buttonId: string) => {
    if (status !== 'connected' || !channelRef.current) return
    const key = KEY_MAP[buttonId]
    if (!key) return
    // Client event — bypasses backend, goes directly to TV via Reverb
    channelRef.current.whisper('keypress', { key })
  }, [status])

  // ── Handle button press: feedback + whisper ─────────────────────────────
  const handlePress = useCallback((id: string) => {
    press(id)
    setLastAction(id)
    if (actionTimer.current) clearTimeout(actionTimer.current)
    actionTimer.current = setTimeout(() => setLastAction(null), 1800)
    whisperKey(id)
  }, [press, whisperKey])

  const buttonsDisabled = status !== 'connected'
  const statusStyle = STATUS_STYLE[status]

  const B = (props: Omit<BtnProps, 'pressed' | 'onPress'>) => (
    <Btn {...props} pressed={pressed} onPress={handlePress} disabled={props.disabled ?? buttonsDisabled} />
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        body { margin: 0; background: #f0f4f8; }
        @keyframes ripple  { to { transform: translate(-50%,-50%) scale(2.5); opacity: 0; } }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeOut { 0%,60% { opacity:1; } 100% { opacity:0; } }
        @keyframes spin    { to { transform: rotate(360deg); } }
      `}</style>

      <div style={{
        minHeight: '100svh',
        background: 'linear-gradient(160deg, #f0f4f8 0%, #e8eef6 50%, #eef2f9 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        fontFamily: "'Nunito','Segoe UI',sans-serif",
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>

        {/* ── Top bar ── */}
        <div style={{
          width: '100%', maxWidth: 480,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px 8px',
          paddingTop: 'max(16px, env(safe-area-inset-top))',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Tv2 size={18} color="#6366f1" strokeWidth={2.5} />
            <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.02em', color: '#1e293b' }}>
              Stream<span style={{ color: '#6366f1' }}>Kit</span>
            </span>
          </div>

          {/* Feedback pill */}
          <div style={{ flex: 1, textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em', padding: '0 8px' }}>
            {lastAction && (
              <span key={lastAction} style={{
                display: 'inline-block',
                animation: 'fadeUp 0.2s ease, fadeOut 1.8s 0.1s forwards',
                background: 'rgba(99,102,241,0.1)',
                color: '#6366f1', padding: '3px 10px', borderRadius: 12, fontSize: 11,
              }}>
                {LABELS[lastAction] ?? lastAction}
              </span>
            )}
          </div>

          {/* Fullscreen toggle */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit fullscreen' : 'Request fullscreen'}
            style={{
              width: 34, height: 34, borderRadius: 12,
              background: isFullscreen ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : '#e2e8f0',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: isFullscreen ? '0 4px 12px rgba(99,102,241,0.4)' : '0 2px 5px rgba(0,0,0,0.08)',
              transition: 'all 0.2s',
            }}
          >
            {isFullscreen
              ? <Minimize2 size={14} color="#fff" strokeWidth={2.5} />
              : <Maximize2 size={14} color="#64748b" strokeWidth={2.5} />
            }
          </button>
        </div>

        {/* ── Connection bar ── */}
        <div style={{ width: '100%', maxWidth: 480, padding: '0 20px 10px', display: 'flex', flexDirection: 'column', gap: 8 }}>

          {/* Status row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 12px', borderRadius: 20,
              background: statusStyle.bg, color: statusStyle.color,
              fontSize: 11, fontWeight: 700, letterSpacing: '0.04em',
              flex: 1, transition: 'background 0.3s, color 0.3s',
            }}>
              {(status === 'fetching' || status === 'connecting')
                ? <RefreshCw size={11} strokeWidth={2.5} style={{ animation: 'spin 1s linear infinite' }} />
                : status === 'connected'
                ? <Wifi size={11} strokeWidth={2.5} />
                : <WifiOff size={11} strokeWidth={2.5} />
              }
              <span>{statusStyle.label}</span>
              {selectedDevice && status === 'connected' && (
                <span style={{ marginLeft: 4, opacity: 0.65 }}>· {selectedDevice.name}</span>
              )}
            </div>

            <button
              onClick={fetchDevices}
              disabled={status === 'fetching' || status === 'connecting'}
              style={{
                height: 30, padding: '0 14px', borderRadius: 15,
                background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                border: 'none', color: '#fff',
                fontSize: 11, fontWeight: 700,
                cursor: (status === 'fetching' || status === 'connecting') ? 'not-allowed' : 'pointer',
                opacity: (status === 'fetching' || status === 'connecting') ? 0.55 : 1,
                display: 'flex', alignItems: 'center', gap: 5,
                boxShadow: '0 4px 10px rgba(99,102,241,0.35)',
                WebkitTapHighlightColor: 'transparent',
                transition: 'opacity 0.2s',
              }}
            >
              <RefreshCw size={11} strokeWidth={2.5} />
              {status === 'idle' ? 'Connect' : 'Refresh'}
            </button>
          </div>

          {/* TV not ready hint */}
          {status === 'not_ready' && !showDevicePicker && (
            <div style={{
              padding: '10px 14px', borderRadius: 12,
              background: '#fffbeb', border: '1px solid #fde68a',
              fontSize: 12, color: '#92400e', lineHeight: 1.55,
            }}>
              📺 Open the <strong>Remote</strong> feature in your TV App first, then tap <strong>Refresh</strong>.
            </div>
          )}

          {/* Error hint */}
          {status === 'error' && errorMsg && (
            <div style={{
              padding: '10px 14px', borderRadius: 12,
              background: '#fff1f2', border: '1px solid #fecdd3',
              fontSize: 12, color: '#9f1239', lineHeight: 1.55,
            }}>
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Device picker (multiple ready TVs) */}
          {showDevicePicker && devices.filter(d => d.is_ready).length > 0 && (
            <div style={{
              padding: '12px 14px', borderRadius: 14,
              background: '#fff', border: '1px solid #e2e8f0',
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              display: 'flex', flexDirection: 'column', gap: 6,
            }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Select TV
              </span>
              {devices.filter(d => d.is_ready).map(d => (
                <button
                  key={d.device_id}
                  onClick={() => connectToDevice(d)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '9px 12px', borderRadius: 10,
                    background: selectedDevice?.device_id === d.device_id ? '#e0e7ff' : '#f8fafc',
                    border: '1px solid',
                    borderColor: selectedDevice?.device_id === d.device_id ? '#a5b4fc' : '#e2e8f0',
                    cursor: 'pointer', fontSize: 13, fontWeight: 700,
                    color: selectedDevice?.device_id === d.device_id ? '#6366f1' : '#334155',
                    WebkitTapHighlightColor: 'transparent',
                    transition: 'background 0.15s',
                  }}
                >
                  <span>📺 {d.name}</span>
                  <ChevronDown size={14} style={{ transform: 'rotate(-90deg)', opacity: 0.5 }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Remote body ── */}
        <div style={{
          width: '100%', maxWidth: 400,
          padding: '4px 22px 28px',
          display: 'flex', flexDirection: 'column', gap: 14,
          flex: 1,
        }}>

          {/* Power row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <B id="power" title="Power"
              bg="linear-gradient(135deg,#f87171,#ef4444)" color="#fff"
              w={52} h={44} radius={22} fontSize={18}
              glow="rgba(239,68,68,0.35)"
            >⏻</B>
            <div style={{ display: 'flex', gap: 8 }}>
              <B id="mute" title="Mute"
                bg="#e2e8f0" color="#64748b" w={52} h={44} radius={22} fontSize={16}
              >🔇</B>
              <B id="home" title="Home"
                bg="linear-gradient(135deg,#fb923c,#f59e0b)" color="#fff"
                w={52} h={44} radius={22} fontSize={18}
                glow="rgba(251,146,60,0.38)"
              >⌂</B>
              <B id="back" title="Back"
                bg="#e2e8f0" color="#64748b" w={52} h={44} radius={22} fontSize={13}
              >↩ Back</B>
            </div>
          </div>

          {/* D-pad */}
          <DPad pressed={pressed} onPress={handlePress} disabled={buttonsDisabled} />

          {/* Playback row */}
          <div style={{ display: 'flex', gap: 10 }}>
            <B id="rew"  title="Rewind"       bg="#e2e8f0" color="#64748b" h={48} radius={24} fontSize={20} style={{ flex: 1 }}>⏮</B>
            <B id="play" title="Play / Pause"
              bg="linear-gradient(135deg,#fb923c,#f59e0b)" color="#fff"
              h={48} radius={24} fontSize={20}
              glow="rgba(251,146,60,0.42)"
              style={{ flex: 1.4 }}
            >⏯</B>
            <B id="fwd"  title="Fast-Forward" bg="#e2e8f0" color="#64748b" h={48} radius={24} fontSize={20} style={{ flex: 1 }}>⏭</B>
          </div>

          {/* Vol + Ch color-coded */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <B id="vol+" title="Volume Up"    bg="#dcfce7" color="#16a34a" h={44} radius={22} fontSize={13}>▲ VOL</B>
            <B id="ch+"  title="Channel Up"   bg="#dbeafe" color="#2563eb" h={44} radius={22} fontSize={13}>▲ CH</B>
            <B id="vol-" title="Volume Down"  bg="#fee2e2" color="#dc2626" h={44} radius={22} fontSize={13}>▼ VOL</B>
            <B id="ch-"  title="Channel Down" bg="#fef9c3" color="#ca8a04" h={44} radius={22} fontSize={13}>▼ CH</B>
          </div>

          {/* Number pad */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.15em', color: '#94a3b8', textTransform: 'uppercase', textAlign: 'center', marginBottom: 8 }}>
              Direct Channel
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((n, i) => (
                <B key={i}
                  id={n === '' ? 'noop' : `num${n}`}
                  title={`${n}`}
                  bg={n === '⌫' ? '#fee2e2' : n === '' ? 'transparent' : '#e8edf4'}
                  color={n === '⌫' ? '#dc2626' : '#334155'}
                  h={44} radius={16} fontSize={16}
                  glow=""
                  disabled={n === '' ? true : buttonsDisabled}
                >{n}</B>
              ))}
            </div>
          </div>

          {/* Quick shortcuts */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.15em', color: '#94a3b8', textTransform: 'uppercase', textAlign: 'center', marginBottom: 8 }}>
              Quick Channels
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {['★ 1','★ 2','★ 3','★ 4'].map((label, i) => (
                <B key={i} id={`sc${i}`} title={`Shortcut ${i + 1}`}
                  bg="linear-gradient(135deg,#e0e7ff,#ddd6fe)"
                  color="#6366f1" h={38} radius={19} fontSize={11}
                  glow="rgba(99,102,241,0.15)"
                >{label}</B>
              ))}
            </div>
          </div>

        </div>

        {/* ── Bottom hint ── */}
        <div style={{ padding: '8px 20px 16px', fontSize: 10, color: '#94a3b8', textAlign: 'center', fontWeight: 600, letterSpacing: '0.05em' }}>
          {isFullscreen ? '⬜ Tap ⊠ to exit fullscreen' : '⬜ Tap ⊡ for fullscreen & lock portrait'}
        </div>

      </div>
    </>
  )
}
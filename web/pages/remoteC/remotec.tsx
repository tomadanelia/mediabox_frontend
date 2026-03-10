'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import api from '@/lib/axios'
import useUIStore from '@/store/ui-store'

/* ─── Types ───────────────────────────────────────────────────────────────── */
interface Device {
  device_id: string
  name: string
  is_ready: boolean
  socket_token: string
}

type ConnectionStatus = 'idle' | 'fetching' | 'not_ready' | 'connecting' | 'connected' | 'error'

/* ─── Key map ─────────────────────────────────────────────────────────────── */
const KEY_MAP: Record<string, string> = {
  up: 'KEYCODE_DPAD_UP', down: 'KEYCODE_DPAD_DOWN',
  left: 'KEYCODE_DPAD_LEFT', right: 'KEYCODE_DPAD_RIGHT',
  ok: 'KEYCODE_DPAD_CENTER', back: 'KEYCODE_BACK',
  play: 'KEYCODE_MEDIA_PLAY_PAUSE', rew: 'KEYCODE_MEDIA_REWIND',
  fwd: 'KEYCODE_MEDIA_FAST_FORWARD', mute: 'KEYCODE_VOLUME_MUTE',
  'vol+': 'KEYCODE_VOLUME_UP', 'vol-': 'KEYCODE_VOLUME_DOWN',
  'ch+': 'KEYCODE_CHANNEL_UP', 'ch-': 'KEYCODE_CHANNEL_DOWN',
  home: 'KEYCODE_HOME', power: 'KEYCODE_POWER',
  num0:'KEYCODE_0', num1:'KEYCODE_1', num2:'KEYCODE_2', num3:'KEYCODE_3',
  num4:'KEYCODE_4', num5:'KEYCODE_5', num6:'KEYCODE_6', num7:'KEYCODE_7',
  num8:'KEYCODE_8', num9:'KEYCODE_9',
  sc0:'KEYCODE_SHORTCUT_1', sc1:'KEYCODE_SHORTCUT_2',
  sc2:'KEYCODE_SHORTCUT_3', sc3:'KEYCODE_SHORTCUT_4',
}

/* ─── Label map ───────────────────────────────────────────────────────────── */
const LABELS: Record<string, string> = {
  power:'Power', ok:'Select', up:'Up', down:'Down', left:'Left', right:'Right',
  play:'Play / Pause', rew:'Rewind', fwd:'Fast-Forward',
  'vol+':'Volume ▲', 'vol-':'Volume ▼', 'ch+':'Channel ▲', 'ch-':'Channel ▼',
  mute:'Mute', home:'Home', back:'Back',
  num0:'0',num1:'1',num2:'2',num3:'3',num4:'4',
  num5:'5',num6:'6',num7:'7',num8:'8',num9:'9',
  sc0:'Quick CH 1', sc1:'Quick CH 2', sc2:'Quick CH 3', sc3:'Quick CH 4',
}

/* ─── Theme palettes ──────────────────────────────────────────────────────── */
interface Theme {
  primary: string; primaryDark: string; primaryGlow: string; primaryLight: string
  surface: string; surfaceDim: string; border: string
  text: string; textMuted: string; textFaint: string
  danger: string; dangerBg: string; dangerText: string
  success: string; successBg: string; successText: string
  warn: string; warnBg: string; warnText: string
  info: string; infoBg: string; infoText: string
  bg: string; dpadRing: string; dpadInner: string
}

function makeTheme(dark: boolean): Theme {
  if (dark) return {
    primary: '#f97316', primaryDark: '#ea580c',
    primaryGlow: 'rgba(249,115,22,0.40)', primaryLight: 'rgba(249,115,22,0.14)',
    surface: '#18181b', surfaceDim: '#27272a', border: 'rgba(255,255,255,0.08)',
    text: '#fafafa', textMuted: '#a1a1aa', textFaint: '#52525b',
    danger: '#ef4444', dangerBg: 'rgba(239,68,68,0.15)', dangerText: '#f87171',
    success: '#22c55e', successBg: 'rgba(34,197,94,0.13)', successText: '#4ade80',
    warn: '#eab308', warnBg: 'rgba(234,179,8,0.13)', warnText: '#facc15',
    info: '#3b82f6', infoBg: 'rgba(59,130,246,0.13)', infoText: '#60a5fa',
    bg: 'linear-gradient(160deg,#0f0f10 0%,#18181b 50%,#111113 100%)',
    dpadRing: 'linear-gradient(145deg,#2a2a2f,#222226)', dpadInner: '#1c1c1f',
  }
  return {
    primary: '#f97316', primaryDark: '#ea580c',
    primaryGlow: 'rgba(249,115,22,0.35)', primaryLight: 'rgba(249,115,22,0.10)',
    surface: '#ffffff', surfaceDim: '#f4f4f5', border: 'rgba(0,0,0,0.08)',
    text: '#18181b', textMuted: '#71717a', textFaint: '#a1a1aa',
    danger: '#ef4444', dangerBg: '#fee2e2', dangerText: '#dc2626',
    success: '#22c55e', successBg: '#dcfce7', successText: '#16a34a',
    warn: '#eab308', warnBg: '#fef9c3', warnText: '#ca8a04',
    info: '#3b82f6', infoBg: '#dbeafe', infoText: '#2563eb',
    bg: 'linear-gradient(160deg,#fafafa 0%,#f4f4f5 50%,#f9fafb 100%)',
    dpadRing: 'linear-gradient(145deg,#e4e4e7,#d4d4d8)', dpadInner: '#ffffff',
  }
}

type StatusConfig = { bg: string; color: string; label: string; icon: string }

function statusStyles(C: Theme): Record<ConnectionStatus, StatusConfig> {
  return {
    idle:       { bg: C.surfaceDim,    color: C.textMuted,    label: 'Not connected',    icon: 'wifi_off' },
    fetching:   { bg: C.infoBg,        color: C.infoText,     label: 'Finding devices…', icon: 'refresh'  },
    not_ready:  { bg: C.warnBg,        color: C.warnText,     label: 'TV app not ready', icon: 'wifi_off' },
    connecting: { bg: C.primaryLight,  color: C.primary,      label: 'Connecting…',      icon: 'refresh'  },
    connected:  { bg: C.successBg,     color: C.successText,  label: 'Connected',        icon: 'wifi'     },
    error:      { bg: C.dangerBg,      color: C.dangerText,   label: 'Error',            icon: 'wifi_off' },
  }
}

/* ─── Material Symbol icon ────────────────────────────────────────────────── */
interface IconProps { name: string; size?: number; fill?: 0|1; color?: string; spin?: boolean }
const Icon = ({ name, size = 20, fill = 0, color = 'currentColor', spin = false }: IconProps) => (
  <span
    className="material-symbols-outlined"
    style={{
      fontSize: size, color, lineHeight: 1, userSelect: 'none', display: 'inline-flex',
      fontVariationSettings: `'FILL' ${fill},'wght' 400,'GRAD' 0,'opsz' 24`,
      animation: spin ? 'spin 1s linear infinite' : 'none',
    }}
  >{name}</span>
)

/* ─── Press hook ──────────────────────────────────────────────────────────── */
function usePress() {
  const [pressed, setPressed] = useState<string | null>(null)
  const press = useCallback((id: string) => {
    setPressed(id); setTimeout(() => setPressed(null), 160)
  }, [])
  return { pressed, press }
}

function haptic(ms = 18) { try { navigator.vibrate?.(ms) } catch {} }

/* ─── Ripple button ───────────────────────────────────────────────────────── */
interface BtnProps {
  id: string; children: React.ReactNode
  bg?: string; color?: string; w?: string|number; h?: number
  radius?: number; fontSize?: number; glow?: string; title?: string
  pressed: string|null; onPress: (id: string) => void
  style?: React.CSSProperties; disabled?: boolean
}

function Btn({ id, children, bg, color, w = '100%', h = 44, radius = 22,
  fontSize = 14, glow = '', title = '', pressed, onPress, style: extra, disabled = false }: BtnProps) {
  const isP = pressed === id
  const rippleRef = useRef<HTMLSpanElement>(null)
  const onPD = (_e: React.PointerEvent) => {
    if (disabled) return
    haptic(); onPress(id)
    if (rippleRef.current) {
      const el = rippleRef.current
      el.style.animation = 'none'; void el.offsetWidth
      el.style.animation = 'ripple 0.45s ease-out forwards'
    }
  }
  return (
    <button onPointerDown={onPD} disabled={disabled} title={title} style={{
      position:'relative', overflow:'hidden', width:w, height:h, borderRadius:radius,
      background:bg, color, border:'none', fontSize, fontWeight:700,
      cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1,
      display:'flex', alignItems:'center', justifyContent:'center', gap:4,
      boxShadow: isP ? 'inset 0 3px 12px rgba(0,0,0,0.2)'
        : glow ? `0 6px 18px ${glow},0 2px 5px rgba(0,0,0,0.07)`
        : '0 2px 6px rgba(0,0,0,0.07),0 1px 2px rgba(0,0,0,0.04)',
      transform: isP ? 'scale(0.93)' : 'scale(1)',
      transition:'all 0.13s cubic-bezier(.4,0,.2,1)',
      fontFamily:"'Nunito','Segoe UI',sans-serif", userSelect:'none',
      WebkitTapHighlightColor:'transparent', touchAction:'manipulation', ...extra,
    }}>
      <span ref={rippleRef} style={{
        position:'absolute', width:80, height:80, borderRadius:'50%',
        background:'rgba(255,255,255,0.28)', top:'50%', left:'50%',
        transform:'translate(-50%,-50%) scale(0)', pointerEvents:'none',
      }} />
      {children}
    </button>
  )
}

/* ─── D-pad ───────────────────────────────────────────────────────────────── */
function DPad({ pressed, onPress, disabled, C }: {
  pressed: string|null; onPress: (id: string) => void; disabled?: boolean; C: Theme
}) {
  const size = 148
  const Arrow = ({ id, icon, style }: { id: string; icon: string; style: React.CSSProperties }) => (
    <button title={id} disabled={disabled} onPointerDown={() => { if(disabled) return; haptic(12); onPress(id) }} style={{
      position:'absolute', width:40, height:40, borderRadius:'50%',
      background:'transparent', border:'none',
      cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1,
      display:'flex', alignItems:'center', justifyContent:'center',
      WebkitTapHighlightColor:'transparent', touchAction:'manipulation', ...style,
    }}>
      <Icon name={icon} size={20} color={pressed === id ? C.text : C.textFaint} />
    </button>
  )
  return (
    <div style={{ position:'relative', width:size, height:size, margin:'0 auto', flexShrink:0 }}>
      <div style={{ position:'absolute', inset:0, borderRadius:'50%', background:C.dpadRing,
        boxShadow:`0 6px 24px rgba(0,0,0,0.18),inset 0 1px 0 rgba(255,255,255,0.15)` }} />
      <div style={{ position:'absolute', top:24, left:24, right:24, bottom:24,
        borderRadius:'50%', background:C.dpadInner,
        boxShadow:`0 2px 10px rgba(0,0,0,0.15),inset 0 1px 0 rgba(255,255,255,0.1)`,
        display:'flex', alignItems:'center', justifyContent:'center' }}>
        <Btn id="ok" title="OK / Select"
          bg={`linear-gradient(135deg,${C.primary},${C.primaryDark})`} color="#fff"
          w={46} h={46} radius={23} fontSize={12} glow={C.primaryGlow}
          pressed={pressed} onPress={onPress} disabled={disabled}
        >OK</Btn>
      </div>
      <Arrow id="up"    icon="keyboard_arrow_up"    style={{ top:5,    left:'50%', transform:'translateX(-50%)' }} />
      <Arrow id="down"  icon="keyboard_arrow_down"  style={{ bottom:5, left:'50%', transform:'translateX(-50%)' }} />
      <Arrow id="left"  icon="keyboard_arrow_left"  style={{ top:'50%', left:5,   transform:'translateY(-50%)' }} />
      <Arrow id="right" icon="keyboard_arrow_right" style={{ top:'50%', right:5,  transform:'translateY(-50%)' }} />
    </div>
  )
}

/* ─── Fullscreen hook ─────────────────────────────────────────────────────── */
function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false)
  useEffect(() => {
    const h = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', h)
    return () => document.removeEventListener('fullscreenchange', h)
  }, [])
  const request = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen({ navigationUI:'hide' })
        try { await (screen.orientation as any).lock('portrait') } catch {}
      } else {
        await document.exitFullscreen()
        try { screen.orientation.unlock() } catch {}
      }
    } catch (e) { console.warn('Fullscreen not supported:', e) }
  }, [])
  return { isFullscreen, request }
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
export default function RemotePage() {
  const isDark = useUIStore((s) => s.isDark)
  const C = makeTheme(isDark)
  const SS = statusStyles(C)

  const { pressed, press } = usePress()
  const { isFullscreen, request: toggleFullscreen } = useFullscreen()

  const [status, setStatus]                     = useState<ConnectionStatus>('idle')
  const [devices, setDevices]                   = useState<Device[]>([])
  const [selectedDevice, setSelectedDevice]     = useState<Device | null>(null)
  const [errorMsg, setErrorMsg]                 = useState<string | null>(null)
  const [showDevicePicker, setShowDevicePicker] = useState(false)
  const socketRef  = useRef<any>(null)
  const [lastAction, setLastAction] = useState<string | null>(null)
  const actionTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  /* ── Disconnect helper ── */
  const disconnectSocket = useCallback(() => {
    if (socketRef.current) {
      try { socketRef.current.disconnect() } catch {}
      socketRef.current = null
    }
  }, [])

  /* ── Connect to a specific device via Socket.IO ── */
  const connectToDevice = useCallback(async (device: Device) => {
    disconnectSocket()
    setStatus('connecting')
    try {
      const { io } = await import('socket.io-client')
      const socket = io('https://tv-api.telecomm1.com', {
        auth: { token: device.socket_token },
        transports: ['websocket'],
        reconnectionAttempts: 3,
        timeout: 8000,
      })
      socketRef.current = socket

      socket.on('connect', () => {
        setSelectedDevice(device)
        setStatus('connected')
      })

      socket.on('connect_error', (err: any) => {
        console.error('Socket connect error:', err)
        setStatus('error')
        setErrorMsg(err?.message ?? 'Connection failed')
      })

      socket.on('disconnect', (reason: string) => {
        if (reason !== 'io client disconnect') {
          setStatus('error')
          setErrorMsg(`Disconnected: ${reason}`)
        }
      })
    } catch (e: any) {
      setStatus('error')
      setErrorMsg(e?.message ?? 'Failed to connect')
    }
  }, [disconnectSocket])

  /* ── Fetch devices ── */
  const fetchDevices = useCallback(async () => {
    setStatus('fetching'); setErrorMsg(null)
    try {
      const res = await api.get('/api/user/devices')
      const data: Device[] = res.data
      setDevices(data)
      const ready = data.filter(d => d.is_ready)
      if (ready.length === 0) { setStatus('not_ready'); return }
      if (ready.length === 1) { await connectToDevice(ready[0]) }
      else { setStatus('not_ready'); setShowDevicePicker(true) }
    } catch (e: any) {
      setStatus('error'); setErrorMsg(e?.message ?? 'Failed to fetch devices')
    }
  }, [connectToDevice])

  /* ── Cleanup on unmount ── */
  useEffect(() => () => { disconnectSocket() }, [disconnectSocket])

  /* ── Send keypress via Socket.IO ── */
  const sendKey = useCallback((buttonId: string) => {
    if (status !== 'connected' || !socketRef.current) return
    const key = KEY_MAP[buttonId]; if (!key) return
    socketRef.current.emit('keypress', { key })
  }, [status])

  const handlePress = useCallback((id: string) => {
    press(id); setLastAction(id)
    if (actionTimer.current) clearTimeout(actionTimer.current)
    actionTimer.current = setTimeout(() => setLastAction(null), 1800)
    sendKey(id)
  }, [press, sendKey])

  const buttonsDisabled = status !== 'connected'
  const isSpinning = status === 'fetching' || status === 'connecting'
  const statusStyle = SS[status]

  // Shorthand B component with theme-aware defaults
  const B = (props: Omit<BtnProps, 'pressed'|'onPress'>) => (
    <Btn {...props}
      bg={props.bg ?? C.surfaceDim}
      color={props.color ?? C.textMuted}
      pressed={pressed} onPress={handlePress}
      disabled={props.disabled ?? buttonsDisabled}
    />
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
        * { box-sizing:border-box; -webkit-tap-highlight-color:transparent; }
        @keyframes ripple  { to { transform:translate(-50%,-50%) scale(2.5); opacity:0; } }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeOut { 0%,60%{ opacity:1; } 100%{ opacity:0; } }
        @keyframes spin    { to { transform:rotate(360deg); } }
      `}</style>

      <div style={{
        minHeight:'100svh', background:C.bg,
        display:'flex', flexDirection:'column', alignItems:'center',
        fontFamily:"'Nunito','Segoe UI',sans-serif",
        paddingBottom:'env(safe-area-inset-bottom)',
        transition:'background 0.3s',
      }}>

        {/* ── Top bar ── */}
        <div style={{
          width:'100%', maxWidth:480,
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'16px 20px 8px',
          paddingTop:'max(16px,env(safe-area-inset-top))',
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <Icon name="live_tv" size={20} fill={1} color={C.primary} />
            <span style={{ fontSize:15, fontWeight:800, letterSpacing:'-0.02em', color:C.text }}>
              media<span style={{ color:C.primary }}>box</span>
            </span>
          </div>

          <div style={{ flex:1, textAlign:'center', padding:'0 8px' }}>
            {lastAction && (
              <span key={lastAction} style={{
                display:'inline-flex', alignItems:'center', gap:4,
                animation:'fadeUp 0.2s ease, fadeOut 1.8s 0.1s forwards',
                background:C.primaryLight, color:C.primary,
                padding:'3px 10px', borderRadius:12, fontSize:11, fontWeight:700,
              }}>
                <Icon name="ads_click" size={12} color={C.primary} />
                {LABELS[lastAction] ?? lastAction}
              </span>
            )}
          </div>

          <button onClick={toggleFullscreen} title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'} style={{
            width:34, height:34, borderRadius:12, border:'none', cursor:'pointer',
            background: isFullscreen ? `linear-gradient(135deg,${C.primary},${C.primaryDark})` : C.surfaceDim,
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow: isFullscreen ? `0 4px 12px ${C.primaryGlow}` : `0 2px 5px rgba(0,0,0,0.07)`,
            transition:'all 0.2s',
          }}>
            <Icon name={isFullscreen ? 'close_fullscreen' : 'open_in_full'} size={16}
              color={isFullscreen ? '#fff' : C.textMuted} />
          </button>
        </div>

        {/* ── Connection bar ── */}
        <div style={{ width:'100%', maxWidth:480, padding:'0 20px 10px', display:'flex', flexDirection:'column', gap:8 }}>

          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{
              display:'flex', alignItems:'center', gap:6,
              padding:'5px 12px', borderRadius:20,
              background:statusStyle.bg, color:statusStyle.color,
              fontSize:11, fontWeight:700, letterSpacing:'0.04em',
              flex:1, transition:'background 0.3s, color 0.3s',
            }}>
              <Icon name={statusStyle.icon} size={13} color={statusStyle.color} spin={isSpinning} />
              <span>{statusStyle.label}</span>
              {selectedDevice && status === 'connected' && (
                <span style={{ marginLeft:4, opacity:0.6 }}>· {selectedDevice.name}</span>
              )}
            </div>

            <button onClick={fetchDevices} disabled={isSpinning} style={{
              height:30, padding:'0 14px', borderRadius:15, border:'none',
              background:`linear-gradient(135deg,${C.primary},${C.primaryDark})`,
              color:'#fff', fontSize:11, fontWeight:700,
              cursor: isSpinning ? 'not-allowed' : 'pointer',
              opacity: isSpinning ? 0.55 : 1,
              display:'flex', alignItems:'center', gap:5,
              boxShadow:`0 4px 10px ${C.primaryGlow}`,
              WebkitTapHighlightColor:'transparent', transition:'opacity 0.2s',
            }}>
              <Icon name="refresh" size={13} color="#fff" spin={isSpinning} />
              {status === 'idle' ? 'Connect' : 'Refresh'}
            </button>
          </div>

          {status === 'not_ready' && !showDevicePicker && (
            <div style={{
              display:'flex', alignItems:'flex-start', gap:8,
              padding:'10px 14px', borderRadius:12,
              background:C.warnBg, border:`1px solid ${C.warn}44`,
              fontSize:12, color:C.warnText, lineHeight:1.55,
            }}>
              <Icon name="tv" size={16} color={C.warnText} />
              <span>Open the <strong>Remote</strong> feature in your TV App first, then tap <strong>Refresh</strong>.</span>
            </div>
          )}

          {status === 'error' && errorMsg && (
            <div style={{
              display:'flex', alignItems:'flex-start', gap:8,
              padding:'10px 14px', borderRadius:12,
              background:C.dangerBg, border:`1px solid ${C.danger}44`,
              fontSize:12, color:C.dangerText, lineHeight:1.55,
            }}>
              <Icon name="error" size={16} color={C.dangerText} />
              <span>{errorMsg}</span>
            </div>
          )}

          {showDevicePicker && devices.filter(d => d.is_ready).length > 0 && (
            <div style={{
              padding:'12px 14px', borderRadius:14,
              background:C.surface, border:`1px solid ${C.border}`,
              boxShadow:`0 4px 16px rgba(0,0,0,0.1)`,
              display:'flex', flexDirection:'column', gap:6,
            }}>
              <span style={{ fontSize:10, fontWeight:800, color:C.textFaint, letterSpacing:'0.1em', textTransform:'uppercase' }}>
                Select TV
              </span>
              {devices.filter(d => d.is_ready).map(d => {
                const sel = selectedDevice?.device_id === d.device_id
                return (
                  <button key={d.device_id} onClick={() => connectToDevice(d)} style={{
                    display:'flex', alignItems:'center', justifyContent:'space-between',
                    padding:'9px 12px', borderRadius:10,
                    background: sel ? C.primaryLight : C.surfaceDim,
                    border:'1px solid', borderColor: sel ? C.primary : C.border,
                    cursor:'pointer', fontSize:13, fontWeight:700,
                    color: sel ? C.primary : C.text,
                    WebkitTapHighlightColor:'transparent', transition:'background 0.15s',
                  }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <Icon name="tv" size={16} color={sel ? C.primary : C.textMuted} fill={sel ? 1 : 0} />
                      <span>{d.name}</span>
                    </div>
                    <Icon name="chevron_right" size={16} color={C.textFaint} />
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Remote body ── */}
        <div style={{ width:'100%', maxWidth:400, padding:'4px 22px 28px', display:'flex', flexDirection:'column', gap:14, flex:1 }}>

          {/* Power row */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <B id="power" title="Power"
              bg="linear-gradient(135deg,#f87171,#ef4444)" color="#fff"
              w={52} h={44} radius={22} glow="rgba(239,68,68,0.3)"
            >
              <Icon name="power_settings_new" size={20} color="#fff" />
            </B>
            <div style={{ display:'flex', gap:8 }}>
              <B id="mute" title="Mute" w={52} h={44} radius={22}>
                <Icon name="volume_off" size={20} color={C.textMuted} />
              </B>
              <B id="home" title="Home"
                bg={`linear-gradient(135deg,${C.primary},${C.primaryDark})`} color="#fff"
                w={52} h={44} radius={22} glow={C.primaryGlow}
              >
                <Icon name="home" size={20} color="#fff" fill={1} />
              </B>
              <B id="back" title="Back" w={68} h={44} radius={22} fontSize={12}>
                <Icon name="arrow_back" size={16} color={C.textMuted} />
                <span>Back</span>
              </B>
            </div>
          </div>

          {/* D-pad */}
          <DPad pressed={pressed} onPress={handlePress} disabled={buttonsDisabled} C={C} />

          {/* Playback */}
          <div style={{ display:'flex', gap:10 }}>
            <B id="rew"  title="Rewind"       h={48} radius={24} style={{ flex:1 }}>
              <Icon name="fast_rewind" size={22} color={C.textMuted} />
            </B>
            <B id="play" title="Play / Pause"
              bg={`linear-gradient(135deg,${C.primary},${C.primaryDark})`} color="#fff"
              h={48} radius={24} glow={C.primaryGlow} style={{ flex:1.4 }}
            >
              <Icon name="play_pause" size={22} color="#fff" />
            </B>
            <B id="fwd"  title="Fast-Forward" h={48} radius={24} style={{ flex:1 }}>
              <Icon name="fast_forward" size={22} color={C.textMuted} />
            </B>
          </div>

          {/* Vol + Ch */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <B id="vol+" title="Volume Up"    bg={C.successBg} color={C.successText} h={44} radius={22} fontSize={12}>
              <Icon name="volume_up"   size={16} color={C.successText} /><span>VOL</span>
            </B>
            <B id="ch+"  title="Channel Up"   bg={C.infoBg}    color={C.infoText}    h={44} radius={22} fontSize={12}>
              <Icon name="expand_less" size={16} color={C.infoText}    /><span>CH</span>
            </B>
            <B id="vol-" title="Volume Down"  bg={C.dangerBg}  color={C.dangerText}  h={44} radius={22} fontSize={12}>
              <Icon name="volume_down" size={16} color={C.dangerText}  /><span>VOL</span>
            </B>
            <B id="ch-"  title="Channel Down" bg={C.warnBg}    color={C.warnText}    h={44} radius={22} fontSize={12}>
              <Icon name="expand_more" size={16} color={C.warnText}    /><span>CH</span>
            </B>
          </div>

          {/* Numpad */}
          <div>
            <div style={{ fontSize:10, fontWeight:800, letterSpacing:'0.15em', color:C.textFaint, textTransform:'uppercase', textAlign:'center', marginBottom:8 }}>
              Direct Channel
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
              {[1,2,3,4,5,6,7,8,9,'',0,'del'].map((n, i) => (
                <B key={i}
                  id={n === '' ? 'noop' : n === 'del' ? 'numdel' : `num${n}`}
                  bg={n === 'del' ? C.dangerBg : n === '' ? 'transparent' : C.surfaceDim}
                  color={n === 'del' ? C.dangerText : C.text}
                  h={44} radius={16} fontSize={16} glow=""
                  disabled={n === '' ? true : buttonsDisabled}
                >
                  {n === 'del' ? <Icon name="backspace" size={18} color={C.dangerText} /> : n}
                </B>
              ))}
            </div>
          </div>

          {/* Quick shortcuts */}
          <div>
            <div style={{ fontSize:10, fontWeight:800, letterSpacing:'0.15em', color:C.textFaint, textTransform:'uppercase', textAlign:'center', marginBottom:8 }}>
              Quick Channels
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
              {[1,2,3,4].map((n, i) => (
                <B key={i} id={`sc${i}`} title={`Shortcut ${n}`}
                  bg={C.primaryLight} color={C.primary}
                  h={38} radius={19} fontSize={11}
                  glow="rgba(249,115,22,0.12)"
                >
                  <Icon name="star" size={13} color={C.primary} fill={1} />
                  <span style={{ marginLeft:2 }}>{n}</span>
                </B>
              ))}
            </div>
          </div>

        </div>

        {/* ── Bottom hint ── */}
        <div style={{
          padding:'8px 20px 16px',
          display:'flex', alignItems:'center', justifyContent:'center', gap:4,
          fontSize:10, color:C.textFaint, fontWeight:600, letterSpacing:'0.05em',
        }}>
          <Icon name={isFullscreen ? 'close_fullscreen' : 'open_in_full'} size={12} color={C.textFaint} />
          <span>{isFullscreen ? 'Tap ⊠ to exit fullscreen' : 'Tap ⊡ for fullscreen & lock portrait'}</span>
        </div>

      </div>
    </>
  )
}
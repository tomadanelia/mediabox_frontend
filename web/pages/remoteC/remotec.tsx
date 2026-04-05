'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import api from '../../src/lib/axios'
import useUIStore from '../../src/store/ui-store'

interface Device {
  device_id: string
  name: string
  is_ready: boolean
  socket_token: string
}

type ConnectionStatus = 'idle' | 'fetching' | 'not_ready' | 'connecting' | 'connected' | 'error'

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
  skip_back: 'KEYCODE_MEDIA_SKIP_BACKWARD',
  skip_fwd:  'KEYCODE_MEDIA_SKIP_FORWARD',
}

const LABELS: Record<string, string> = {
  power:'Power', ok:'Select', up:'Up', down:'Down', left:'Left', right:'Right',
  play:'Play / Pause', rew:'Rewind', fwd:'Fast-Forward',
  'vol+':'Volume ▲', 'vol-':'Volume ▼', 'ch+':'Channel ▲', 'ch-':'Channel ▼',
  mute:'Mute', home:'Home', back:'Back',
  num0:'0',num1:'1',num2:'2',num3:'3',num4:'4',
  num5:'5',num6:'6',num7:'7',num8:'8',num9:'9',
  sc0:'Quick CH 1', sc1:'Quick CH 2', sc2:'Quick CH 3', sc3:'Quick CH 4',
  skip_back:'-5 min', skip_fwd:'+5 min',
}

const R = '#d52b1e'
const R_GLOW = 'rgba(213,43,30,0.30)'
const R_LIGHT = 'rgba(213,43,30,0.10)'
const R_MED   = 'rgba(213,43,30,0.18)'

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

function usePress() {
  const [pressed, setPressed] = useState<string | null>(null)
  const press = useCallback((id: string) => {
    setPressed(id); setTimeout(() => setPressed(null), 160)
  }, [])
  return { pressed, press }
}

function haptic(ms = 22) {
  try { navigator.vibrate?.(ms) } catch {}
}

interface BtnProps {
  id: string; children: React.ReactNode
  bg?: string; color?: string; w?: string|number; h?: number
  radius?: number; fontSize?: number; glow?: string; title?: string
  pressed: string|null; onPress: (id: string) => void
  style?: React.CSSProperties; disabled?: boolean
}

function Btn({ id, children, bg, color, w = '100%', h = 52, radius = 26,
  fontSize = 15, glow = '', title = '', pressed, onPress, style: extra, disabled = false }: BtnProps) {
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
      background: bg ?? 'rgba(255,255,255,0.06)',
      color, border: `1px solid rgba(255,255,255,0.07)`,
      fontSize, fontWeight: 700,
      cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.35 : 1,
      display:'flex', alignItems:'center', justifyContent:'center', gap:4,
      boxShadow: isP
        ? 'inset 0 3px 12px rgba(0,0,0,0.25)'
        : glow
          ? `0 6px 20px ${glow}, 0 2px 6px rgba(0,0,0,0.15)`
          : '0 2px 8px rgba(0,0,0,0.12)',
      transform: isP ? 'scale(0.93)' : 'scale(1)',
      transition: 'all 0.13s cubic-bezier(.4,0,.2,1)',
      fontFamily: "'DM Sans','Segoe UI',sans-serif", userSelect: 'none',
      WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation', ...extra,
    }}>
      <span ref={rippleRef} style={{
        position:'absolute', width:90, height:90, borderRadius:'50%',
        background:'rgba(255,255,255,0.18)', top:'50%', left:'50%',
        transform:'translate(-50%,-50%) scale(0)', pointerEvents:'none',
      }} />
      {children}
    </button>
  )
}

function DPad({ pressed, onPress, disabled }: {
  pressed: string|null; onPress: (id: string) => void; disabled?: boolean
}) {
  // Larger DPad: 180px with skip buttons flanking the center ring
  const size = 180

  const Arrow = ({ id, icon, style }: { id: string; icon: string; style: React.CSSProperties }) => (
    <button title={id} disabled={disabled} onPointerDown={() => { if(disabled) return; haptic(14); onPress(id) }} style={{
      position:'absolute', width:48, height:48, borderRadius:'50%',
      background:'transparent', border:'none',
      cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.35 : 1,
      display:'flex', alignItems:'center', justifyContent:'center',
      WebkitTapHighlightColor:'transparent', touchAction:'manipulation', ...style,
    }}>
      <Icon
        name={icon} size={24}
        color={pressed === id ? '#ffffff' : 'rgba(255,255,255,0.35)'}
      />
    </button>
  )

  // Skip buttons sit left and right of the DPad circle, vertically centred
  const SkipBtn = ({ id, icon, label, side }: { id: string; icon: string; label: string; side: 'left'|'right' }) => {
    const isP = pressed === id
    return (
      <button
        title={label}
        disabled={disabled}
        onPointerDown={() => { if(disabled) return; haptic(30); onPress(id) }}
        style={{
          position:'absolute',
          top:'50%',
          [side]: side === 'left' ? -76 : -76,
          width:62, height:62, borderRadius:18,
          background: isP ? `linear-gradient(135deg,${R},#b71c1c)` : R_LIGHT,
          border:`1px solid ${R_MED}`,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.35 : 1,
          display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:2,
          boxShadow: isP ? `inset 0 3px 10px rgba(0,0,0,0.25)` : `0 4px 14px ${R_GLOW}`,
          transform: isP ? 'translateY(-50%) scale(0.92)' : 'translateY(-50%) scale(1)',
          transition:'all 0.13s cubic-bezier(.4,0,.2,1)',
          WebkitTapHighlightColor:'transparent', touchAction:'manipulation',
          fontFamily:"'DM Sans','Segoe UI',sans-serif",
        }}
      >
        <Icon name={icon} size={20} color={isP ? '#fff' : R} />
        <span style={{ fontSize:9, fontWeight:800, color: isP ? '#fff' : R, letterSpacing:'0.04em' }}>{label}</span>
      </button>
    )
  }

  return (
    <div style={{ position:'relative', width: size + 160, height: size, margin:'0 auto', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
      {/* DPad circle */}
      <div style={{ position:'relative', width:size, height:size, flexShrink:0 }}>
        <div style={{
          position:'absolute', inset:0, borderRadius:'50%',
          background:'rgba(255,255,255,0.05)',
          border:'1px solid rgba(255,255,255,0.08)',
          boxShadow:'0 8px 28px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.08)',
        }} />
        <div style={{
          position:'absolute', top:28, left:28, right:28, bottom:28,
          borderRadius:'50%',
          background:'rgba(255,255,255,0.03)',
          border:'1px solid rgba(255,255,255,0.06)',
          boxShadow:'inset 0 2px 8px rgba(0,0,0,0.20)',
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <Btn
            id="ok" title="OK / Select"
            bg={`linear-gradient(135deg,${R},#b71c1c)`}
            color="#fff"
            w={56} h={56} radius={28} fontSize={13} glow={R_GLOW}
            pressed={pressed} onPress={onPress} disabled={disabled}
          >OK</Btn>
        </div>
        <Arrow id="up"    icon="keyboard_arrow_up"    style={{ top:6,    left:'50%', transform:'translateX(-50%)' }} />
        <Arrow id="down"  icon="keyboard_arrow_down"  style={{ bottom:6, left:'50%', transform:'translateX(-50%)' }} />
        <Arrow id="left"  icon="keyboard_arrow_left"  style={{ top:'50%', left:6,   transform:'translateY(-50%)' }} />
        <Arrow id="right" icon="keyboard_arrow_right" style={{ top:'50%', right:6,  transform:'translateY(-50%)' }} />

        {/* Skip buttons flanking the DPad */}
        <SkipBtn id="skip_back" icon="replay_5"   label="-5 min" side="left"  />
        <SkipBtn id="skip_fwd"  icon="forward_5"  label="+5 min" side="right" />
      </div>
    </div>
  )
}

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

export default function RemotePage() {
  useUIStore((s: { isDark: any }) => s.isDark)

  const { pressed, press } = usePress()
  const { isFullscreen, request: toggleFullscreen } = useFullscreen()

  const [status, setStatus]                     = useState<ConnectionStatus>('idle')
  const [devices, setDevices]                   = useState<Device[]>([])
  const [selectedDevice, setSelectedDevice]     = useState<Device | null>(null)
  const [errorMsg, setErrorMsg]                 = useState<string | null>(null)
  const [showDevicePicker, setShowDevicePicker] = useState(false)
  const socketRef   = useRef<any>(null)
  const [lastAction, setLastAction] = useState<string | null>(null)
  const actionTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const disconnectSocket = useCallback(() => {
    if (socketRef.current) {
      try { socketRef.current.disconnect() } catch {}
      socketRef.current = null
    }
  }, [])

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
      socket.on('connect', () => { setSelectedDevice(device); setStatus('connected') })
      socket.on('connect_error', (err: any) => { setStatus('error'); setErrorMsg(err?.message ?? 'Connection failed') })
      socket.on('disconnect', (reason: string) => {
        if (reason !== 'io client disconnect') { setStatus('error'); setErrorMsg(`Disconnected: ${reason}`) }
      })
    } catch (e: any) {
      setStatus('error'); setErrorMsg(e?.message ?? 'Failed to connect')
    }
  }, [disconnectSocket])

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

  useEffect(() => () => { disconnectSocket() }, [disconnectSocket])

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

  const statusConfig: Record<ConnectionStatus, { bg: string; color: string; label: string; icon: string }> = {
    idle:       { bg: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.30)', label: 'Not connected',    icon: 'wifi_off'  },
    fetching:   { bg: 'rgba(213,43,30,0.10)',   color: R,                        label: 'Finding devices…', icon: 'refresh'   },
    not_ready:  { bg: 'rgba(234,179,8,0.12)',   color: '#facc15',                label: 'TV app not ready', icon: 'wifi_off'  },
    connecting: { bg: R_LIGHT,                  color: R,                        label: 'Connecting…',      icon: 'refresh'   },
    connected:  { bg: 'rgba(34,197,94,0.12)',   color: '#4ade80',                label: 'Connected',        icon: 'wifi'      },
    error:      { bg: 'rgba(213,43,30,0.12)',   color: '#f87171',                label: 'Error',            icon: 'wifi_off'  },
  }

  const sc = statusConfig[status]

  const B = (props: Omit<BtnProps, 'pressed'|'onPress'>) => (
    <Btn
      {...props}
      color={props.color ?? 'rgba(255,255,255,0.45)'}
      pressed={pressed}
      onPress={handlePress}
      disabled={props.disabled ?? buttonsDisabled}
    />
  )

  return (
    <>
      <style>{`
        * { box-sizing:border-box; -webkit-tap-highlight-color:transparent; }
        @keyframes ripple  { to { transform:translate(-50%,-50%) scale(2.5); opacity:0; } }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeOut { 0%,60%{ opacity:1; } 100%{ opacity:0; } }
        @keyframes spin    { to { transform:rotate(360deg); } }
      `}</style>

      <div style={{
        height: '100%',
        minHeight: '100%',
        background: 'transparent',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        fontFamily: "'DM Sans','Segoe UI',sans-serif",
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>

        {/* Header */}
        <div style={{
          width: '100%', maxWidth: 520,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px 8px',
          paddingTop: 'max(16px,env(safe-area-inset-top))',
        }}>
          <div style={{ flex:1, textAlign:'center', padding:'0 8px' }}>
            {lastAction && (
              <span key={lastAction} style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                animation: 'fadeUp 0.2s ease, fadeOut 1.8s 0.1s forwards',
                background: R_LIGHT, color: R,
                padding: '4px 12px', borderRadius: 14, fontSize: 12, fontWeight: 700,
                border: `1px solid ${R_MED}`,
              }}>
                <Icon name="ads_click" size={13} color={R} />
                {LABELS[lastAction] ?? lastAction}
              </span>
            )}
          </div>

          <button onClick={toggleFullscreen} title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'} style={{
            width: 38, height: 38, borderRadius: 13, border: `1px solid rgba(255,255,255,0.08)`,
            cursor: 'pointer',
            background: isFullscreen ? `linear-gradient(135deg,${R},#b71c1c)` : 'rgba(255,255,255,0.05)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: isFullscreen ? `0 4px 14px ${R_GLOW}` : '0 2px 6px rgba(0,0,0,0.12)',
            transition: 'all 0.2s',
          }}>
            <Icon
              name={isFullscreen ? 'close_fullscreen' : 'open_in_full'} size={17}
              color={isFullscreen ? '#fff' : 'rgba(255,255,255,0.40)'}
            />
          </button>
        </div>

        {/* Status bar */}
        <div style={{ width:'100%', maxWidth:520, padding:'0 20px 12px', display:'flex', flexDirection:'column', gap:8 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{
              display:'flex', alignItems:'center', gap:6,
              padding:'6px 14px', borderRadius: 22,
              background: sc.bg, color: sc.color,
              fontSize:12, fontWeight:700, letterSpacing:'0.04em',
              flex:1, border:`1px solid ${sc.color}22`,
              transition:'background 0.3s, color 0.3s',
            }}>
              <Icon name={sc.icon} size={14} color={sc.color} spin={isSpinning} />
              <span>{sc.label}</span>
              {selectedDevice && status === 'connected' && (
                <span style={{ marginLeft:4, opacity:0.5 }}>· {selectedDevice.name}</span>
              )}
            </div>

            <button onClick={fetchDevices} disabled={isSpinning} style={{
              height:34, padding:'0 16px', borderRadius:17, border:'none',
              background:`linear-gradient(135deg,${R},#b71c1c)`,
              color:'#fff', fontSize:12, fontWeight:700,
              cursor: isSpinning ? 'not-allowed' : 'pointer',
              opacity: isSpinning ? 0.55 : 1,
              display:'flex', alignItems:'center', gap:5,
              boxShadow: `0 4px 12px ${R_GLOW}`,
              WebkitTapHighlightColor:'transparent', transition:'opacity 0.2s',
            }}>
              <Icon name="refresh" size={14} color="#fff" spin={isSpinning} />
              {status === 'idle' ? 'Connect' : 'Refresh'}
            </button>
          </div>

          {status === 'not_ready' && !showDevicePicker && (
            <div style={{
              display:'flex', alignItems:'flex-start', gap:8,
              padding:'10px 14px', borderRadius:14,
              background:'rgba(234,179,8,0.10)', border:'1px solid rgba(234,179,8,0.25)',
              fontSize:12, color:'#facc15', lineHeight:1.55,
            }}>
              <Icon name="tv" size={16} color="#facc15" />
              <span>Open the <strong>Remote</strong> feature in your TV App first, then tap <strong>Refresh</strong>.</span>
            </div>
          )}

          {status === 'error' && errorMsg && (
            <div style={{
              display:'flex', alignItems:'flex-start', gap:8,
              padding:'10px 14px', borderRadius:14,
              background: R_LIGHT, border:`1px solid ${R_MED}`,
              fontSize:12, color:'#f87171', lineHeight:1.55,
            }}>
              <Icon name="error" size={16} color="#f87171" />
              <span>{errorMsg}</span>
            </div>
          )}

          {showDevicePicker && devices.filter(d => d.is_ready).length > 0 && (
            <div style={{
              padding:'12px 14px', borderRadius:16,
              background:'rgba(255,255,255,0.04)',
              border:'1px solid rgba(255,255,255,0.08)',
              backdropFilter:'blur(12px)',
              display:'flex', flexDirection:'column', gap:6,
            }}>
              <span style={{ fontSize:10, fontWeight:800, color:'rgba(255,255,255,0.25)', letterSpacing:'0.12em', textTransform:'uppercase' }}>
                Select TV
              </span>
              {devices.filter(d => d.is_ready).map(d => {
                const sel = selectedDevice?.device_id === d.device_id
                return (
                  <button key={d.device_id} onClick={() => connectToDevice(d)} style={{
                    display:'flex', alignItems:'center', justifyContent:'space-between',
                    padding:'10px 14px', borderRadius:12,
                    background: sel ? R_LIGHT : 'rgba(255,255,255,0.04)',
                    border:`1px solid ${sel ? R_MED : 'rgba(255,255,255,0.07)'}`,
                    cursor:'pointer', fontSize:14, fontWeight:700,
                    color: sel ? R : 'rgba(255,255,255,0.70)',
                    WebkitTapHighlightColor:'transparent', transition:'background 0.15s',
                  }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <Icon name="tv" size={17} color={sel ? R : 'rgba(255,255,255,0.35)'} fill={sel ? 1 : 0} />
                      <span>{d.name}</span>
                    </div>
                    <Icon name="chevron_right" size={17} color="rgba(255,255,255,0.20)" />
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Main controls */}
        <div style={{ width:'100%', maxWidth:460, padding:'4px 22px 32px', display:'flex', flexDirection:'column', gap:16, flex:1 }}>

          {/* Top row: power / mute home back */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <B id="power" title="Power"
              bg={`linear-gradient(135deg,${R},#b71c1c)`} color="#fff"
              w={60} h={52} radius={26} glow={R_GLOW}
            >
              <Icon name="power_settings_new" size={22} color="#fff" />
            </B>
            <div style={{ display:'flex', gap:10 }}>
              <B id="mute" title="Mute" w={58} h={52} radius={26}>
                <Icon name="volume_off" size={22} color="rgba(255,255,255,0.45)" />
              </B>
              <B id="home" title="Home"
                bg={`linear-gradient(135deg,${R},#b71c1c)`} color="#fff"
                w={58} h={52} radius={26} glow={R_GLOW}
              >
                <Icon name="home" size={22} color="#fff" fill={1} />
              </B>
              <B id="back" title="Back" w={76} h={52} radius={26} fontSize={13}>
                <Icon name="arrow_back" size={18} color="rgba(255,255,255,0.45)" />
                <span style={{ color:'rgba(255,255,255,0.45)' }}>Back</span>
              </B>
            </div>
          </div>

          {/* DPad with skip buttons */}
          <DPad pressed={pressed} onPress={handlePress} disabled={buttonsDisabled} />

          {/* Playback row */}
          <div style={{ display:'flex', gap:10 }}>
            <B id="rew"  title="Rewind"       h={54} radius={27} style={{ flex:1 }}>
              <Icon name="fast_rewind" size={24} color="rgba(255,255,255,0.45)" />
            </B>
            <B id="play" title="Play / Pause"
              bg={`linear-gradient(135deg,${R},#b71c1c)`} color="#fff"
              h={54} radius={27} glow={R_GLOW} style={{ flex:1.4 }}
            >
              <Icon name="play_pause" size={24} color="#fff" />
            </B>
            <B id="fwd"  title="Fast-Forward" h={54} radius={27} style={{ flex:1 }}>
              <Icon name="fast_forward" size={24} color="rgba(255,255,255,0.45)" />
            </B>
          </div>

          {/* Volume / Channel */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <B id="vol+" title="Volume Up"
              bg="rgba(34,197,94,0.12)" color="#4ade80" h={52} radius={26} fontSize={13}
            >
              <Icon name="volume_up"   size={18} color="#4ade80" /><span>VOL</span>
            </B>
            <B id="ch+"  title="Channel Up"
              bg="rgba(255,255,255,0.06)" color="rgba(255,255,255,0.55)" h={52} radius={26} fontSize={13}
            >
              <Icon name="expand_less" size={18} color="rgba(255,255,255,0.55)" /><span>CH</span>
            </B>
            <B id="vol-" title="Volume Down"
              bg={R_LIGHT} color="#f87171" h={52} radius={26} fontSize={13}
            >
              <Icon name="volume_down" size={18} color="#f87171" /><span>VOL</span>
            </B>
            <B id="ch-"  title="Channel Down"
              bg="rgba(255,255,255,0.06)" color="rgba(255,255,255,0.55)" h={52} radius={26} fontSize={13}
            >
              <Icon name="expand_more" size={18} color="rgba(255,255,255,0.55)" /><span>CH</span>
            </B>
          </div>

          {/* Number pad */}
          <div>
            <div style={{
              fontSize:10, fontWeight:700, letterSpacing:'0.12em',
              color:'rgba(255,255,255,0.20)', textTransform:'uppercase',
              textAlign:'center', marginBottom:10,
            }}>
              Direct Channel
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
              {[1,2,3,4,5,6,7,8,9,'',0,'del'].map((n, i) => (
                <B key={i}
                  id={n === '' ? 'noop' : n === 'del' ? 'numdel' : `num${n}`}
                  bg={n === 'del' ? R_LIGHT : n === '' ? 'transparent' : 'rgba(255,255,255,0.05)'}
                  color={n === 'del' ? '#f87171' : 'rgba(255,255,255,0.70)'}
                  h={52} radius={18} fontSize={18} glow=""
                  disabled={n === '' ? true : buttonsDisabled}
                >
                  {n === 'del'
                    ? <Icon name="backspace" size={20} color="#f87171" />
                    : <span style={{ color: 'rgba(255,255,255,0.70)' }}>{n}</span>
                  }
                </B>
              ))}
            </div>
          </div>

          {/* Quick channels */}
          <div>
            <div style={{
              fontSize:10, fontWeight:700, letterSpacing:'0.12em',
              color:'rgba(255,255,255,0.20)', textTransform:'uppercase',
              textAlign:'center', marginBottom:10,
            }}>
              Quick Channels
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
              {[1,2,3,4].map((n, i) => (
                <B key={i} id={`sc${i}`} title={`Shortcut ${n}`}
                  bg={R_LIGHT} color={R}
                  h={46} radius={23} fontSize={12}
                  glow={R_GLOW}
                >
                  <Icon name="star" size={14} color={R} fill={1} />
                  <span style={{ marginLeft:2, color: R }}>{n}</span>
                </B>
              ))}
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
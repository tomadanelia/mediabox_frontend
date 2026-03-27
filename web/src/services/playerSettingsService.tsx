/**
 * playerSettingsService.ts
 *
 * Manages HLS player settings: quality levels, audio tracks,
 * subtitle tracks and playback speed.
 *
 * Designed to be instantiated once per VideoPlayer mount and
 * passed down to the UI components.
 */

import Hls from 'hls.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface QualityLevel {
  index:   number;  // -1 = Auto
  label:   string;  // e.g. "1080p", "Auto"
  bitrate: number;
}

export interface AudioTrack {
  index: number;
  name:  string;
  lang:  string;
}

export interface SubtitleTrack {
  index: number;
  name:  string;
  lang:  string;
}

export interface PlayerSettings {
  levels:        QualityLevel[];
  currentLevel:  number;       // -1 = auto
  currentAutoLevel: number;    // actual level HLS picked when in auto mode
  audioTracks:   AudioTrack[];
  currentAudio:  number;
  subTracks:     SubtitleTrack[];
  currentSub:    number;       // -1 = off
  speed:         number;
}

export type SettingsSubscriber = (s: PlayerSettings) => void;

export const SPEED_OPTIONS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

// ─── Service ──────────────────────────────────────────────────────────────────

export class PlayerSettingsService {
  private hls:         Hls | null   = null;
  private subscribers: Set<SettingsSubscriber> = new Set();

  private state: PlayerSettings = {
    levels:           [],
    currentLevel:     -1,
    currentAutoLevel: -1,
    audioTracks:      [],
    currentAudio:     0,
    subTracks:        [],
    currentSub:       -1,
    speed:            1,
  };

  // Persists the user's explicit choice across stream switches.
  // -1 means auto (never explicitly set by user).
  private userChosenLevel = -1;
  private userChosenAudio = -1; // -1 = no explicit choice

  // ── Attach / detach ──────────────────────────────────────────────────────────

  attach(hls: Hls): void {
    this.hls = hls;

    const sync = () => this.syncFromHls();

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      // Restore user's chosen level before syncing so it sticks
      if (this.userChosenLevel !== -1) {
        hls.currentLevel = this.userChosenLevel;
        hls.nextLevel    = this.userChosenLevel;
      }
      if (this.userChosenAudio !== -1 && this.userChosenAudio < (hls.audioTracks?.length ?? 0)) {
        hls.audioTrack = this.userChosenAudio;
      }
      sync();
    });
    hls.on(Hls.Events.LEVEL_SWITCHED,        sync);
    hls.on(Hls.Events.AUDIO_TRACK_SWITCHED,  sync);
    hls.on(Hls.Events.SUBTITLE_TRACK_SWITCH, sync);

    sync();
  }

  detach(): void {
    this.hls = null;
    this.state = {
      levels: [], currentLevel: -1, currentAutoLevel: -1,
      audioTracks: [], currentAudio: 0,
      subTracks: [], currentSub: -1,
      speed: 1,
    };
    this.notify();
  }

  // ── Read from HLS ────────────────────────────────────────────────────────────

  private syncFromHls(): void {
    const hls = this.hls;
    if (!hls) return;

    // If user has an explicit choice, enforce it — don't let HLS auto-switches override it
    const effectiveLevel = this.userChosenLevel !== -1 ? this.userChosenLevel : -1;
    const isAuto = this.userChosenLevel === -1;

    this.state = {
      levels: [
        { index: -1, label: 'ავტომატური', bitrate: 0 },
        ...(hls.levels ?? []).map((l: any, i: number) => ({
          index:   i,
          label:   l.height ? `${l.height}p` : `Level ${i + 1}`,
          bitrate: l.bitrate ?? 0,
        })),
      ],
      currentLevel:     effectiveLevel,
      currentAutoLevel: isAuto ? (hls.currentLevel ?? -1) : -1,

      audioTracks: (hls.audioTracks ?? []).map((t: any, i: number) => ({
        index: i,
        name:  t.name || `Track ${i + 1}`,
        lang:  t.lang  || '',
      })),
      currentAudio: this.userChosenAudio !== -1 ? this.userChosenAudio : (hls.audioTrack ?? 0),

      subTracks: (hls.subtitleTracks ?? []).map((t: any, i: number) => ({
        index: i,
        name:  t.name || `Sub ${i + 1}`,
        lang:  t.lang  || '',
      })),
      currentSub: hls.subtitleTrack ?? -1,

      speed: this.state.speed,
    };

    this.notify();
  }

  // ── Setters ──────────────────────────────────────────────────────────────────

  setQuality(levelIndex: number): void {
    if (!this.hls) return;
    this.hls.currentLevel   = levelIndex;
    this.hls.nextLevel      = levelIndex;
    this.state.currentLevel = levelIndex;
    this.userChosenLevel    = levelIndex; // persist across stream switches
    this.notify();
  }

  setAudioTrack(index: number): void {
    if (!this.hls) return;
    this.hls.audioTrack     = index;
    this.state.currentAudio = index;
    this.userChosenAudio    = index; // persist across stream switches
    this.notify();
  }

  setSubtitleTrack(index: number): void {
    if (!this.hls) return;
    this.hls.subtitleTrack = index;
    this.state.currentSub  = index;
    this.notify();
  }

  setSpeed(speed: number): void {
    const media = this.hls?.media as HTMLVideoElement | null;
    if (media) media.playbackRate = speed;
    this.state.speed = speed;
    this.notify();
  }

  // ── Getters ──────────────────────────────────────────────────────────────────

  getState(): PlayerSettings {
    return { ...this.state };
  }

  // ── Subscription ─────────────────────────────────────────────────────────────

  subscribe(fn: SettingsSubscriber): () => void {
    this.subscribers.add(fn);
    fn({ ...this.state });
    return () => this.subscribers.delete(fn);
  }

  private notify(): void {
    const snap = { ...this.state };
    this.subscribers.forEach(fn => fn(snap));
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  static bitrateLabel(bps: number): string {
    if (!bps) return '';
    const kbps = Math.round(bps / 1000);
    return kbps >= 1000 ? `${(kbps / 1000).toFixed(1)} Mbps` : `${kbps} kbps`;
  }

  static speedLabel(s: number): string {
    return s === 1 ? 'სტანდარტული' : `${s}×`;
  }
}
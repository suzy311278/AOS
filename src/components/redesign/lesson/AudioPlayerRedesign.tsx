/**
 * AudioPlayerRedesign
 *
 * Reskinned audio player for redesigned lesson pages. Functionally
 * identical to the production AudioPlayer (play/pause, skip 15s,
 * seek, playback speed, Spotify embed) but with the Greentryst
 * forest palette: dark forest tile for the play button, mint waveform
 * for played bars, leaf accent on the speed pill, and the same
 * structural recipe used by the lesson callouts.
 *
 * Behavior preserved verbatim:
 *   - 6 playback speeds (0.5, 0.75, 1, 1.25, 1.5, 2)
 *   - 15-second skip back / forward
 *   - Click on the waveform to seek
 *   - Spotify episode embed if `spotifyId` is passed
 *   - Deterministic pseudo-random bar heights for the waveform
 */

'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  Headphones,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

interface Props {
  src?: string;
  spotifyId?: string;
  title?: string;
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

function formatTime(s: number) {
  if (!isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export function AudioPlayerRedesign({
  src,
  spotifyId,
  title = 'Listen to this lesson',
}: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => {
      if (!dragging) setCurrent(a.currentTime);
    };
    const onMeta = () => setDuration(a.duration);
    const onEnd = () => setPlaying(false);
    a.addEventListener('timeupdate', onTime);
    a.addEventListener('loadedmetadata', onMeta);
    a.addEventListener('ended', onEnd);
    return () => {
      a.removeEventListener('timeupdate', onTime);
      a.removeEventListener('loadedmetadata', onMeta);
      a.removeEventListener('ended', onEnd);
    };
  }, [dragging]);

  const togglePlay = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
    } else {
      a.play();
    }
    setPlaying(!playing);
  }, [playing]);

  function cycleSpeed() {
    const idx = SPEEDS.indexOf(speed);
    const next = SPEEDS[(idx + 1) % SPEEDS.length];
    setSpeed(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  }

  function seek(e: React.MouseEvent<HTMLDivElement>) {
    const bar = progressRef.current;
    const a = audioRef.current;
    if (!bar || !a || !duration) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(
      0,
      Math.min(1, (e.clientX - rect.left) / rect.width)
    );
    a.currentTime = ratio * duration;
    setCurrent(a.currentTime);
  }

  function skipBack() {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(
      0,
      audioRef.current.currentTime - 15
    );
  }

  function skipForward() {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.min(
      duration,
      audioRef.current.currentTime + 15
    );
  }

  const progress = duration ? (current / duration) * 100 : 0;

  // Spotify embed mode -- functionally unchanged but wrapped in
  // the same forest-tinted card frame as the audio variant.
  if (spotifyId) {
    return (
      <div className="my-7 rounded-2xl overflow-hidden border border-gt-medium/20 bg-gt-medium/[0.04]">
        <iframe
          src={`https://open.spotify.com/embed/episode/${spotifyId}?utm_source=generator&theme=0`}
          width="100%"
          height="152"
          frameBorder={0}
          allowFullScreen
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          title={title}
        />
      </div>
    );
  }

  return (
    <div className="relative my-7 rounded-2xl overflow-hidden border border-gt-medium/20 bg-gt-medium/[0.04]">
      {/* Left accent bar in leaf */}
      <span
        aria-hidden
        className="absolute left-0 top-0 bottom-0 w-[3px] bg-gt-leaf"
      />

      <audio ref={audioRef} preload="metadata">
        <source src={src} type="audio/mpeg" />
      </audio>

      <div className="p-6 pl-7">
        {/* Header row */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center ring-1 ring-inset ring-white/[0.06] shadow-[0_4px_14px_-6px_rgba(11,61,46,0.55)]"
              style={{
                background:
                  'linear-gradient(135deg, #0B3D2E 0%, #0d2a20 100%)',
              }}
              aria-hidden
            >
              <Headphones
                className="w-[18px] h-[18px] text-gt-leaf"
                strokeWidth={2}
              />
            </div>
            <div>
              <p
                className="text-[10px] font-bold uppercase text-gt-medium mb-0.5"
                style={{
                  letterSpacing: '0.18em',
                  fontFamily:
                    'var(--font-jetbrains-mono), JetBrains Mono, monospace',
                }}
              >
                Audio
              </p>
              <p className="text-[14px] font-semibold text-gt-text leading-snug">
                {title}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={cycleSpeed}
            className="flex-shrink-0 px-2.5 py-1 rounded-md bg-gt-medium/10 text-gt-medium font-bold text-[11px] hover:bg-gt-medium/15 transition-colors"
            style={{
              fontFamily:
                'var(--font-jetbrains-mono), JetBrains Mono, monospace',
            }}
            title="Change playback speed"
          >
            {speed}x
          </button>
        </div>

        {/* Controls + waveform */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={skipBack}
            className="text-gt-text-dim hover:text-gt-medium transition-colors"
            title="Back 15s"
            aria-label="Skip back 15 seconds"
          >
            <ChevronsLeft className="w-5 h-5" strokeWidth={2} />
          </button>

          <button
            type="button"
            onClick={togglePlay}
            className="w-11 h-11 rounded-full flex items-center justify-center text-white ring-1 ring-inset ring-white/[0.08] shadow-[0_6px_18px_-6px_rgba(11,61,46,0.65)] hover:scale-105 active:scale-95 transition-transform flex-shrink-0"
            style={{
              background:
                'linear-gradient(135deg, #2D6A4F 0%, #1B4332 100%)',
            }}
            aria-label={playing ? 'Pause' : 'Play'}
          >
            {playing ? (
              <Pause className="w-4 h-4" strokeWidth={2.5} fill="white" />
            ) : (
              <Play className="w-4 h-4 ml-0.5" strokeWidth={2.5} fill="white" />
            )}
          </button>

          <button
            type="button"
            onClick={skipForward}
            className="text-gt-text-dim hover:text-gt-medium transition-colors"
            title="Forward 15s"
            aria-label="Skip forward 15 seconds"
          >
            <ChevronsRight className="w-5 h-5" strokeWidth={2} />
          </button>

          <div className="flex-1 min-w-0">
            <div
              ref={progressRef}
              className="relative h-9 flex items-center cursor-pointer group"
              onClick={seek}
              onMouseDown={() => setDragging(true)}
              onMouseUp={() => setDragging(false)}
              role="slider"
              aria-label="Audio progress"
              aria-valuenow={Math.round(progress)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className="absolute inset-0 flex items-center gap-[2px]">
                {Array.from({ length: 56 }).map((_, i) => {
                  const barProgress = (i / 56) * 100;
                  const played = barProgress < progress;
                  const isActive =
                    playing && played && barProgress > progress - 4;
                  // Deterministic pseudo-random heights so the bars
                  // look intentional but never reflow on re-render.
                  const seed = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
                  const h = 20 + (seed - Math.floor(seed)) * 80;
                  return (
                    <div
                      key={i}
                      className={`flex-1 rounded-full transition-all duration-150 ${
                        played
                          ? 'bg-gt-medium'
                          : 'bg-gt-medium/20 group-hover:bg-gt-medium/35'
                      } ${isActive ? 'animate-pulse' : ''}`}
                      style={{ height: `${h}%` }}
                      suppressHydrationWarning
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Time display */}
        <div className="flex justify-between mt-2 px-1">
          <span
            className="text-[11px] text-gt-text-dim tabular-nums"
            style={{
              fontFamily:
                'var(--font-jetbrains-mono), JetBrains Mono, monospace',
            }}
          >
            {formatTime(current)}
          </span>
          <span
            className="text-[11px] text-gt-text-dim tabular-nums"
            style={{
              fontFamily:
                'var(--font-jetbrains-mono), JetBrains Mono, monospace',
            }}
          >
            {formatTime(duration)}
          </span>
        </div>
      </div>
    </div>
  );
}

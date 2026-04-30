/**
 * LessonGlassAudio
 *
 * Floating glass audio player that straddles the boundary between
 * the dark `LessonDetailHero` and the white reading area below it.
 * Borrowed from the reference design where the audio card sits
 * at the bottom edge of the hero with `translate-y-1/2` so half
 * is in the dark hero and half spills onto the reading area.
 *
 * Functionally identical to AudioPlayerRedesign (play/pause, skip
 * 15s, seek, speed cycling, Spotify embed) but visually distinct:
 *
 *   - Glass background (semi-transparent dark green + backdrop blur)
 *   - White text and icons
 *   - Centered horizontally, max-w-3xl wide
 *   - Sits absolutely positioned by its parent (the page composes
 *     it inside a relative wrapper that overlaps the hero edge)
 *
 * The page is responsible for positioning. This component does not
 * include the absolute positioning so it can be reused in any
 * "floating audio" context (e.g. a future album-style hero).
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
  className?: string;
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

function formatTime(s: number) {
  if (!isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export function LessonGlassAudio({
  src,
  spotifyId,
  title = 'Listen to this lesson',
  className,
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
    if (playing) a.pause();
    else a.play();
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

  // Spotify embed wrapped in the same glass frame for consistency.
  if (spotifyId) {
    return (
      <div
        className={
          'w-full max-w-3xl mx-auto rounded-2xl overflow-hidden ' +
          'shadow-[0_24px_60px_-20px_rgba(0,0,0,0.55)] ' +
          'ring-1 ring-inset ring-white/15 ' +
          (className ?? '')
        }
        style={{
          background: 'rgba(11,31,24,0.82)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
      >
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
    <div
      className={
        'relative w-full max-w-3xl mx-auto rounded-2xl ' +
        'shadow-[0_24px_60px_-20px_rgba(0,0,0,0.55)] ' +
        'ring-1 ring-inset ring-white/15 ' +
        (className ?? '')
      }
      style={{
        background: 'rgba(11,31,24,0.78)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
      }}
    >
      <audio ref={audioRef} preload="metadata">
        <source src={src} type="audio/mpeg" />
      </audio>

      <div className="px-6 py-5">
        {/* Header row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Headphones
              className="w-4 h-4 text-gt-mint"
              strokeWidth={2}
            />
            <p
              className="text-[10px] font-bold uppercase text-gt-mint"
              style={{
                letterSpacing: '0.2em',
                fontFamily:
                  'var(--font-jetbrains-mono), JetBrains Mono, monospace',
              }}
            >
              Audio · {title}
            </p>
          </div>
          <button
            type="button"
            onClick={cycleSpeed}
            className="px-2.5 py-1 rounded-md bg-white/10 text-white text-[11px] font-bold hover:bg-white/15 transition-colors ring-1 ring-inset ring-white/10"
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
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={skipBack}
            className="text-white/60 hover:text-white transition-colors"
            title="Back 15s"
            aria-label="Skip back 15 seconds"
          >
            <ChevronsLeft className="w-5 h-5" strokeWidth={2} />
          </button>

          <button
            type="button"
            onClick={togglePlay}
            className="w-12 h-12 rounded-full flex items-center justify-center text-gt-deepest ring-1 ring-inset ring-white/30 hover:scale-105 active:scale-95 transition-transform flex-shrink-0 bg-white"
            aria-label={playing ? 'Pause' : 'Play'}
          >
            {playing ? (
              <Pause
                className="w-4 h-4"
                strokeWidth={2.5}
                fill="currentColor"
              />
            ) : (
              <Play
                className="w-4 h-4 ml-0.5"
                strokeWidth={2.5}
                fill="currentColor"
              />
            )}
          </button>

          <button
            type="button"
            onClick={skipForward}
            className="text-white/60 hover:text-white transition-colors"
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
                  // Deterministic pseudo-random heights so bars look
                  // intentional and never reflow on re-render.
                  const seed = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
                  const h = 20 + (seed - Math.floor(seed)) * 80;
                  return (
                    <div
                      key={i}
                      className={`flex-1 rounded-full transition-all duration-150 ${
                        played
                          ? 'bg-white'
                          : 'bg-white/25 group-hover:bg-white/40'
                      } ${isActive ? 'animate-pulse' : ''}`}
                      style={{ height: `${h}%` }}
                      suppressHydrationWarning
                    />
                  );
                })}
              </div>
            </div>
          </div>

          <div
            className="text-[11px] text-white/70 tabular-nums shrink-0"
            style={{
              fontFamily:
                'var(--font-jetbrains-mono), JetBrains Mono, monospace',
            }}
          >
            {formatTime(current)} / {formatTime(duration)}
          </div>
        </div>
      </div>
    </div>
  );
}

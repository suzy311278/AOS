'use client';

import { useRef, useState, useEffect, useCallback } from 'react';

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

export default function AudioPlayer({ src, spotifyId, title = 'Listen to this lesson' }: Props) {
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
    const onTime = () => { if (!dragging) setCurrent(a.currentTime); };
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
    if (playing) { a.pause(); } else { a.play(); }
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
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    a.currentTime = ratio * duration;
    setCurrent(a.currentTime);
  }

  function skipBack() {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 15);
  }

  function skipForward() {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 15);
  }

  const progress = duration ? (current / duration) * 100 : 0;

  if (spotifyId) {
    return (
      <div className="my-6 rounded-xl overflow-hidden shadow-sm">
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
    <div className="border border-orange-200 bg-gradient-to-br from-orange-50 via-amber-50/30 to-white p-5 rounded-xl my-6 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-orange-400 to-amber-500 rounded-l-xl" />

      <audio ref={audioRef} preload="metadata">
        <source src={src} type="audio/mpeg" />
      </audio>

      <div className="pl-3">
        {/* Header row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex-shrink-0 w-5 h-5 text-orange-500" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
            </span>
            <p className="font-semibold text-orange-900 text-sm">{title}</p>
          </div>
          <button
            onClick={cycleSpeed}
            className="flex-shrink-0 px-2 py-0.5 rounded-md bg-orange-100 text-orange-600 font-bold text-xs hover:bg-orange-200 transition-colors border border-orange-200/60"
            title="Change playback speed"
          >
            {speed}x
          </button>
        </div>

        {/* Controls + waveform row */}
        <div className="flex items-center gap-3">
          {/* Skip back */}
          <button onClick={skipBack} className="text-orange-400 hover:text-orange-600 transition-colors" title="Back 15s">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 17l-5-5 5-5" />
              <path d="M18 17l-5-5 5-5" />
            </svg>
          </button>

          {/* Play / Pause */}
          <button
            onClick={togglePlay}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-md hover:shadow-lg hover:scale-105 transition-all flex-shrink-0"
            aria-label={playing ? 'Pause' : 'Play'}
          >
            {playing ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Skip forward */}
          <button onClick={skipForward} className="text-orange-400 hover:text-orange-600 transition-colors" title="Forward 15s">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 17l5-5-5-5" />
              <path d="M6 17l5-5-5-5" />
            </svg>
          </button>

          {/* Waveform / progress area */}
          <div className="flex-1 min-w-0">
            <div
              ref={progressRef}
              className="relative h-10 flex items-center cursor-pointer group"
              onClick={seek}
              onMouseDown={() => setDragging(true)}
              onMouseUp={() => setDragging(false)}
              role="slider"
              aria-label="Audio progress"
              aria-valuenow={Math.round(progress)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              {/* Waveform bars */}
              <div className="absolute inset-0 flex items-center gap-[2px] px-[1px]">
                {Array.from({ length: 48 }).map((_, i) => {
                  const barProgress = (i / 48) * 100;
                  const played = barProgress < progress;
                  const isActive = playing && played && barProgress > progress - 4;
                  // Deterministic pseudo-random heights for visual interest
                  const seed = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
                  const h = 20 + (seed - Math.floor(seed)) * 80;
                  return (
                    <div
                      key={i}
                      className={`flex-1 rounded-full transition-all duration-150 ${
                        played
                          ? 'bg-gradient-to-t from-orange-500 to-amber-400'
                          : 'bg-orange-200/70 group-hover:bg-orange-300/70'
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
        <div className="flex justify-between mt-1.5 px-0.5">
          <span className="text-xs text-orange-400 font-medium tabular-nums">{formatTime(current)}</span>
          <span className="text-xs text-orange-400 font-medium tabular-nums">{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
}

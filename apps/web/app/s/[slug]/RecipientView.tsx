'use client';
// Song4Her 🦋 — Interactive Recipient View
import { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Download,
  Music2,
  Heart,
  Sparkles,
  Volume2,
  VolumeX,
  CheckCircle2,
} from 'lucide-react';
import type { PublicDelivery } from '@song4her/types';
import { formatBytes, formatDuration, parseArtworkColor } from '@/lib/utils';
import { publicApi } from '@/lib/api';

interface RecipientViewProps {
  delivery: PublicDelivery;
}

export function RecipientView({ delivery }: RecipientViewProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(delivery.duration || 0);
  const [isMuted, setIsMuted] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'downloading' | 'completed'>('idle');
  const [confetti, setConfetti] = useState<{
    id: number;
    char: string;
    x: number;      // spawn X (px from left)
    y: number;      // spawn Y (px from top)
    vx: number;     // horizontal velocity
    vy: number;     // initial upward velocity
    rotate: number; // random initial rotation
    size: number;   // font size in px
  }[]>([]);
  const downloadBtnRef = useRef<HTMLAnchorElement>(null);

  const color = parseArtworkColor(delivery.artworkColor);
  const artworkUrl = delivery.hasArtwork ? publicApi.artworkUrl(delivery.slug) : null;
  const streamUrl = publicApi.streamUrl(delivery.slug);
  const downloadUrl = publicApi.downloadUrl(delivery.slug);

  // Audio Playback
  const togglePlay = async () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (err) {
        console.error('[AUDIO] Play error:', err);
        setIsPlaying(false);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current && audioRef.current.duration) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // Download Trigger & Celebration
  const handleDownload = () => {
    setDownloadStatus('downloading');

    // 🎉 Party popper burst — spawn particles from the button's center
    const btn = downloadBtnRef.current;
    const rect = btn?.getBoundingClientRect();
    const cx = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
    const cy = rect ? rect.top + rect.height / 2 : window.innerHeight * 0.8;
    const CHARS = ['🦋', '✨', '💖', '🌸', '🎶', '🎊', '🎉', '⭐', '💫', '🌟'];

    const particles = Array.from({ length: 28 }).map((_, i) => {
      // Spread particles in a full 360° burst, weighted upward
      const angle = (Math.PI * 2 * i) / 28 - Math.PI / 2 + (Math.random() - 0.5) * 1.2;
      const speed = 180 + Math.random() * 220;
      return {
        id: Date.now() + i,
        char: CHARS[Math.floor(Math.random() * CHARS.length)],
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        rotate: Math.random() * 720 - 360,
        size: 18 + Math.random() * 16,
      };
    });
    setConfetti(particles);

    // Clear particles after animation ends
    setTimeout(() => setConfetti([]), 1400);

    setTimeout(() => {
      setDownloadStatus('completed');
    }, 1200);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="relative min-h-screen bg-[#09090f] text-white flex flex-col items-center justify-between p-4 sm:p-6 lg:p-8 overflow-hidden selection:bg-brand-500/30 selection:text-white">
      {/* Hidden audio element for preview */}
      <audio
        ref={audioRef}
        src={streamUrl}
        preload="auto"
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
        onError={(e) => {
          console.error('[AUDIO] Stream error:', e);
          setIsPlaying(false);
        }}
      />

      {/* Dynamic Ambient Background Glow from Artwork Color */}
      <div
        className="fixed inset-0 pointer-events-none transition-all duration-1000"
        style={{
          background: `radial-gradient(ellipse 80% 50% at 50% -10%, rgba(${color.r}, ${color.g}, ${color.b}, 0.28) 0%, transparent 70%),
                       radial-gradient(ellipse 60% 40% at 50% 110%, rgba(${color.r}, ${color.g}, ${color.b}, 0.15) 0%, transparent 70%)`,
        }}
      />

      {/* 🎉 Party Popper Confetti Burst */}
      {confetti.map((p) => (
        <div
          key={p.id}
          className="confetti-particle"
          style={{
            '--cx': `${p.x}px`,
            '--cy': `${p.y}px`,
            '--vx': `${p.vx}px`,
            '--vy': `${p.vy}px`,
            '--rot': `${p.rotate}deg`,
            fontSize: `${p.size}px`,
          } as React.CSSProperties}
        >
          {p.char}
        </div>
      ))}

      {/* Top Header */}
      <header className="relative z-10 w-full max-w-md pt-2 sm:pt-4 flex items-center justify-center gap-2">
        <span className="text-xl animate-flutter">🦋</span>
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
          A Little Song For You
        </span>
      </header>

      {/* Main Card */}
      <main className="relative z-10 w-full max-w-md my-auto py-6">
        <div className="rounded-[32px] bg-[#12121e]/85 border border-white/10 backdrop-blur-2xl shadow-2xl p-6 sm:p-8 space-y-6">
          {/* Artwork & Vinyl Presentation */}
          <div className="relative mx-auto w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center">
            {/* Glowing Backdrop behind vinyl */}
            <div
              className="absolute inset-0 rounded-full blur-2xl transition-opacity duration-700 pointer-events-none"
              style={{
                background: `rgba(${color.r}, ${color.g}, ${color.b}, ${isPlaying ? '0.45' : '0.25'})`,
              }}
            />

            {/* Vinyl record spinning behind artwork */}
            <div
              className={`absolute inset-2 rounded-full bg-[#111116] border border-white/10 shadow-inner flex items-center justify-center transition-transform ${
                isPlaying ? 'animate-spin-slow' : ''
              }`}
              style={{
                backgroundImage: 'repeating-radial-gradient(circle, transparent 0, transparent 4px, rgba(255,255,255,0.03) 5px, transparent 6px)',
              }}
            >
              {/* Vinyl Center Hole */}
              <div className="w-16 h-16 rounded-full border border-white/20 bg-surface flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-black/80 border border-white/40" />
              </div>
            </div>

            {/* Album Cover Card in Center */}
            <div
              className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-2xl overflow-hidden shadow-2xl border border-white/15 bg-[#181828] group cursor-pointer"
              onClick={togglePlay}
            >
              {artworkUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={artworkUrl}
                  alt={delivery.title}
                  className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${
                    isPlaying ? 'scale-[1.02]' : ''
                  }`}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-white/30 gap-2">
                  <Music2 size={48} className="animate-pulse" />
                  <span className="text-xs font-mono uppercase tracking-wider text-white/20">Song4Her</span>
                </div>
              )}

              {/* Play / Pause overlay badge */}
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-lg">
                  {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
                </div>
              </div>
            </div>
          </div>

          {/* Song Metadata */}
          <div className="text-center space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight line-clamp-2">
              {delivery.title}
            </h1>
            <p className="text-sm font-medium text-brand-300 flex items-center justify-center gap-1.5">
              <span>{delivery.artist}</span>
            </p>
            {delivery.album && (
              <p className="text-xs text-white/40 italic">
                {delivery.album}
              </p>
            )}
            <div className="pt-1 flex items-center justify-center gap-2 text-[11px] font-mono text-white/30">
              {duration > 0 && <span>{formatDuration(duration)}</span>}
              <span>•</span>
              <span>{delivery.format.toUpperCase()}</span>
              <span>•</span>
              <span>{formatBytes(delivery.fileSize)}</span>
            </div>
          </div>

          {/* Dhurbb's Personal Note */}
          {delivery.note && (
            <div className="relative p-4 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md text-left">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-300 mb-1">
                <Sparkles size={13} />
                <span>A note for you:</span>
              </div>
              <p className="text-sm text-white/80 leading-relaxed italic">
                &ldquo;{delivery.note}&rdquo;
              </p>
            </div>
          )}

          {/* In-browser Audio Preview Player */}
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
            {/* Scrubber Bar */}
            <div className="space-y-1">
              <div className="relative h-1.5 w-full rounded-full bg-white/10 cursor-pointer overflow-hidden">
                <div
                  className="absolute left-0 top-0 bottom-0 bg-brand-400 rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.1}
                value={currentTime}
                onChange={handleSeek}
                className="w-full opacity-0 h-2 -mt-2 cursor-pointer absolute inset-x-0"
              />
              <div className="flex justify-between text-[10px] font-mono text-white/40">
                <span>{formatDuration(currentTime)}</span>
                <span>{formatDuration(duration)}</span>
              </div>
            </div>

            {/* Play/Pause & Volume Row */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={toggleMute}
                className="p-2 text-white/40 hover:text-white transition-colors rounded-xl"
              >
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>

              <button
                type="button"
                onClick={togglePlay}
                className="w-11 h-11 rounded-full bg-brand-500 hover:bg-brand-400 text-white flex items-center justify-center shadow-lg shadow-brand-500/30 active:scale-95 transition-all"
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
              </button>

              <div className="w-8" />
            </div>
          </div>

          {/* Download CTA Button */}
          <div className="space-y-2 pt-1">
            <a
              ref={downloadBtnRef}
              href={downloadUrl}
              download={`${delivery.title} - ${delivery.artist}.${delivery.format}`}
              onClick={handleDownload}
              className={`w-full py-4 px-6 rounded-2xl font-semibold text-base flex items-center justify-center gap-2.5 shadow-xl transition-all active:scale-[0.98] ${
                downloadStatus === 'completed'
                  ? 'bg-emerald-500 text-white shadow-emerald-500/25'
                  : 'bg-gradient-to-r from-brand-500 to-brand-400 hover:from-brand-400 hover:to-brand-300 text-white shadow-brand-500/25'
              }`}
            >
              {downloadStatus === 'downloading' ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Starting Download...</span>
                </>
              ) : downloadStatus === 'completed' ? (
                <>
                  <CheckCircle2 size={20} className="animate-scale-in" />
                  <span>Downloaded! Enjoy 🦋✨</span>
                </>
              ) : (
                <>
                  <Download size={20} />
                  <span>Download Song ({formatBytes(delivery.fileSize)})</span>
                </>
              )}
            </a>
            <p className="text-[11px] text-center text-white/30">
              Full quality • Direct download to your device
            </p>
          </div>
        </div>
      </main>

      {/* Signature Footer */}
      <footer className="relative z-10 w-full max-w-md pb-4 pt-2 text-center">
        <div className="inline-block px-4 py-2 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-sm">
          <p className="text-xs text-white/40 whitespace-pre-line font-medium leading-relaxed">
            {delivery.signature || 'Built with 🫶🏻 by Dhurbb\nfor her shiuuuu 🦋'}
          </p>
        </div>
      </footer>
    </div>
  );
}

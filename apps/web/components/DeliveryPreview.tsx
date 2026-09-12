// Song4Her 🦋 — Live Recipient Preview Component (Admin)
'use client';
import { Music2, Download } from 'lucide-react';
import { formatBytes, parseArtworkColor } from '@/lib/utils';

interface DeliveryPreviewProps {
  title: string;
  artist: string;
  album?: string | null;
  note: string;
  signature: string;
  artworkUrl?: string | null;
  artworkSrc?: string | null;
  artworkColor?: string | null;
  format?: string;
  fileSize?: number;
  duration?: number | null;
  accentColor?: string;
}

export function DeliveryPreview({
  title,
  artist,
  album,
  note,
  signature,
  artworkUrl,
  artworkSrc,
  artworkColor,
  format = 'mp3',
  fileSize = 0,
  duration,
  accentColor = '#e879a0',
}: DeliveryPreviewProps) {
  const displayArtwork = artworkSrc ?? artworkUrl;
  const { r, g, b } = parseArtworkColor(artworkColor ?? null);

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden"
      style={{
        background: `radial-gradient(ellipse at 50% -10%, rgba(${r}, ${g}, ${b}, 0.5) 0%, rgb(8, 6, 18) 65%)`,
        minHeight: '480px',
      }}
    >
      {/* Background blur decorations */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 30%, rgba(${r}, ${g}, ${b}, 0.12) 0%, transparent 60%)`,
        }}
      />

      <div className="relative flex flex-col items-center py-10 px-6 gap-6">
        {/* Butterfly */}
        <div className="text-2xl animate-flutter select-none">🦋</div>

        {/* Artwork */}
        <div
          className="w-48 h-48 sm:w-56 sm:h-56 rounded-3xl overflow-hidden flex-shrink-0 flex items-center justify-center"
          style={{
            boxShadow: `0 0 0 1px rgba(255,255,255,0.06),
              0 20px 60px rgba(${r}, ${g}, ${b}, 0.3),
              0 0 100px rgba(${r}, ${g}, ${b}, 0.15)`,
          }}
        >
          {displayArtwork ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={displayArtwork}
              alt={title || 'Artwork'}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ background: `rgba(${r}, ${g}, ${b}, 0.2)` }}
            >
              <Music2 size={48} className="text-white/20" />
            </div>
          )}
        </div>

        {/* Song info */}
        <div className="text-center">
          <h2 className="text-xl font-bold text-white leading-tight">
            {title || 'Song Title'}
          </h2>
          <p className="text-white/60 text-sm mt-1 font-medium">
            {artist || 'Artist Name'}
          </p>
        </div>

        {/* Divider */}
        <div className="w-12 h-px bg-white/10" />

        {/* Note */}
        {note && (
          <div className="text-center max-w-xs">
            <span className="text-lg mb-3 block">💌</span>
            <p className="text-white/80 text-sm italic leading-relaxed whitespace-pre-wrap">
              "{note}"
            </p>
          </div>
        )}

        {/* Divider */}
        <div className="w-12 h-px bg-white/10" />

        {/* Download button */}
        <div className="flex flex-col items-center gap-2 w-full max-w-[200px]">
          <button
            className="w-full py-3 px-6 rounded-full font-semibold text-white text-sm
                       flex items-center justify-center gap-2 transition-all duration-200
                       hover:scale-105 active:scale-95"
            style={{
              background: `linear-gradient(135deg, rgba(${r}, ${g}, ${b}, 0.9), ${accentColor})`,
              boxShadow: `0 8px 32px rgba(${r}, ${g}, ${b}, 0.4)`,
            }}
          >
            ♫ Download
          </button>
          {fileSize > 0 && (
            <p className="text-xs text-white/30 font-mono">
              {format.toUpperCase()} • {formatBytes(fileSize)}
            </p>
          )}
        </div>

        {/* Signature */}
        {signature && (
          <p className="text-center text-xs text-white/25 whitespace-pre-wrap mt-2 leading-relaxed">
            {signature}
          </p>
        )}
      </div>
    </div>
  );
}

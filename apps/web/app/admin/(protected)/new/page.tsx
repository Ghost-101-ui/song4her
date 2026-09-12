'use client';
// Song4Her 🦋 — Quick Send (Create Delivery) Page
import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  UploadCloud,
  Music2,
  Image as ImageIcon,
  Sparkles,
  Clock,
  Send,
  AlertCircle,
  X,
  FileAudio,
} from 'lucide-react';
import type { AdminDelivery, ExpiryOption } from '@song4her/types';
import { songs } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { DeliveryPreview } from '@/components/DeliveryPreview';
import { ShareModal } from '@/components/ShareModal';
import { formatBytes } from '@/lib/utils';

const EXPIRY_OPTIONS: { label: string; value: ExpiryOption; desc: string }[] = [
  { label: 'Never', value: 'never', desc: 'Stays active until manually deleted' },
  { label: '24 Hours', value: '24h', desc: 'Expires in 1 day' },
  { label: '3 Days', value: '3d', desc: 'Expires in 3 days' },
  { label: '7 Days', value: '7d', desc: 'Expires in 1 week' },
];

const NOTE_TEMPLATES = [
  'Here is that song you wanted! 🦋',
  'Thought of you when I heard this ✨',
  'You mentioned you loved this one 🫶🏻',
  'A little soundtrack for your day 🌸',
];

export default function NewDeliveryPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const artworkInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [artworkFile, setArtworkFile] = useState<File | null>(null);
  const [artworkPreview, setArtworkPreview] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('');
  const [note, setNote] = useState('');
  const [duration, setDuration] = useState<number | null>(null);
  const [expiresIn, setExpiresIn] = useState<ExpiryOption>('never');
  const [artworkColor, setArtworkColor] = useState<string | null>('232,121,160');

  // UI State
  const [isProbing, setIsProbing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [createdDelivery, setCreatedDelivery] = useState<AdminDelivery | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  // Audio file selection & probing
  const handleAudioSelect = async (file: File) => {
    setAudioFile(file);
    setUploadError(null);

    // Fallback title from filename
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
    if (!title) {
      if (nameWithoutExt.includes(' - ')) {
        const parts = nameWithoutExt.split(' - ');
        setArtist(parts[0].trim());
        setTitle(parts[1].trim());
      } else {
        setTitle(nameWithoutExt);
      }
    }

    // Probe file for FFmpeg ID3 metadata
    setIsProbing(true);
    try {
      const probeData = new FormData();
      probeData.append('file', file);
      const meta = await songs.probe(probeData);
      if (meta.title) setTitle(meta.title);
      if (meta.artist) setArtist(meta.artist);
      if (meta.album) setAlbum(meta.album);
      if (meta.duration) setDuration(meta.duration);
    } catch {
      // Non-fatal probe error: user can fill manually
    } finally {
      setIsProbing(false);
    }
  };

  // Artwork selection
  const handleArtworkSelect = (file: File) => {
    setArtworkFile(file);
    const objectUrl = URL.createObjectURL(file);
    setArtworkPreview(objectUrl);
  };

  const removeArtwork = () => {
    setArtworkFile(null);
    if (artworkPreview) URL.revokeObjectURL(artworkPreview);
    setArtworkPreview(null);
  };

  // Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioFile) {
      setUploadError('Please choose an audio file to deliver.');
      return;
    }
    if (!title.trim() || !artist.trim()) {
      setUploadError('Title and Artist are required.');
      return;
    }

    setIsSubmitting(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', audioFile);
      if (artworkFile) formData.append('artwork', artworkFile);
      formData.append('title', title.trim());
      formData.append('artist', artist.trim());
      if (album.trim()) formData.append('album', album.trim());
      if (note.trim()) formData.append('note', note.trim());
      formData.append('expiresIn', expiresIn);

      const delivery = await songs.create(formData);
      setCreatedDelivery(delivery);
      setShowShareModal(true);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to create delivery. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <span>Quick Send</span>
          <span className="text-2xl animate-flutter">🦋</span>
        </h1>
        <p className="text-sm text-white/50 mt-1">
          Prepare a private, personalized song delivery page in seconds.
        </p>
      </div>

      {uploadError && (
        <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2.5">
          <AlertCircle size={18} className="flex-shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Grid: Form on Left, Live Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form: 7 cols */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-6">
          {/* 1. Audio Upload Box */}
          <div className="p-5 rounded-3xl bg-surface-1 border border-surface-border">
            <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <FileAudio size={16} className="text-brand-400" />
              1. Audio File
            </h2>

            <input
              type="file"
              ref={fileInputRef}
              accept="audio/*,.mp3,.m4a,.flac,.wav,.aac,.ogg"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleAudioSelect(f);
              }}
            />

            {!audioFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-surface-border hover:border-brand-500/50 rounded-2xl p-8 text-center cursor-pointer transition-colors bg-surface-2/30 hover:bg-surface-2/60 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <UploadCloud size={24} />
                </div>
                <p className="text-sm font-medium text-white mb-1">
                  Click or drag audio file here
                </p>
                <p className="text-xs text-white/40">
                  MP3, M4A, FLAC, WAV, AAC (up to 100MB)
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-2 border border-surface-border">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center flex-shrink-0">
                    <Music2 size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{audioFile.name}</p>
                    <p className="text-xs text-white/40">
                      {formatBytes(audioFile.size)} {isProbing && '• Reading ID3 tags...'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAudioFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-surface-3 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          {/* 2. Metadata */}
          <div className="p-5 rounded-3xl bg-surface-1 border border-surface-border space-y-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Sparkles size={16} className="text-brand-400" />
              2. Song Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Song Title *"
                placeholder="e.g. Golden Hour"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <Input
                label="Artist *"
                placeholder="e.g. JVKE"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                required
              />
            </div>

            <Input
              label="Album (optional)"
              placeholder="e.g. this is what ____ feels like"
              value={album}
              onChange={(e) => setAlbum(e.target.value)}
            />
          </div>

          {/* 3. Artwork */}
          <div className="p-5 rounded-3xl bg-surface-1 border border-surface-border">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <ImageIcon size={16} className="text-brand-400" />
                3. Cover Artwork
              </h2>
              {artworkPreview && (
                <button
                  type="button"
                  onClick={removeArtwork}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Remove
                </button>
              )}
            </div>

            <input
              type="file"
              ref={artworkInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleArtworkSelect(f);
              }}
            />

            {!artworkPreview ? (
              <div
                onClick={() => artworkInputRef.current?.click()}
                className="border-2 border-dashed border-surface-border hover:border-brand-500/50 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-surface-2/30 hover:bg-surface-2/60 group flex items-center justify-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-surface-3 flex items-center justify-center text-white/40 group-hover:text-brand-400 transition-colors">
                  <ImageIcon size={20} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-white">Upload Album Cover</p>
                  <p className="text-xs text-white/40">JPEG, PNG, WEBP (Square recommended)</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4 p-3 rounded-2xl bg-surface-2 border border-surface-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={artworkPreview}
                  alt="Artwork preview"
                  className="w-16 h-16 rounded-xl object-cover"
                />
                <div>
                  <p className="text-sm font-medium text-white">{artworkFile?.name}</p>
                  <p className="text-xs text-white/40">{formatBytes(artworkFile?.size || 0)}</p>
                </div>
              </div>
            )}
          </div>

          {/* 4. Personal Note */}
          <div className="p-5 rounded-3xl bg-surface-1 border border-surface-border space-y-3">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <span className="text-base">💌</span>
              4. Personal Note for Her
            </h2>

            {/* Quick Templates */}
            <div className="flex flex-wrap gap-1.5">
              {NOTE_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl}
                  type="button"
                  onClick={() => setNote(tmpl)}
                  className="text-xs px-2.5 py-1 rounded-full bg-surface-2 hover:bg-surface-3 text-white/60 hover:text-white border border-surface-border transition-colors"
                >
                  {tmpl}
                </button>
              ))}
            </div>

            <Textarea
              placeholder="Write a little message that will appear on her delivery page..."
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {/* 5. Expiry Preset */}
          <div className="p-5 rounded-3xl bg-surface-1 border border-surface-border space-y-3">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Clock size={16} className="text-brand-400" />
              5. Link Expiry
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {EXPIRY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setExpiresIn(opt.value)}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    expiresIn === opt.value
                      ? 'border-brand-500 bg-brand-500/10 text-white shadow-sm'
                      : 'border-surface-border bg-surface-2 text-white/60 hover:text-white hover:bg-surface-3'
                  }`}
                >
                  <p className="text-sm font-semibold">{opt.label}</p>
                  <p className="text-xs text-white/40 mt-0.5 leading-snug">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={isSubmitting}
            disabled={!audioFile}
            className="w-full rounded-2xl py-3.5 shadow-xl shadow-brand-500/20 gap-2"
          >
            <Send size={18} />
            <span>Create & Generate Share Link</span>
          </Button>
        </form>

        {/* Right Column: Live Recipient Preview (5 cols) */}
        <div className="lg:col-span-5 sticky top-6">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/40">
              Live Recipient Preview
            </span>
            <span className="text-xs text-brand-300">Updates as you type</span>
          </div>

          <div className="rounded-3xl border border-surface-border overflow-hidden bg-surface-1/50 shadow-2xl p-4">
            <DeliveryPreview
              title={title || 'Song Title'}
              artist={artist || 'Artist Name'}
              album={album || undefined}
              note={note}
              signature={"Built with 🫶🏻 by Dhurbb\nfor her shiuuuu 🦋"}
              artworkSrc={artworkPreview || undefined}
              artworkColor={artworkColor || undefined}
              fileSize={audioFile?.size || 3500000}
              duration={duration || 180}
            />
          </div>
        </div>
      </div>

      {/* Post-creation Share Modal */}
      {createdDelivery && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => {
            setShowShareModal(false);
            router.push('/admin');
          }}
          title={createdDelivery.title}
          artist={createdDelivery.artist}
          slug={createdDelivery.slug}
          shareUrl={createdDelivery.shareUrl}
        />
      )}
    </div>
  );
}

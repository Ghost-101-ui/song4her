'use client';
// Song4Her 🦋 — Edit Song Delivery Page
import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  Trash2,
  Share2,
  Download,
  Clock,
  Sparkles,
  AlertCircle,
  Check,
  ImageIcon,
  Eye,
} from 'lucide-react';
import type { AdminDelivery, ExpiryOption } from '@song4her/types';
import { songs, publicApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { DeliveryPreview } from '@/components/DeliveryPreview';
import { ShareModal } from '@/components/ShareModal';
import { formatBytes, formatRelative } from '@/lib/utils';

export default function EditSongPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const artworkInputRef = useRef<HTMLInputElement>(null);

  const [delivery, setDelivery] = useState<AdminDelivery | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('');
  const [note, setNote] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [newArtworkFile, setNewArtworkFile] = useState<File | null>(null);
  const [artworkPreview, setArtworkPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    songs
      .get(id)
      .then((data) => {
        setDelivery(data);
        setTitle(data.title);
        setArtist(data.artist);
        setAlbum(data.album || '');
        setNote(data.note);
        setIsActive(data.isActive);
        if (data.hasArtwork) {
          setArtworkPreview(publicApi.artworkUrl(data.slug));
        }
      })
      .catch((err) => {
        setError('Failed to load delivery details');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleArtworkSelect = (file: File) => {
    setNewArtworkFile(file);
    setArtworkPreview(URL.createObjectURL(file));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !delivery) return;

    setSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      if (newArtworkFile) {
        const formData = new FormData();
        formData.append('title', title.trim());
        formData.append('artist', artist.trim());
        formData.append('album', album.trim());
        formData.append('note', note.trim());
        formData.append('isActive', String(isActive));
        formData.append('artwork', newArtworkFile);

        const updated = await songs.updateWithArtwork(id, formData);
        setDelivery(updated);
      } else {
        const updated = await songs.update(id, {
          title: title.trim(),
          artist: artist.trim(),
          album: album.trim() || null,
          note: note.trim(),
          isActive,
        });
        setDelivery(updated);
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !delivery) return;
    if (!confirm(`Permanently delete "${delivery.title}"? This cannot be undone.`)) return;

    setDeleting(true);
    try {
      await songs.delete(id);
      router.replace('/admin');
    } catch {
      setError('Failed to delete delivery');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-4xl animate-flutter mb-3">🦋</div>
          <p className="text-sm text-white/50">Loading delivery details...</p>
        </div>
      </div>
    );
  }

  if (!delivery) {
    return (
      <div className="p-8 max-w-7xl mx-auto text-center py-20">
        <h2 className="text-xl font-bold text-white mb-2">Delivery Not Found</h2>
        <p className="text-sm text-white/50 mb-6">This song delivery may have been deleted.</p>
        <Link href="/admin">
          <Button variant="secondary" className="gap-2">
            <ArrowLeft size={16} />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  const isExpired = delivery.expiresAt ? new Date() > new Date(delivery.expiresAt) : false;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header & Back */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin">
            <button className="p-2 rounded-xl text-white/60 hover:text-white bg-surface-1 hover:bg-surface-2 border border-surface-border transition-colors">
              <ArrowLeft size={18} />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>Edit Delivery</span>
            </h1>
            <p className="text-xs text-white/40 mt-0.5">
              Slug: <code className="text-brand-300 font-mono">/s/{delivery.slug}</code> • Created {formatRelative(delivery.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowShareModal(true)}
            className="gap-1.5"
          >
            <Share2 size={15} />
            <span>Share</span>
          </Button>

          <a
            href={`/s/${delivery.slug}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="ghost" size="sm" className="gap-1.5 text-white/60 hover:text-white">
              <Eye size={15} />
              <span>Preview</span>
            </Button>
          </a>

          <Button
            variant="danger"
            size="sm"
            onClick={handleDelete}
            loading={deleting}
            className="gap-1.5"
          >
            <Trash2 size={15} />
            <span>Delete</span>
          </Button>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="p-4 rounded-2xl bg-surface-1 border border-surface-border">
          <p className="text-xs text-white/40 mb-1">Downloads</p>
          <p className="text-2xl font-bold text-white flex items-center gap-1.5">
            <Download size={20} className="text-brand-400" />
            {delivery.downloadCount}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-surface-1 border border-surface-border">
          <p className="text-xs text-white/40 mb-1">Last Downloaded</p>
          <p className="text-sm font-semibold text-white mt-1">
            {delivery.lastDownloaded ? formatRelative(delivery.lastDownloaded) : 'Never'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-surface-1 border border-surface-border">
          <p className="text-xs text-white/40 mb-1">Status</p>
          <p className={`text-sm font-semibold mt-1 flex items-center gap-1.5 ${
            !isActive || isExpired ? 'text-amber-400' : 'text-emerald-400'
          }`}>
            <span className={`w-2 h-2 rounded-full ${!isActive || isExpired ? 'bg-amber-400' : 'bg-emerald-400'}`} />
            {isExpired ? 'Expired' : isActive ? 'Active' : 'Disabled'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-surface-1 border border-surface-border">
          <p className="text-xs text-white/40 mb-1">File Size</p>
          <p className="text-sm font-semibold text-white mt-1">
            {formatBytes(delivery.fileSize)} ({delivery.format.toUpperCase()})
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {saveSuccess && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
          <Check size={18} />
          <span>Changes saved successfully!</span>
        </div>
      )}

      {/* Edit Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form: 7 cols */}
        <form onSubmit={handleSave} className="lg:col-span-7 space-y-6">
          <div className="p-5 rounded-3xl bg-surface-1 border border-surface-border space-y-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Sparkles size={16} className="text-brand-400" />
              Song Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Song Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <Input
                label="Artist"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                required
              />
            </div>

            <Input
              label="Album"
              value={album}
              onChange={(e) => setAlbum(e.target.value)}
            />

            {/* Active Switch */}
            <div className="flex items-center justify-between pt-2 border-t border-surface-border">
              <div>
                <p className="text-sm font-medium text-white">Active Delivery</p>
                <p className="text-xs text-white/40">Disable to temporarily make link inaccessible</p>
              </div>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                  isActive ? 'bg-brand-500' : 'bg-surface-3'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    isActive ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Artwork Update */}
          <div className="p-5 rounded-3xl bg-surface-1 border border-surface-border">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
              <ImageIcon size={16} className="text-brand-400" />
              Cover Artwork
            </h2>

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

            <div className="flex items-center gap-4">
              {artworkPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={artworkPreview}
                  alt="Artwork preview"
                  className="w-20 h-20 rounded-2xl object-cover border border-surface-border"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-surface-2 flex items-center justify-center text-white/30">
                  <ImageIcon size={28} />
                </div>
              )}

              <div>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => artworkInputRef.current?.click()}
                >
                  {artworkPreview ? 'Change Artwork' : 'Upload Artwork'}
                </Button>
                <p className="text-xs text-white/40 mt-1.5">
                  Square JPEG or PNG recommended
                </p>
              </div>
            </div>
          </div>

          {/* Personal Note */}
          <div className="p-5 rounded-3xl bg-surface-1 border border-surface-border space-y-3">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <span className="text-base">💌</span>
              Personal Note for Her
            </h2>
            <Textarea
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="A message for her on the delivery page..."
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={saving}
            className="w-full rounded-2xl py-3.5 shadow-xl shadow-brand-500/20 gap-2"
          >
            <Save size={18} />
            <span>Save Changes</span>
          </Button>
        </form>

        {/* Live Recipient Preview (5 cols) */}
        <div className="lg:col-span-5 sticky top-6">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/40">
              Live Preview
            </span>
            <span className="text-xs text-brand-300">Updated in real-time</span>
          </div>

          <div className="rounded-3xl border border-surface-border overflow-hidden bg-surface-1/50 shadow-2xl p-4">
            <DeliveryPreview
              title={title || delivery.title}
              artist={artist || delivery.artist}
              album={album || delivery.album || undefined}
              note={note}
              signature={"Built with 🫶🏻 by Dhurbb\nfor her shiuuuu 🦋"}
              artworkSrc={artworkPreview || undefined}
              artworkColor={delivery.artworkColor || '232,121,160'}
              fileSize={delivery.fileSize}
              duration={delivery.duration}
            />
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title={delivery.title}
        artist={delivery.artist}
        slug={delivery.slug}
        shareUrl={delivery.shareUrl}
      />
    </div>
  );
}

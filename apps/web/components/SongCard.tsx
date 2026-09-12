// Song4Her 🦋 — Song Card Component (Admin)
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Music2, Download, ExternalLink, Edit3, Trash2, Copy, Share2, Check } from 'lucide-react';
import type { AdminDelivery } from '@song4her/types';
import { cn, formatBytes, formatRelative } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { songs } from '@/lib/api';
import { useShare } from '@/hooks/useShare';
import { useClipboard } from '@/hooks/useClipboard';

interface SongCardProps {
  delivery: AdminDelivery;
  onDeleted?: (id: string) => void;
}

export function SongCard({ delivery, onDeleted }: SongCardProps) {
  const router = useRouter();
  const { share } = useShare();
  const { copied, copy } = useClipboard();
  const [deleting, setDeleting] = useState(false);
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied' | 'shared'>('idle');

  const artworkUrl = `/api/artwork/${delivery.slug}`;
  const shareUrl = delivery.shareUrl;

  const isExpired = delivery.expiresAt ? new Date() > new Date(delivery.expiresAt) : false;
  const isInactive = !delivery.isActive || isExpired;

  const handleDelete = async () => {
    if (!confirm(`Delete "${delivery.title}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await songs.delete(delivery.id);
      onDeleted?.(delivery.id);
    } catch {
      alert('Failed to delete. Try again.');
      setDeleting(false);
    }
  };

  const handleShare = async () => {
    const result = await share({
      url: shareUrl,
      title: `${delivery.title} — Song4Her 🦋`,
      text: 'A little song, just for you 🦋',
    });
    if (result === 'copied' || result === 'shared') {
      setShareStatus(result === 'shared' ? 'shared' : 'copied');
      setTimeout(() => setShareStatus('idle'), 2000);
    }
  };

  const handleCopyLink = async () => {
    await copy(shareUrl);
  };

  return (
    <div
      className={cn(
        'group relative flex gap-4 p-4 rounded-2xl border',
        'transition-all duration-200',
        isInactive
          ? 'border-surface-border bg-surface-1 opacity-60'
          : 'border-surface-border bg-surface-1 hover:bg-surface-2 hover:border-surface-4'
      )}
    >
      {/* Artwork */}
      <div className="relative flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-surface-3">
        {delivery.hasArtwork ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={artworkUrl}
            alt={delivery.title}
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music2 size={24} className="text-white/20" />
          </div>
        )}
        {/* Color indicator dot */}
        {delivery.artworkColor && (
          <div
            className="absolute bottom-1 right-1 w-2 h-2 rounded-full border border-black/30"
            style={{
              background: `rgb(${delivery.artworkColor})`
            }}
          />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 mb-1">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white truncate leading-tight">{delivery.title}</h3>
            <p className="text-sm text-white/50 truncate">{delivery.artist}</p>
          </div>
          {isInactive && (
            <span className="flex-shrink-0 badge bg-red-500/20 text-red-400">
              {isExpired ? 'Expired' : 'Inactive'}
            </span>
          )}
        </div>

        {/* Meta */}
        <div className="flex items-center gap-3 text-xs text-white/30 mt-2">
          <span className="uppercase font-mono">{delivery.format}</span>
          <span>•</span>
          <span>{formatBytes(delivery.fileSize)}</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Download size={10} />
            {delivery.downloadCount}
          </span>
          <span>•</span>
          <span>{formatRelative(delivery.createdAt)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-1.5 flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/admin/songs/${delivery.id}`)}
          title="Edit"
        >
          <Edit3 size={14} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopyLink}
          title="Copy link"
        >
          {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleShare}
          title="Share"
        >
          {shareStatus !== 'idle'
            ? <Check size={14} className="text-green-400" />
            : <Share2 size={14} />
          }
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.open(`/s/${delivery.slug}`, '_blank')}
          title="Preview"
        >
          <ExternalLink size={14} />
        </Button>
        <Button
          variant="danger"
          size="sm"
          onClick={handleDelete}
          loading={deleting}
          title="Delete"
        >
          <Trash2 size={14} />
        </Button>
      </div>
    </div>
  );
}

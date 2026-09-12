// Song4Her 🦋 — Share Modal Component
'use client';
import { useState } from 'react';
import { X, Copy, Check, MessageCircle, ExternalLink, QrCode, Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useClipboard } from '@/hooks/useClipboard';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  artist: string;
  slug: string;
  shareUrl: string;
}

export function ShareModal({
  isOpen,
  onClose,
  title,
  artist,
  slug,
  shareUrl,
}: ShareModalProps) {
  const { copied, copy } = useClipboard();
  const [showQr, setShowQr] = useState(false);

  if (!isOpen) return null;

  const qrImageUrl = `/api/qr/${slug}?format=png`;

  // WhatsApp share message
  const whatsappMessage = `Hey! Here is a song for you 🦋✨\n\n"${title}" by ${artist}\n\nListen & download it here:\n${shareUrl}`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md rounded-3xl bg-surface-1 border border-surface-border p-6 shadow-2xl z-10 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl animate-flutter">🦋</span>
            <div>
              <h3 className="font-semibold text-white text-base">Share Song Delivery</h3>
              <p className="text-xs text-white/50">{title} • {artist}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/40 hover:text-white hover:bg-surface-2 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Share Link Box */}
        <div className="mb-5">
          <label className="block text-xs font-medium text-white/60 mb-1.5">Recipient Link</label>
          <div className="flex items-center gap-2 p-2 rounded-xl bg-surface-2 border border-surface-border">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 bg-transparent text-sm text-white/90 outline-none px-2 select-all font-mono text-xs"
            />
            <Button
              size="sm"
              variant={copied ? 'secondary' : 'primary'}
              onClick={() => copy(shareUrl)}
              className="gap-1.5 flex-shrink-0"
            >
              {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </div>

        {/* Actions Grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {/* WhatsApp Direct Share */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-all font-medium text-sm text-center"
          >
            <MessageCircle size={18} />
            <span>WhatsApp</span>
          </a>

          {/* Toggle QR Code */}
          <button
            type="button"
            onClick={() => setShowQr(!showQr)}
            className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-surface-2 hover:bg-surface-3 text-white/80 border border-surface-border transition-all font-medium text-sm text-center"
          >
            <QrCode size={18} />
            <span>{showQr ? 'Hide QR' : 'Show QR'}</span>
          </button>
        </div>

        {/* QR Code Section */}
        {showQr && (
          <div className="p-4 mb-5 rounded-2xl bg-surface-2 border border-surface-border flex flex-col items-center animate-fade-in">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrImageUrl}
              alt="Delivery QR Code"
              className="w-44 h-44 rounded-xl bg-white p-2 mb-3 shadow-inner"
            />
            <div className="flex gap-2">
              <a
                href={qrImageUrl}
                download={`${title}-qr.png`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white/70 hover:text-white bg-surface-3 hover:bg-surface-4 transition-colors"
              >
                <Download size={13} />
                Save QR
              </a>
            </div>
          </div>
        )}

        {/* Open Preview Link */}
        <div className="pt-2 border-t border-surface-border flex justify-between items-center">
          <a
            href={`/s/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 transition-colors"
          >
            <ExternalLink size={13} />
            Open Recipient View
          </a>

          <Button size="sm" variant="ghost" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}

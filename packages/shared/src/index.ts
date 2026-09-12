// Song4Her 🦋 — Shared Utilities
import { customAlphabet } from 'nanoid';
import mime from 'mime-types';

// ─── Slug Generation ─────────────────────────────────────────────────────────

const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const generateId = customAlphabet(alphabet, 8);

export function generateSlug(): string {
  return generateId();
}

// ─── Formatting ──────────────────────────────────────────────────────────────

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatRelative(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}

// ─── MIME / Extension ────────────────────────────────────────────────────────

export function getExtension(mimeType: string): string {
  return mime.extension(mimeType) || 'bin';
}

export function getMimeType(filename: string): string {
  return mime.lookup(filename) || 'application/octet-stream';
}

export const SUPPORTED_AUDIO_TYPES = [
  'audio/mpeg',       // mp3
  'audio/mp4',        // m4a
  'audio/x-m4a',     // m4a
  'audio/ogg',        // ogg
  'audio/webm',       // webm
  'audio/flac',       // flac
  'audio/wav',        // wav
  'audio/aac',        // aac
];

export const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

export function isAudioFile(mimeType: string): boolean {
  return SUPPORTED_AUDIO_TYPES.includes(mimeType);
}

export function isImageFile(mimeType: string): boolean {
  return SUPPORTED_IMAGE_TYPES.includes(mimeType);
}

// ─── Expiry Calculation ───────────────────────────────────────────────────────

export function calculateExpiry(option: string): Date | null {
  const now = new Date();
  switch (option) {
    case '24h':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case '3d':
      return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    case '7d':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case 'never':
    default:
      return null;
  }
}

export function isExpired(expiresAt: Date | null): boolean {
  if (!expiresAt) return false;
  return new Date() > new Date(expiresAt);
}

// ─── Color Utilities ─────────────────────────────────────────────────────────

/** Parse "r,g,b" string to an object */
export function parseColor(colorStr: string | null): { r: number; g: number; b: number } {
  if (!colorStr) return { r: 120, g: 80, b: 160 }; // default purple
  const parts = colorStr.split(',').map(Number);
  return { r: parts[0] || 0, g: parts[1] || 0, b: parts[2] || 0 };
}

/** Darken a color component for gradients */
export function darkenColor(value: number, factor = 0.3): number {
  return Math.floor(value * factor);
}

// Song4Her 🦋 — Utility Functions
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function formatDuration(seconds: number | null): string {
  if (!seconds) return '';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatRelative(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return days === 1 ? 'yesterday' : `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}

export function formatDateShort(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** Parse "r,g,b" color string */
export function parseArtworkColor(color: string | null): { r: number; g: number; b: number } {
  if (!color) return { r: 120, g: 80, b: 160 };
  const [r, g, b] = color.split(',').map(Number);
  return { r: r ?? 120, g: g ?? 80, b: b ?? 160 };
}

/** Get a contrasting text color (white or near-black) for a background */
export function getContrastColor(r: number, g: number, b: number): 'white' | 'black' {
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? 'black' : 'white';
}

/** Truncate string to max length */
export function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max - 1) + '…';
}

/** Generate the share URL for a delivery */
export function getShareUrl(slug: string, tunnelUrl?: string | null): string {
  const base = tunnelUrl ?? window.location.origin;
  return `${base}/s/${slug}`;
}

/** Check if Web Share API is available */
export function canShare(): boolean {
  return typeof navigator !== 'undefined' && Boolean(navigator.share);
}

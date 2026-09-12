// Song4Her 🦋 — Shared TypeScript Types

// ─── Database Models ───────────────────────────────────────────────────────

export interface SongDelivery {
  id: string;
  slug: string;
  title: string;
  artist: string;
  album: string | null;
  duration: number | null;         // seconds
  format: string;                  // mp3, m4a, etc.
  mimeType: string;
  fileName: string;
  fileSize: number;                // bytes
  filePath: string;
  artworkPath: string | null;
  artworkColor: string | null;     // "r,g,b" e.g. "180,120,80"
  note: string;
  isActive: boolean;
  downloadCount: number;
  lastDownloaded: Date | null;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date | null;
}

export interface AppSettings {
  id: number;
  signature: string;
  defaultNote: string;
  defaultExpiry: string;
  accentColor: string;
  theme: string;
  displayName: string;
}

// ─── API Payloads ───────────────────────────────────────────────────────────

/** What the public recipient page receives — no file paths exposed */
export interface PublicDelivery {
  slug: string;
  title: string;
  artist: string;
  album: string | null;
  duration: number | null;
  format: string;
  fileSize: number;
  artworkColor: string | null;
  note: string;
  signature: string;
  accentColor: string;
  hasArtwork: boolean;
  isActive: boolean;
  expiresAt: string | null;
}

/** Song delivery as returned to the admin */
export interface AdminDelivery extends Omit<SongDelivery, 'filePath' | 'artworkPath'> {
  shareUrl: string;
  hasArtwork: boolean;
}

export interface CreateDeliveryInput {
  title?: string;
  artist?: string;
  album?: string;
  note?: string;
  expiresIn?: ExpiryOption;
}

export interface UpdateDeliveryInput {
  title?: string;
  artist?: string;
  album?: string;
  note?: string;
  expiresIn?: ExpiryOption;
}

export type ExpiryOption = 'never' | '24h' | '3d' | '7d' | 'custom';

// ─── System Status ──────────────────────────────────────────────────────────

export interface TunnelStatus {
  connected: boolean;
  url: string | null;
  error: string | null;
  startedAt: Date | null;
}

export interface ServerStatus {
  server: 'online' | 'offline';
  tunnel: TunnelStatus;
  storage: {
    totalSongs: number;
    totalSizeBytes: number;
    dataDir: string;
  };
  activeDeliveries: number;
  uptime: number;
}

// ─── Socket.IO Events ───────────────────────────────────────────────────────

export interface SocketEvents {
  // Server → Client
  'tunnel:connected': (data: { url: string }) => void;
  'tunnel:disconnected': (data: { error?: string }) => void;
  'tunnel:error': (data: { message: string }) => void;
  'processing:start': (data: { id: string; fileName: string }) => void;
  'processing:progress': (data: { id: string; percent: number; stage: string }) => void;
  'processing:complete': (data: { id: string; slug: string }) => void;
  'processing:error': (data: { id: string; message: string }) => void;
  'download:started': (data: { slug: string; title: string }) => void;
  'download:completed': (data: { slug: string; count: number }) => void;
  'delivery:expired': (data: { slug: string }) => void;
  // Client → Server
  'admin:join': () => void;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AuthSession {
  authenticated: boolean;
  loginAt?: string;
}

export interface LoginRequest {
  password: string;
}

// ─── Media Processing ────────────────────────────────────────────────────────

export interface MediaMetadata {
  title?: string;
  artist?: string;
  album?: string;
  duration?: number;
  format: string;
  mimeType: string;
  fileSize: number;
  bitrate?: number;
}

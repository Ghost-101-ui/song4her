// Song4Her 🦋 — API Client
import type {
  AdminDelivery,
  AppSettings,
  ServerStatus,
  TunnelStatus,
  MediaMetadata,
} from '@song4her/types';

const API_BASE = '/api';

// ─── Helper ───────────────────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new APIError(res.status, error.error || error.message || 'Request failed');
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export class APIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'APIError';
  }
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const auth = {
  login: (password: string) =>
    apiFetch<{ success: boolean }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),

  logout: () =>
    apiFetch<{ success: boolean }>('/auth/logout', { method: 'POST' }),

  session: () =>
    apiFetch<{ authenticated: boolean; loginAt?: string }>('/auth/session'),
};

// ─── Songs ────────────────────────────────────────────────────────────────────

export const songs = {
  list: (params?: { search?: string; limit?: number; offset?: number }) => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set('search', params.search);
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.offset) qs.set('offset', String(params.offset));
    return apiFetch<{
      deliveries: AdminDelivery[];
      total: number;
      tunnelUrl: string | null;
      settings: AppSettings;
    }>(`/songs?${qs}`);
  },

  get: (id: string) => apiFetch<AdminDelivery>(`/songs/${id}`),

  create: (formData: FormData) =>
    fetch(`${API_BASE}/songs`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
      // No Content-Type header — browser sets it with boundary for multipart
    }).then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Upload failed' }));
        throw new APIError(res.status, err.error);
      }
      return res.json() as Promise<AdminDelivery>;
    }),

  update: (id: string, data: Record<string, string | boolean | null>) =>
    apiFetch<AdminDelivery>(`/songs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  updateWithArtwork: (id: string, formData: FormData) =>
    fetch(`${API_BASE}/songs/${id}`, {
      method: 'PATCH',
      credentials: 'include',
      body: formData,
    }).then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Update failed' }));
        throw new APIError(res.status, err.error);
      }
      return res.json() as Promise<AdminDelivery>;
    }),

  delete: (id: string) =>
    apiFetch<void>(`/songs/${id}`, { method: 'DELETE' }),

  probe: (formData: FormData) =>
    fetch(`${API_BASE}/songs/probe`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    }).then((res) => res.json() as Promise<MediaMetadata>),
};

// ─── Status ───────────────────────────────────────────────────────────────────

export const status = {
  get: () => apiFetch<ServerStatus>('/status'),
  tunnel: () => apiFetch<TunnelStatus>('/tunnel'),
  restartTunnel: () =>
    apiFetch<TunnelStatus & { url: string | null }>('/tunnel/restart', { method: 'POST' }),
};

// ─── Settings ─────────────────────────────────────────────────────────────────

export const settings = {
  get: () => apiFetch<AppSettings>('/settings'),
  update: (data: Partial<AppSettings>) =>
    apiFetch<AppSettings>('/settings', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

// ─── Public ───────────────────────────────────────────────────────────────────

export const publicApi = {
  getDelivery: (slug: string) =>
    fetch(`${API_BASE}/public/${slug}`, { cache: 'no-store' }).then(async (res) => {
      if (res.status === 404) throw new APIError(404, 'not_found');
      if (res.status === 410) throw new APIError(410, 'expired');
      if (!res.ok) throw new APIError(res.status, 'error');
      return res.json();
    }),

  artworkUrl: (slug: string) => `${API_BASE}/artwork/${slug}`,
  downloadUrl: (slug: string) => `${API_BASE}/download/${slug}`,
  streamUrl: (slug: string) => `${API_BASE}/stream/${slug}`,
  qrUrl: (slug: string) => `${API_BASE}/qr/${slug}`,
};

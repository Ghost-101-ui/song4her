// Song4Her 🦋 — Zero-Native Pure TypeScript Database Client
// 100% compatible with Android Termux (Bionic libc) & Windows/Mac/Linux. Zero C++/Rust binaries.
import fs from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { SongDelivery, AppSettings } from '@song4her/types';

export interface DatabaseData {
  settings: AppSettings;
  deliveries: SongDelivery[];
}

const DEFAULT_SETTINGS: AppSettings = {
  id: 1,
  signature: 'Built with 🫶🏻 by Dhurbb\nfor her shiuuuu 🦋',
  defaultNote: '',
  defaultExpiry: 'never',
  accentColor: '#e879a0',
  theme: 'dark',
  displayName: 'Dhurbb',
};

function resolveDbPath(): string {
  const dataDir = process.env.DATA_DIR || './data';
  const resolved = path.isAbsolute(dataDir) ? dataDir : path.resolve(process.cwd(), dataDir);
  return path.join(resolved, 'database', 'song4her.json');
}

export class JsonDatabase {
  private filePath: string;
  private data: DatabaseData | null = null;
  private writePromise: Promise<void> = Promise.resolve();

  constructor() {
    this.filePath = resolveDbPath();
  }

  private async load(): Promise<DatabaseData> {
    if (this.data) return this.data;

    const dir = path.dirname(this.filePath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    if (existsSync(this.filePath)) {
      try {
        const raw = await fs.readFile(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        this.data = {
          settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
          deliveries: (parsed.deliveries || []).map((d: any) => ({
            ...d,
            createdAt: new Date(d.createdAt),
            updatedAt: new Date(d.updatedAt),
            lastDownloaded: d.lastDownloaded ? new Date(d.lastDownloaded) : null,
            expiresAt: d.expiresAt ? new Date(d.expiresAt) : null,
          })),
        };
        return this.data;
      } catch (err) {
        console.warn('[DB] Failed to parse existing db, initializing defaults:', err);
      }
    }

    this.data = {
      settings: { ...DEFAULT_SETTINGS },
      deliveries: [],
    };
    await this.persist();
    return this.data;
  }

  private async persist(): Promise<void> {
    if (!this.data) return;
    const dir = path.dirname(this.filePath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    const tmpPath = `${this.filePath}.${Date.now()}.tmp`;
    const jsonStr = JSON.stringify(this.data, null, 2);

    // Chain writes to prevent concurrent write collisions
    this.writePromise = this.writePromise.then(async () => {
      await fs.writeFile(tmpPath, jsonStr, 'utf-8');
      await fs.rename(tmpPath, this.filePath);
    });

    await this.writePromise;
  }

  // ─── Lifecycle ─────────────────────────────────────────────────────────────

  async $connect(): Promise<void> {
    await this.load();
  }

  async $disconnect(): Promise<void> {
    await this.writePromise;
  }

  // ─── Settings API ──────────────────────────────────────────────────────────

  settings = {
    findUnique: async (_args?: { where: { id: number } }): Promise<AppSettings | null> => {
      const data = await this.load();
      return { ...data.settings };
    },

    create: async (args: { data: Partial<AppSettings> & { id?: number } }): Promise<AppSettings> => {
      const data = await this.load();
      data.settings = { ...DEFAULT_SETTINGS, ...args.data, id: 1 };
      await this.persist();
      return { ...data.settings };
    },

    update: async (args: { where: { id: number }; data: Partial<AppSettings> }): Promise<AppSettings> => {
      const data = await this.load();
      data.settings = { ...data.settings, ...args.data, id: 1 };
      await this.persist();
      return { ...data.settings };
    },

    upsert: async (args: {
      where: { id: number };
      update: Partial<AppSettings>;
      create: Partial<AppSettings>;
    }): Promise<AppSettings> => {
      const data = await this.load();
      if (!data.settings) {
        data.settings = { ...DEFAULT_SETTINGS, ...args.create, id: 1 };
      } else {
        data.settings = { ...data.settings, ...args.update, id: 1 };
      }
      await this.persist();
      return { ...data.settings };
    },
  };

  // ─── SongDelivery API ──────────────────────────────────────────────────────

  songDelivery = {
    findUnique: async (args: {
      where: { id?: string; slug?: string };
      select?: Record<string, boolean>;
    }): Promise<any | null> => {
      const data = await this.load();
      const item = data.deliveries.find((d) => {
        if (args.where.id && d.id === args.where.id) return true;
        if (args.where.slug && d.slug === args.where.slug) return true;
        return false;
      });
      if (!item) return null;

      if (args.select) {
        const picked: any = {};
        for (const key of Object.keys(args.select)) {
          if (args.select[key]) picked[key] = (item as any)[key];
        }
        return picked;
      }

      return { ...item };
    },

    findMany: async (args?: {
      where?: {
        id?: string;
        slug?: string;
        isActive?: boolean;
        expiresAt?: { lte?: Date };
        OR?: Array<{
          title?: { contains?: string };
          artist?: { contains?: string };
        }>;
      };
      orderBy?: { [key: string]: 'asc' | 'desc' };
      take?: number;
      skip?: number;
      select?: Record<string, boolean>;
    }): Promise<any[]> => {
      const data = await this.load();
      let list = [...data.deliveries];

      // Filter
      if (args?.where) {
        const { isActive, expiresAt, OR } = args.where;

        if (isActive !== undefined) {
          list = list.filter((d) => d.isActive === isActive);
        }

        if (expiresAt?.lte) {
          const lteDate = new Date(expiresAt.lte).getTime();
          list = list.filter((d) => d.expiresAt && new Date(d.expiresAt).getTime() <= lteDate);
        }

        if (OR && OR.length > 0) {
          list = list.filter((d) => {
            return OR.some((condition) => {
              if (condition.title?.contains) {
                const term = condition.title.contains.toLowerCase();
                if (d.title.toLowerCase().includes(term)) return true;
              }
              if (condition.artist?.contains) {
                const term = condition.artist.contains.toLowerCase();
                if (d.artist.toLowerCase().includes(term)) return true;
              }
              return false;
            });
          });
        }
      }

      // Sort
      if (args?.orderBy) {
        const [field, direction] = Object.entries(args.orderBy)[0] || ['createdAt', 'desc'];
        const isAsc = direction === 'asc';
        list.sort((a: any, b: any) => {
          const valA = a[field] instanceof Date ? a[field].getTime() : a[field];
          const valB = b[field] instanceof Date ? b[field].getTime() : b[field];
          if (valA < valB) return isAsc ? -1 : 1;
          if (valA > valB) return isAsc ? 1 : -1;
          return 0;
        });
      }

      // Pagination
      const skip = args?.skip || 0;
      const take = args?.take !== undefined ? args.take : list.length;
      list = list.slice(skip, skip + take);

      // Field selection if requested
      if (args?.select) {
        const keys = Object.keys(args.select).filter((k) => args.select![k]);
        return list.map((item: any) => {
          const picked: any = {};
          for (const key of keys) {
            picked[key] = item[key];
          }
          return picked;
        });
      }

      return list.map((d) => ({ ...d }));
    },

    count: async (args?: {
      where?: {
        isActive?: boolean;
        OR?: Array<{
          title?: { contains?: string };
          artist?: { contains?: string };
        }>;
      };
    }): Promise<number> => {
      const items = await this.songDelivery.findMany({ where: args?.where });
      return items.length;
    },

    create: async (args: { data: Omit<SongDelivery, 'id' | 'createdAt' | 'updatedAt' | 'downloadCount' | 'lastDownloaded' | 'isActive'> & {
      downloadCount?: number;
      isActive?: boolean;
    } }): Promise<SongDelivery> => {
      const data = await this.load();
      const now = new Date();
      const newDelivery: SongDelivery = {
        id: `sd_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`,
        slug: args.data.slug,
        title: args.data.title,
        artist: args.data.artist,
        album: args.data.album ?? null,
        duration: args.data.duration ?? null,
        format: args.data.format,
        mimeType: args.data.mimeType,
        fileName: args.data.fileName,
        fileSize: args.data.fileSize,
        filePath: args.data.filePath,
        artworkPath: args.data.artworkPath ?? null,
        artworkColor: args.data.artworkColor ?? null,
        note: args.data.note ?? '',
        isActive: args.data.isActive ?? true,
        downloadCount: args.data.downloadCount ?? 0,
        lastDownloaded: null,
        createdAt: now,
        updatedAt: now,
        expiresAt: args.data.expiresAt ? new Date(args.data.expiresAt) : null,
      };

      data.deliveries.unshift(newDelivery);
      await this.persist();
      return { ...newDelivery };
    },

    update: async (args: {
      where: { id?: string; slug?: string };
      data: any;
    }): Promise<SongDelivery> => {
      const data = await this.load();
      const index = data.deliveries.findIndex((d) => {
        if (args.where.id && d.id === args.where.id) return true;
        if (args.where.slug && d.slug === args.where.slug) return true;
        return false;
      });

      if (index === -1) {
        throw new Error(`SongDelivery not found for update`);
      }

      const existing = data.deliveries[index];
      const updatePayload = { ...args.data };

      // Handle increment operations like downloadCount: { increment: 1 }
      if (updatePayload.downloadCount && typeof updatePayload.downloadCount === 'object') {
        if ('increment' in updatePayload.downloadCount) {
          updatePayload.downloadCount = existing.downloadCount + (updatePayload.downloadCount.increment || 1);
        }
      }

      const updated: SongDelivery = {
        ...existing,
        ...updatePayload,
        updatedAt: new Date(),
      };

      data.deliveries[index] = updated;
      await this.persist();
      return { ...updated };
    },

    delete: async (args: {
      where: { id?: string; slug?: string };
    }): Promise<SongDelivery> => {
      const data = await this.load();
      const index = data.deliveries.findIndex((d) => {
        if (args.where.id && d.id === args.where.id) return true;
        if (args.where.slug && d.slug === args.where.slug) return true;
        return false;
      });

      if (index === -1) {
        throw new Error(`SongDelivery not found for delete`);
      }

      const [deleted] = data.deliveries.splice(index, 1);
      await this.persist();
      return { ...deleted };
    },
  };
}

// Global singleton instance (mirrors Prisma client singleton pattern)
declare global {
  // eslint-disable-next-line no-var
  var __db: JsonDatabase | undefined;
}

export const prisma: JsonDatabase =
  globalThis.__db ?? new JsonDatabase();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__db = prisma;
}

export default prisma;

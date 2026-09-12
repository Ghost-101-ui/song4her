// Song4Her 🦋 — Storage Service
import fs from 'fs/promises';
import { createWriteStream, createReadStream } from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import type { Readable } from 'stream';
import { config } from '../config/index.js';

// ─── Directory Initialization ─────────────────────────────────────────────────

export async function ensureDataDirectories(): Promise<void> {
  const dirs = [
    config.dataDir,
    config.songsDir,
    config.artworkDir,
    config.tempDir,
    config.dbDir,
  ];
  for (const dir of dirs) {
    await fs.mkdir(dir, { recursive: true });
  }
}

// ─── Temp File Management ─────────────────────────────────────────────────────

export function getTempPath(filename: string): string {
  return path.join(config.tempDir, filename);
}

export async function cleanTempFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch {
    // ignore if file doesn't exist
  }
}

/** Save a readable stream to a temp file. Returns the temp file path. */
export async function saveTempFile(
  stream: Readable,
  filename: string
): Promise<string> {
  const tempPath = getTempPath(`${Date.now()}-${path.basename(filename)}`);
  const writeStream = createWriteStream(tempPath);
  await pipeline(stream, writeStream);
  return tempPath;
}

// ─── Permanent File Storage ───────────────────────────────────────────────────

/** Move a temp file to permanent songs storage. */
export async function saveSongFile(
  tempPath: string,
  slug: string,
  extension: string
): Promise<string> {
  const destPath = path.join(config.songsDir, `${slug}.${extension}`);
  await fs.rename(tempPath, destPath);
  return destPath;
}

/** Move a temp artwork file to permanent artwork storage. */
export async function saveArtworkFile(
  tempPath: string,
  slug: string
): Promise<string> {
  const destPath = path.join(config.artworkDir, `${slug}.jpg`);
  await fs.rename(tempPath, destPath);
  return destPath;
}

/** Save artwork from a buffer to permanent artwork storage. */
export async function saveArtworkBuffer(
  buffer: Buffer,
  slug: string
): Promise<string> {
  const destPath = path.join(config.artworkDir, `${slug}.jpg`);
  await fs.writeFile(destPath, buffer);
  return destPath;
}

// ─── File Deletion ────────────────────────────────────────────────────────────

export async function deleteDeliveryFiles(
  filePath: string,
  artworkPath: string | null
): Promise<void> {
  const toDelete = [filePath, artworkPath].filter(Boolean) as string[];
  await Promise.allSettled(toDelete.map((f) => fs.unlink(f)));
}

// ─── File Info ────────────────────────────────────────────────────────────────

export async function getFileSize(filePath: string): Promise<number> {
  const stat = await fs.stat(filePath);
  return stat.size;
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/** Get total storage usage in bytes for songs and artwork */
export async function getStorageStats(): Promise<{
  totalSizeBytes: number;
  totalSongs: number;
}> {
  let totalSizeBytes = 0;
  let totalSongs = 0;

  for (const dir of [config.songsDir, config.artworkDir]) {
    try {
      const files = await fs.readdir(dir);
      for (const file of files) {
        const stat = await fs.stat(path.join(dir, file));
        totalSizeBytes += stat.size;
      }
      if (dir === config.songsDir) totalSongs = files.length;
    } catch {
      // directory may not exist yet
    }
  }

  return { totalSizeBytes, totalSongs };
}

// ─── Stream Helper ────────────────────────────────────────────────────────────

export function createSongReadStream(
  filePath: string,
  options?: { start?: number; end?: number }
): ReturnType<typeof createReadStream> {
  return createReadStream(filePath, options);
}

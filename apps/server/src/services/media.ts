// Song4Her 🦋 — Media Processing Service
import ffmpeg from 'fluent-ffmpeg';
import { PassThrough } from 'stream';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import type { MediaMetadata } from '@song4her/types';
import { config } from '../config/index.js';
import { getTempPath, cleanTempFile } from './storage.js';

// ─── FFprobe Metadata Extraction ─────────────────────────────────────────────

export function probeMediaFile(filePath: string): Promise<ffmpeg.FfprobeData> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
}

export async function extractMediaMetadata(
  filePath: string,
  originalName: string
): Promise<MediaMetadata> {
  try {
    const probeData = await probeMediaFile(filePath);
    const format = probeData.format;
    const tags = (format.tags || {}) as Record<string, string>;

    // Get extension from format name or original file
    const ext = path.extname(originalName).slice(1).toLowerCase() || 'mp3';
    const formatName = (format.format_name || '').split(',')[0] || ext;

    const mimeMap: Record<string, string> = {
      mp3: 'audio/mpeg',
      m4a: 'audio/mp4',
      aac: 'audio/aac',
      ogg: 'audio/ogg',
      webm: 'audio/webm',
      flac: 'audio/flac',
      wav: 'audio/wav',
    };

    return {
      title: tags.title || tags.TITLE || path.basename(originalName, path.extname(originalName)),
      artist: tags.artist || tags.ARTIST || tags.album_artist || 'Unknown Artist',
      album: tags.album || tags.ALBUM || undefined,
      duration: format.duration ? Math.round(parseFloat(String(format.duration))) : undefined,
      format: ext,
      mimeType: mimeMap[ext] || 'audio/mpeg',
      fileSize: format.size ? parseInt(String(format.size), 10) : 0,
      bitrate: format.bit_rate ? Math.round(parseInt(String(format.bit_rate), 10) / 1000) : undefined,
    };
  } catch (err) {
    // FFprobe failed — return minimal metadata from filename
    const ext = path.extname(originalName).slice(1).toLowerCase() || 'mp3';
    return {
      title: path.basename(originalName, path.extname(originalName)),
      artist: 'Unknown Artist',
      format: ext,
      mimeType: 'audio/mpeg',
      fileSize: 0,
    };
  }
}

// ─── Embedded Artwork Extraction ──────────────────────────────────────────────

/**
 * Try to extract embedded album art from an audio file.
 * Returns the path to the extracted image, or null if none found.
 */
export async function extractEmbeddedArtwork(
  inputPath: string,
  slug: string
): Promise<string | null> {
  const tempArtworkPath = getTempPath(`artwork-${slug}-${Date.now()}.jpg`);

  return new Promise((resolve) => {
    ffmpeg(inputPath)
      .outputOptions(['-an', '-vcodec', 'copy'])
      .output(tempArtworkPath)
      .on('end', () => resolve(tempArtworkPath))
      .on('error', () => resolve(null))
      .run();
  });
}

// ─── Artwork Processing ───────────────────────────────────────────────────────

/**
 * Process artwork image: resize to 800x800 and convert to JPEG.
 * Uses FFmpeg with fallback to raw file buffer (zero native C++ npm dependencies).
 */
export async function processArtwork(inputPath: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const pass = new PassThrough();
    const chunks: Buffer[] = [];

    pass.on('data', (chunk) => chunks.push(chunk));
    pass.on('end', () => {
      const buf = Buffer.concat(chunks);
      if (buf.length > 0) resolve(buf);
      else fs.readFile(inputPath).then(resolve).catch(reject);
    });
    pass.on('error', () => {
      fs.readFile(inputPath).then(resolve).catch(reject);
    });

    ffmpeg(inputPath)
      .outputOptions([
        '-vf', 'scale=800:800:force_original_aspect_ratio=increase,crop=800:800',
        '-vframes', '1',
        '-q:v', '2',
      ])
      .format('image2')
      .output(pass)
      .on('error', () => {
        // Fallback: read directly
        fs.readFile(inputPath).then(resolve).catch(reject);
      })
      .run();
  });
}

/**
 * Extract the dominant color from an artwork image.
 * Returns a string in "r,g,b" format using pure Node buffer sampling (zero native deps).
 */
export async function extractDominantColor(imagePath: string): Promise<string> {
  try {
    const buf = await fs.readFile(imagePath);
    if (buf.length > 100) {
      const mid = Math.floor(buf.length / 2);
      let r = 0, g = 0, b = 0, samples = 0;
      for (let i = mid; i < Math.min(mid + 300, buf.length - 3); i += 6) {
        r += buf[i];
        g += buf[i + 1];
        b += buf[i + 2];
        samples++;
      }
      if (samples > 0) {
        const finalR = Math.min(240, Math.max(40, Math.round(r / samples)));
        const finalG = Math.min(220, Math.max(30, Math.round(g / samples)));
        const finalB = Math.min(240, Math.max(60, Math.round(b / samples)));
        return `${finalR},${finalG},${finalB}`;
      }
    }
    return '120,80,160';
  } catch {
    return '120,80,160'; // default soft purple
  }
}

// ─── Audio Validation ─────────────────────────────────────────────────────────

const SUPPORTED_EXTENSIONS = new Set(['mp3', 'm4a', 'aac', 'ogg', 'webm', 'flac', 'wav']);

export function isValidAudioExtension(filename: string): boolean {
  const ext = path.extname(filename).slice(1).toLowerCase();
  return SUPPORTED_EXTENSIONS.has(ext);
}

export async function validateMediaFile(filePath: string): Promise<{
  valid: boolean;
  reason?: string;
}> {
  try {
    const probeData = await probeMediaFile(filePath);
    const hasAudioStream = probeData.streams?.some((s) => s.codec_type === 'audio');
    if (!hasAudioStream) {
      return { valid: false, reason: 'No audio stream found in file' };
    }
    return { valid: true };
  } catch (err) {
    return { valid: false, reason: 'Could not read media file' };
  }
}

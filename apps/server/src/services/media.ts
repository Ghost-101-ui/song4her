// Song4Her 🦋 — Media Processing Service
import ffmpeg from 'fluent-ffmpeg';
import sharp from 'sharp';
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
 * Process artwork image: resize to reasonable dimensions and convert to JPEG.
 * Returns a buffer of the processed image.
 */
export async function processArtwork(inputPath: string): Promise<Buffer> {
  return sharp(inputPath)
    .resize(800, 800, {
      fit: 'cover',
      position: 'center',
    })
    .jpeg({ quality: 90, progressive: true })
    .toBuffer();
}

/**
 * Extract the dominant color from an artwork image.
 * Returns a string in "r,g,b" format.
 */
export async function extractDominantColor(imagePath: string): Promise<string> {
  try {
    const { data } = await sharp(imagePath)
      .resize(1, 1, { fit: 'cover' })
      .raw()
      .toBuffer({ resolveWithObject: true });

    const r = data[0] ?? 120;
    const g = data[1] ?? 80;
    const b = data[2] ?? 160;

    return `${r},${g},${b}`;
  } catch {
    return '120,80,160'; // default purple
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

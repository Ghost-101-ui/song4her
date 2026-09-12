// Song4Her 🦋 — Song CRUD Routes
import type { FastifyInstance } from 'fastify';
import path from 'path';
import fs from 'fs/promises';
import mime from 'mime-types';
import prisma from '@song4her/database';
import { generateSlug, calculateExpiry, isExpired, getExtension } from '@song4her/shared';
import { requireAuth } from '../auth/index.js';
import {
  saveTempFile,
  saveArtworkBuffer,
  saveSongFile,
  deleteDeliveryFiles,
  getFileSize,
  fileExists,
  cleanTempFile,
} from '../services/storage.js';
import {
  extractMediaMetadata,
  extractEmbeddedArtwork,
  processArtwork,
  extractDominantColor,
  validateMediaFile,
  isValidAudioExtension,
} from '../services/media.js';
import {
  emitProcessingStart,
  emitProcessingProgress,
  emitProcessingComplete,
  emitProcessingError,
} from '../socket/index.js';
import { getTunnelUrl } from '../services/tunnel.js';
import { config } from '../config/index.js';

function buildShareUrl(slug: string): string {
  const tunnelUrl = getTunnelUrl();
  const base = tunnelUrl ?? `http://localhost:${config.webPort}`;
  return `${base}/s/${slug}`;
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._\-]/g, '_').slice(0, 200);
}

export async function songRoutes(app: FastifyInstance): Promise<void> {

  // ─── GET /api/songs ──────────────────────────────────────────────────────
  app.get('/api/songs', { preHandler: requireAuth }, async (request, reply) => {
    const query = request.query as { search?: string; limit?: string; offset?: string };
    const limit = Math.min(parseInt(query.limit || '50', 10), 100);
    const offset = parseInt(query.offset || '0', 10);

    const where = query.search
      ? {
          OR: [
            { title: { contains: query.search } },
            { artist: { contains: query.search } },
          ],
        }
      : {};

    const [deliveries, total] = await Promise.all([
      prisma.songDelivery.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true, slug: true, title: true, artist: true, album: true,
          format: true, fileSize: true, artworkColor: true, note: true,
          isActive: true, downloadCount: true, lastDownloaded: true,
          createdAt: true, updatedAt: true, expiresAt: true,
        },
      }),
      prisma.songDelivery.count({ where }),
    ]);

    const settings = await prisma.settings.findUnique({ where: { id: 1 } });
    const tunnelUrl = getTunnelUrl();

    return reply.send({
      deliveries: deliveries.map((d: any) => ({
        ...d,
        shareUrl: buildShareUrl(d.slug),
        hasArtwork: Boolean(d.artworkColor),
      })),
      total,
      tunnelUrl,
      settings,
    });
  });

  // ─── POST /api/songs ─────────────────────────────────────────────────────
  app.post('/api/songs', { preHandler: requireAuth }, async (request, reply) => {
    const parts = request.parts();

    let audioTempPath: string | null = null;
    let artworkTempPath: string | null = null;
    const fields: Record<string, string> = {};
    let originalFileName = '';
    let audioMimeType = '';

    try {
      for await (const part of parts) {
        if (part.type === 'file') {
          if (part.fieldname === 'file') {
            if (!isValidAudioExtension(part.filename)) {
              return reply.code(400).send({ error: 'Unsupported audio format' });
            }
            originalFileName = sanitizeFilename(part.filename);
            audioMimeType = part.mimetype || mime.lookup(part.filename) || 'audio/mpeg';
            audioTempPath = await saveTempFile(part.file, originalFileName);
          } else if (part.fieldname === 'artwork') {
            artworkTempPath = await saveTempFile(part.file, `artwork-${part.filename}`);
          }
        } else {
          fields[part.fieldname] = part.value as string;
        }
      }

      if (!audioTempPath) {
        return reply.code(400).send({ error: 'Audio file is required' });
      }

      // Validate the audio file
      const validation = await validateMediaFile(audioTempPath);
      if (!validation.valid) {
        return reply.code(400).send({ error: validation.reason });
      }

      // Generate unique slug
      let slug = generateSlug();
      let attempts = 0;
      while (await prisma.songDelivery.findUnique({ where: { slug } })) {
        slug = generateSlug();
        if (++attempts > 10) throw new Error('Failed to generate unique slug');
      }

      const processingId = `proc_${slug}`;
      emitProcessingStart(processingId, originalFileName);

      // Extract metadata from file
      emitProcessingProgress(processingId, 20, 'Extracting metadata');
      const fileMeta = await extractMediaMetadata(audioTempPath, originalFileName);

      // Merge with user-provided metadata
      const title = fields.title?.trim() || fileMeta.title || path.basename(originalFileName, path.extname(originalFileName));
      const artist = fields.artist?.trim() || fileMeta.artist || 'Unknown Artist';
      const album = fields.album?.trim() || fileMeta.album || null;
      const note = fields.note?.trim() || '';
      const expiresIn = fields.expiresIn || 'never';

      const ext = path.extname(originalFileName).slice(1).toLowerCase() || 'mp3';
      const mimeType = audioMimeType || fileMeta.mimeType;

      // Process and save audio file
      emitProcessingProgress(processingId, 40, 'Saving audio file');
      const finalFilePath = await saveSongFile(audioTempPath, slug, ext);
      audioTempPath = null; // moved, don't clean up temp
      const fileSize = await getFileSize(finalFilePath);

      // Process artwork
      emitProcessingProgress(processingId, 60, 'Processing artwork');
      let artworkPath: string | null = null;
      let artworkColor: string | null = null;

      // Try user-uploaded artwork first
      if (artworkTempPath && await fileExists(artworkTempPath)) {
        const artworkBuffer = await processArtwork(artworkTempPath);
        artworkPath = await saveArtworkBuffer(artworkBuffer, slug);
        artworkColor = await extractDominantColor(artworkPath);
        await cleanTempFile(artworkTempPath);
        artworkTempPath = null;
      } else {
        // Try to extract embedded artwork from audio
        const embeddedPath = await extractEmbeddedArtwork(finalFilePath, slug);
        if (embeddedPath) {
          try {
            const artworkBuffer = await processArtwork(embeddedPath);
            artworkPath = await saveArtworkBuffer(artworkBuffer, slug);
            artworkColor = await extractDominantColor(artworkPath);
          } catch {
            // No artwork found or processing failed
          } finally {
            await cleanTempFile(embeddedPath);
          }
        }
      }

      emitProcessingProgress(processingId, 80, 'Saving to database');

      // Create database record
      const delivery = await prisma.songDelivery.create({
        data: {
          slug,
          title,
          artist,
          album,
          duration: fileMeta.duration ?? null,
          format: ext,
          mimeType,
          fileName: originalFileName,
          fileSize,
          filePath: finalFilePath,
          artworkPath,
          artworkColor,
          note,
          expiresAt: calculateExpiry(expiresIn),
        },
      });

      emitProcessingProgress(processingId, 100, 'Ready');
      emitProcessingComplete(processingId, slug);

      return reply.code(201).send({
        ...delivery,
        shareUrl: buildShareUrl(slug),
        hasArtwork: Boolean(artworkPath),
      });

    } catch (err) {
      // Cleanup on error
      if (audioTempPath) await cleanTempFile(audioTempPath).catch(() => {});
      if (artworkTempPath) await cleanTempFile(artworkTempPath).catch(() => {});
      console.error('[SONGS] Create error:', err);
      return reply.code(500).send({ error: 'Failed to create delivery' });
    }
  });

  // ─── GET /api/songs/:id ──────────────────────────────────────────────────
  app.get('/api/songs/:id', { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const delivery = await prisma.songDelivery.findUnique({ where: { id } });
    if (!delivery) return reply.code(404).send({ error: 'Not found' });

    return reply.send({
      ...delivery,
      shareUrl: buildShareUrl(delivery.slug),
      hasArtwork: Boolean(delivery.artworkPath),
    });
  });

  // ─── PATCH /api/songs/:id ────────────────────────────────────────────────
  app.patch('/api/songs/:id', { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const existing = await prisma.songDelivery.findUnique({ where: { id } });
    if (!existing) return reply.code(404).send({ error: 'Not found' });

    // Check if this is a multipart request (has artwork)
    const contentType = request.headers['content-type'] || '';

    let updateData: Record<string, unknown> = {};
    let artworkTempPath: string | null = null;

    if (contentType.includes('multipart/form-data')) {
      const parts = request.parts();
      const fields: Record<string, string> = {};

      for await (const part of parts) {
        if (part.type === 'file' && part.fieldname === 'artwork') {
          artworkTempPath = await saveTempFile(part.file, `artwork-${part.filename}`);
        } else if (part.type !== 'file') {
          fields[part.fieldname] = part.value as string;
        }
      }

      if (fields.title !== undefined) updateData.title = fields.title.trim();
      if (fields.artist !== undefined) updateData.artist = fields.artist.trim();
      if (fields.album !== undefined) updateData.album = fields.album.trim() || null;
      if (fields.note !== undefined) updateData.note = fields.note;
      if (fields.expiresIn !== undefined) updateData.expiresAt = calculateExpiry(fields.expiresIn);

      if (artworkTempPath) {
        try {
          const artworkBuffer = await processArtwork(artworkTempPath);
          const artworkPath = await saveArtworkBuffer(artworkBuffer, existing.slug);
          const artworkColor = await extractDominantColor(artworkPath);
          updateData.artworkPath = artworkPath;
          updateData.artworkColor = artworkColor;
        } finally {
          await cleanTempFile(artworkTempPath);
        }
      }
    } else {
      const body = request.body as Record<string, unknown>;
      if (body.title !== undefined) updateData.title = String(body.title).trim();
      if (body.artist !== undefined) updateData.artist = String(body.artist).trim();
      if (body.album !== undefined) updateData.album = body.album ? String(body.album).trim() : null;
      if (body.note !== undefined) updateData.note = String(body.note);
      if (body.expiresIn !== undefined) updateData.expiresAt = calculateExpiry(String(body.expiresIn));
      if (body.isActive !== undefined) updateData.isActive = Boolean(body.isActive);
    }

    const updated = await prisma.songDelivery.update({
      where: { id },
      data: updateData,
    });

    return reply.send({
      ...updated,
      shareUrl: buildShareUrl(updated.slug),
      hasArtwork: Boolean(updated.artworkPath),
    });
  });

  // ─── DELETE /api/songs/:id ───────────────────────────────────────────────
  app.delete('/api/songs/:id', { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const delivery = await prisma.songDelivery.findUnique({ where: { id } });
    if (!delivery) return reply.code(404).send({ error: 'Not found' });

    await prisma.songDelivery.delete({ where: { id } });
    await deleteDeliveryFiles(delivery.filePath, delivery.artworkPath);

    return reply.code(204).send();
  });

  // ─── POST /api/songs/:id/metadata-extract ────────────────────────────────
  // Extract metadata from already-uploaded file (used in the "edit" flow)
  app.post('/api/songs/probe', { preHandler: requireAuth }, async (request, reply) => {
    const parts = request.parts();
    let tempPath: string | null = null;
    let originalName = 'audio.mp3';

    try {
      for await (const part of parts) {
        if (part.type === 'file' && part.fieldname === 'file') {
          originalName = part.filename;
          tempPath = await saveTempFile(part.file, originalName);
          break;
        }
      }

      if (!tempPath) return reply.code(400).send({ error: 'File required' });

      const metadata = await extractMediaMetadata(tempPath, originalName);
      return reply.send(metadata);
    } finally {
      if (tempPath) await cleanTempFile(tempPath).catch(() => {});
    }
  });
}

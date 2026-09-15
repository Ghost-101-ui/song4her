// Song4Her 🦋 — Public Routes (recipient-facing)
import type { FastifyInstance } from 'fastify';
import { createReadStream } from 'fs';
import fs from 'fs/promises';
import path from 'path';
import mime from 'mime-types';
import QRCode from 'qrcode';
import prisma from '@song4her/database';
import { isExpired } from '@song4her/shared';
import { config } from '../config/index.js';
import { getTunnelUrl } from '../services/tunnel.js';
import { emitDownloadStarted, emitDownloadCompleted } from '../socket/index.js';

export async function publicRoutes(app: FastifyInstance): Promise<void> {

  // ─── GET /api/public/:slug ────────────────────────────────────────────────
  // Returns public delivery info (no file paths) for the recipient page
  app.get('/api/public/:slug', async (request, reply) => {
    const { slug } = request.params as { slug: string };

    const delivery = await prisma.songDelivery.findUnique({ where: { slug } });

    if (!delivery) {
      return reply.code(404).send({ error: 'not_found' });
    }

    if (!delivery.isActive || isExpired(delivery.expiresAt)) {
      return reply.code(410).send({ error: 'expired' });
    }

    const settings = await prisma.settings.findUnique({ where: { id: 1 } });

    return reply.send({
      slug: delivery.slug,
      title: delivery.title,
      artist: delivery.artist,
      album: delivery.album,
      duration: delivery.duration,
      format: delivery.format,
      fileSize: delivery.fileSize,
      artworkColor: delivery.artworkColor,
      note: delivery.note,
      hasArtwork: Boolean(delivery.artworkPath),
      isActive: delivery.isActive,
      expiresAt: delivery.expiresAt?.toISOString() ?? null,
      signature: settings?.signature ?? 'Built with 🫶🏻 by Dhurbb\nfor her shiuuuu 🦋',
      accentColor: settings?.accentColor ?? '#e879a0',
    });
  });

  // ─── GET /api/artwork/:slug ───────────────────────────────────────────────
  app.get('/api/artwork/:slug', async (request, reply) => {
    const { slug } = request.params as { slug: string };

    const delivery = await prisma.songDelivery.findUnique({
      where: { slug },
      select: { artworkPath: true, isActive: true },
    });

    if (!delivery || !delivery.artworkPath) {
      return reply.code(404).send({ error: 'No artwork' });
    }

    try {
      await fs.access(delivery.artworkPath);
      const stream = createReadStream(delivery.artworkPath);
      return reply
        .header('Content-Type', 'image/jpeg')
        .header('Cache-Control', 'public, max-age=3600')
        .send(stream);
    } catch {
      return reply.code(404).send({ error: 'Artwork file not found' });
    }
  });

  // ─── GET /api/download/:slug ──────────────────────────────────────────────
  app.get('/api/download/:slug', async (request, reply) => {
    const { slug } = request.params as { slug: string };

    const delivery = await prisma.songDelivery.findUnique({ where: { slug } });

    if (!delivery) {
      return reply.code(404).send({ error: 'Not found' });
    }

    if (!delivery.isActive || isExpired(delivery.expiresAt)) {
      return reply.code(410).send({ error: 'This link has expired' });
    }

    // Prevent path traversal
    const safeFileName = path.basename(delivery.filePath);
    const safePath = path.join(config.songsDir, safeFileName);

    try {
      const stat = await fs.stat(safePath);
      const contentType = mime.lookup(safePath) || delivery.mimeType;

      // Safe filename for Content-Disposition (ASCII fallback + UTF-8 RFC 5987)
      const fallbackName = `${delivery.title} - ${delivery.artist}.${delivery.format}`
        .replace(/[^\w\s.\-]/g, '')
        .trim() || `song.${delivery.format}`;
      const fullName = `${delivery.title} - ${delivery.artist}.${delivery.format}`;
      const encodedName = encodeURIComponent(fullName);

      // Emit download started event to admin
      try { emitDownloadStarted(slug, delivery.title); } catch { /* ignore */ }

      // Set headers for streaming download
      reply
        .header('Content-Type', contentType)
        .header('Content-Length', stat.size)
        .header('Content-Disposition', `attachment; filename="${fallbackName}"; filename*=UTF-8''${encodedName}`)
        .header('Cache-Control', 'no-store')
        .header('Accept-Ranges', 'bytes')
        .header('Access-Control-Allow-Origin', '*');

      // Increment download count asynchronously (don't wait)
      prisma.songDelivery.update({
        where: { id: delivery.id },
        data: {
          downloadCount: { increment: 1 },
          lastDownloaded: new Date(),
        },
      }).then((updated: any) => {
        try { emitDownloadCompleted(slug, updated?.downloadCount); } catch { /* ignore */ }
      }).catch(console.error);

      // Stream the file
      const stream = createReadStream(safePath);
      return reply.send(stream);

    } catch (err) {
      console.error('[DOWNLOAD] Error:', err);
      return reply.code(500).send({ error: 'File temporarily unavailable' });
    }
  });

  // ─── GET /api/stream/:slug (Inline preview player) ────────────────────────
  app.get('/api/stream/:slug', async (request, reply) => {
    const { slug } = request.params as { slug: string };

    const delivery = await prisma.songDelivery.findUnique({ where: { slug } });
    if (!delivery || !delivery.isActive || isExpired(delivery.expiresAt)) {
      return reply.code(404).send({ error: 'Not available' });
    }

    const safeFileName = path.basename(delivery.filePath);
    const safePath = path.join(config.songsDir, safeFileName);

    try {
      const stat = await fs.stat(safePath);
      const contentType = mime.lookup(safePath) || delivery.mimeType;
      const range = request.headers.range;

      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
        const chunksize = (end - start) + 1;
        const fileStream = (await import('fs')).createReadStream(safePath, { start, end });

        return reply
          .code(206)
          .header('Content-Range', `bytes ${start}-${end}/${stat.size}`)
          .header('Accept-Ranges', 'bytes')
          .header('Content-Length', chunksize)
          .header('Content-Type', contentType)
          .header('Access-Control-Allow-Origin', '*')
          .send(fileStream);
      } else {
        const fileStream = (await import('fs')).createReadStream(safePath);
        return reply
          .header('Content-Length', stat.size)
          .header('Content-Type', contentType)
          .header('Accept-Ranges', 'bytes')
          .header('Content-Disposition', 'inline')
          .header('Access-Control-Allow-Origin', '*')
          .send(fileStream);
      }
    } catch {
      return reply.code(404).send({ error: 'File not found' });
    }
  });

  // ─── GET /api/qr/:slug ────────────────────────────────────────────────────
  app.get('/api/qr/:slug', async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const { format = 'png' } = request.query as { format?: string };

    const tunnelUrl = getTunnelUrl();
    const base = tunnelUrl ?? `http://localhost:${config.webPort}`;
    const shareUrl = `${base}/s/${slug}`;

    try {
      if (format === 'svg') {
        const svg = await QRCode.toString(shareUrl, { type: 'svg' });
        return reply.header('Content-Type', 'image/svg+xml').send(svg);
      }

      const buffer = await QRCode.toBuffer(shareUrl, {
        type: 'png',
        width: 400,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
      });
      return reply.header('Content-Type', 'image/png').send(buffer);
    } catch (err) {
      return reply.code(500).send({ error: 'QR generation failed' });
    }
  });
}

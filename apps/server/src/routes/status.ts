// Song4Her 🦋 — Status & Settings Routes
import type { FastifyInstance } from 'fastify';
import os from 'os';
import prisma from '@song4her/database';
import { requireAuth } from '../auth/index.js';
import { getTunnelStatus, getTunnelUrl, restartTunnel } from '../services/tunnel.js';
import { getStorageStats } from '../services/storage.js';
import { config } from '../config/index.js';

const startedAt = new Date();

export async function statusRoutes(app: FastifyInstance): Promise<void> {

  // ─── GET /api/status ──────────────────────────────────────────────────────
  app.get('/api/status', { preHandler: requireAuth }, async (request, reply) => {
    const tunnel = getTunnelStatus();
    const storage = await getStorageStats();
    const activeDeliveries = await prisma.songDelivery.count({ where: { isActive: true } });
    const totalDeliveries = await prisma.songDelivery.count();

    return reply.send({
      server: 'online',
      uptime: Math.floor((Date.now() - startedAt.getTime()) / 1000),
      tunnel,
      storage: {
        ...storage,
        dataDir: config.dataDir,
      },
      activeDeliveries,
      totalDeliveries,
      nodeVersion: process.version,
      platform: os.platform(),
    });
  });

  // ─── GET /api/tunnel ──────────────────────────────────────────────────────
  app.get('/api/tunnel', { preHandler: requireAuth }, async (request, reply) => {
    return reply.send(getTunnelStatus());
  });

  // ─── POST /api/tunnel/restart ─────────────────────────────────────────────
  app.post('/api/tunnel/restart', { preHandler: requireAuth }, async (request, reply) => {
    const newUrl = await restartTunnel(config.webPort);
    return reply.send({
      ...getTunnelStatus(),
      success: Boolean(newUrl),
      url: newUrl,
    });
  });

  // ─── GET /api/settings ────────────────────────────────────────────────────
  app.get('/api/settings', { preHandler: requireAuth }, async (request, reply) => {
    let settings = await prisma.settings.findUnique({ where: { id: 1 } });

    if (!settings) {
      settings = await prisma.settings.create({
        data: { id: 1 },
      });
    }

    return reply.send(settings);
  });

  // ─── PATCH /api/settings ──────────────────────────────────────────────────
  app.patch('/api/settings', { preHandler: requireAuth }, async (request, reply) => {
    const body = request.body as {
      signature?: string;
      defaultNote?: string;
      defaultExpiry?: string;
      accentColor?: string;
      theme?: string;
      displayName?: string;
    };

    const settings = await prisma.settings.upsert({
      where: { id: 1 },
      update: {
        ...(body.signature !== undefined && { signature: body.signature }),
        ...(body.defaultNote !== undefined && { defaultNote: body.defaultNote }),
        ...(body.defaultExpiry !== undefined && { defaultExpiry: body.defaultExpiry }),
        ...(body.accentColor !== undefined && { accentColor: body.accentColor }),
        ...(body.theme !== undefined && { theme: body.theme }),
        ...(body.displayName !== undefined && { displayName: body.displayName }),
      },
      create: {
        id: 1,
        ...(body.signature && { signature: body.signature }),
        ...(body.defaultNote && { defaultNote: body.defaultNote }),
        ...(body.defaultExpiry && { defaultExpiry: body.defaultExpiry }),
        ...(body.accentColor && { accentColor: body.accentColor }),
        ...(body.theme && { theme: body.theme }),
        ...(body.displayName && { displayName: body.displayName }),
      },
    });

    return reply.send(settings);
  });
}

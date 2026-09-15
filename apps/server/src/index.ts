// Song4Her 🦋 — Fastify Server Entry Point
import Fastify from 'fastify';
import fastifyCookie from '@fastify/cookie';
import fastifySession from '@fastify/session';
import fastifyCors from '@fastify/cors';
import fastifyMultipart from '@fastify/multipart';
import { config } from './config/index.js';
import { createSocketServer } from './socket/index.js';
import { authRoutes } from './routes/auth.js';
import { songRoutes } from './routes/songs.js';
import { publicRoutes } from './routes/public.js';
import { statusRoutes } from './routes/status.js';
import { ensureDataDirectories } from './services/storage.js';
import { startTunnel } from './services/tunnel.js';
import { startExpiryChecker } from './services/expiry.js';
import prisma from '@song4her/database';

// ─── Bootstrap ────────────────────────────────────────────────────────────────

async function bootstrap(): Promise<void> {
  console.log('[SONG4HER] Starting...');

  // Ensure data directories exist
  await ensureDataDirectories();
  console.log('[SONG4HER] Data directories ready');

  // Initialize zero-native database
  try {
    await prisma.$connect();
    await prisma.settings.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1 },
    });
    console.log('[SONG4HER] Database ready (zero-native JSON engine)');
  } catch (err) {
    console.error('[SONG4HER] Database initialization error:', err);
    process.exit(1);
  }

  // Create Fastify instance
  const app = Fastify({
    logger: false,
    bodyLimit: config.maxFileSize,
    trustProxy: true,
  });

  // Attach Socket.IO to Fastify's underlying HTTP server
  createSocketServer(app.server);
  console.log('[SONG4HER] Socket.IO ready');

  // ─── Plugins ────────────────────────────────────────────────────────────

  await app.register(fastifyCors, {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Range', 'Cookie'],
    exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length', 'Content-Disposition'],
  });

  await app.register(fastifyCookie);

  await app.register(fastifySession, {
    secret: config.sessionSecret,
    cookieName: 's4h',
    cookie: {
      secure: false,       // false for HTTP localhost
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
    saveUninitialized: false,
  });

  await app.register(fastifyMultipart, {
    limits: {
      fileSize: config.maxFileSize,
      files: 2,
    },
  });

  // ─── Routes ─────────────────────────────────────────────────────────────

  await app.register(authRoutes);
  await app.register(songRoutes);
  await app.register(publicRoutes);
  await app.register(statusRoutes);

  // Health check
  app.get('/health', async () => ({ status: 'ok', app: 'song4her', emoji: '🦋' }));

  // ─── Start Server ────────────────────────────────────────────────────────

  await app.listen({ port: config.port, host: '0.0.0.0' });
  console.log(`[SONG4HER] Server started on http://localhost:${config.port}`);

  // Start expiry checker
  startExpiryChecker();
  console.log('[SONG4HER] Expiry checker started');

  // Start tunnel asynchronously in background (instant server startup)
  if (process.env.SKIP_TUNNEL !== 'true') {
    console.log('[SONG4HER] Starting Cloudflare tunnel in background...');
    startTunnel(config.webPort).then((tunnelUrl) => {
      if (tunnelUrl) {
        console.log(`[SONG4HER] Public URL: ${tunnelUrl}`);
      } else {
        console.log('[SONG4HER] Tunnel running in local-only mode');
      }
    }).catch((err) => {
      console.warn('[SONG4HER] Tunnel background error:', err?.message || err);
    });
  }
}

// ─── Graceful Shutdown ────────────────────────────────────────────────────────

process.on('SIGTERM', async () => {
  console.log('[SONG4HER] Shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n[SONG4HER] Shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

// ─── Auto-Run ─────────────────────────────────────────────────────────────────
// Server is always launched as a subprocess by scripts/start.ts, so always boot.

bootstrap().catch((err) => {
  console.error('[SONG4HER] Fatal error:', err);
  process.exit(1);
});

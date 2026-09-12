// Song4Her 🦋 — Socket.IO Server
import type { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { config } from '../config/index.js';

let io: SocketIOServer | null = null;

export function createSocketServer(httpServer: HTTPServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: (origin, cb) => {
        if (
          !origin ||
          origin.startsWith('http://localhost') ||
          origin.startsWith('http://127.0.0.1') ||
          origin.endsWith('.trycloudflare.com')
        ) {
          cb(null, true);
        } else {
          cb(new Error('Not allowed by Socket.IO CORS'));
        }
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    console.log(`[SOCKET] Client connected: ${socket.id}`);

    // Admin joins a room to receive all admin events
    socket.on('admin:join', () => {
      socket.join('admin');
      console.log(`[SOCKET] Admin joined: ${socket.id}`);
    });

    socket.on('disconnect', () => {
      console.log(`[SOCKET] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO(): SocketIOServer {
  if (!io) throw new Error('Socket.IO server not initialized');
  return io;
}

// ─── Typed Event Emitters ─────────────────────────────────────────────────────

export function emitTunnelConnected(url: string): void {
  getIO().to('admin').emit('tunnel:connected', { url });
}

export function emitTunnelDisconnected(error?: string): void {
  getIO().to('admin').emit('tunnel:disconnected', { error });
}

export function emitTunnelError(message: string): void {
  getIO().to('admin').emit('tunnel:error', { message });
}

export function emitProcessingStart(id: string, fileName: string): void {
  getIO().to('admin').emit('processing:start', { id, fileName });
}

export function emitProcessingProgress(id: string, percent: number, stage: string): void {
  getIO().to('admin').emit('processing:progress', { id, percent, stage });
}

export function emitProcessingComplete(id: string, slug: string): void {
  getIO().to('admin').emit('processing:complete', { id, slug });
}

export function emitProcessingError(id: string, message: string): void {
  getIO().to('admin').emit('processing:error', { id, message });
}

export function emitDownloadStarted(slug: string, title: string): void {
  getIO().to('admin').emit('download:started', { slug, title });
}

export function emitDownloadCompleted(slug: string, count: number): void {
  getIO().to('admin').emit('download:completed', { slug, count });
}

export function emitDeliveryExpired(slug: string): void {
  getIO().to('admin').emit('delivery:expired', { slug });
}

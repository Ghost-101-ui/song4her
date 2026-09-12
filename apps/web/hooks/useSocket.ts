'use client';
// Song4Her 🦋 — Socket.IO Hook
import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

export interface SocketState {
  connected: boolean;
  socket: Socket | null;
}

export interface ProcessingEvent {
  id: string;
  fileName?: string;
  percent?: number;
  stage?: string;
  slug?: string;
  message?: string;
}

export interface DownloadEvent {
  slug: string;
  title?: string;
  count?: number;
}

export interface TunnelEvent {
  url?: string;
  error?: string;
  message?: string;
}

interface UseSocketOptions {
  onTunnelConnected?: (e: TunnelEvent) => void;
  onTunnelDisconnected?: (e: TunnelEvent) => void;
  onTunnelError?: (e: TunnelEvent) => void;
  onProcessingStart?: (e: ProcessingEvent) => void;
  onProcessingProgress?: (e: ProcessingEvent) => void;
  onProcessingComplete?: (e: ProcessingEvent) => void;
  onProcessingError?: (e: ProcessingEvent) => void;
  onDownloadStarted?: (e: DownloadEvent) => void;
  onDownloadCompleted?: (e: DownloadEvent) => void;
  onDeliveryExpired?: (e: { slug: string }) => void;
}

export function useSocket(options: UseSocketOptions = {}): SocketState {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('admin:join');
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('tunnel:connected', (e) => optionsRef.current.onTunnelConnected?.(e));
    socket.on('tunnel:disconnected', (e) => optionsRef.current.onTunnelDisconnected?.(e));
    socket.on('tunnel:error', (e) => optionsRef.current.onTunnelError?.(e));
    socket.on('processing:start', (e) => optionsRef.current.onProcessingStart?.(e));
    socket.on('processing:progress', (e) => optionsRef.current.onProcessingProgress?.(e));
    socket.on('processing:complete', (e) => optionsRef.current.onProcessingComplete?.(e));
    socket.on('processing:error', (e) => optionsRef.current.onProcessingError?.(e));
    socket.on('download:started', (e) => optionsRef.current.onDownloadStarted?.(e));
    socket.on('download:completed', (e) => optionsRef.current.onDownloadCompleted?.(e));
    socket.on('delivery:expired', (e) => optionsRef.current.onDeliveryExpired?.(e));

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []); // Only connect once

  return { connected, socket: socketRef.current };
}

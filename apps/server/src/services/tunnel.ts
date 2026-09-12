// Song4Her 🦋 — Cloudflared Tunnel Service
import { spawn, type ChildProcess } from 'child_process';
import { config } from '../config/index.js';
import {
  emitTunnelConnected,
  emitTunnelDisconnected,
  emitTunnelError,
} from '../socket/index.js';

interface TunnelState {
  process: ChildProcess | null;
  url: string | null;
  connected: boolean;
  error: string | null;
  startedAt: Date | null;
}

const state: TunnelState = {
  process: null,
  url: null,
  connected: false,
  error: null,
  startedAt: null,
};

const URL_PATTERN = /https:\/\/[a-z0-9-]+\.trycloudflare\.com/i;

export function getTunnelStatus() {
  return {
    connected: state.connected,
    url: state.url,
    error: state.error,
    startedAt: state.startedAt,
  };
}

export function getTunnelUrl(): string | null {
  return state.url;
}

export async function startTunnel(port?: number): Promise<string | null> {
  if (state.process) {
    console.log('[TUNNEL] Already running');
    return state.url;
  }

  const targetPort = port ?? config.webPort;

  return new Promise((resolve) => {
    console.log(`[TUNNEL] Starting cloudflared → http://localhost:${targetPort}`);

    const proc = spawn(config.cloudflaredPath, [
      'tunnel',
      '--url',
      `http://localhost:${targetPort}`,
    ], {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
    });

    state.process = proc;
    state.startedAt = new Date();

    let resolved = false;

    const handleOutput = (data: Buffer) => {
      const text = data.toString();
      const match = text.match(URL_PATTERN);
      if (match && !resolved) {
        resolved = true;
        state.url = match[0];
        state.connected = true;
        state.error = null;
        console.log(`[TUNNEL] Connected: ${state.url}`);
        try { emitTunnelConnected(state.url); } catch { /* socket may not be ready */ }
        resolve(state.url);
      }
    };

    proc.stdout?.on('data', handleOutput);
    proc.stderr?.on('data', handleOutput); // cloudflared writes URL to stderr

    proc.on('close', (code) => {
      const msg = `cloudflared exited with code ${code}`;
      console.warn(`[TUNNEL] ${msg}`);
      state.process = null;
      state.connected = false;
      state.url = null;
      state.error = msg;
      try { emitTunnelDisconnected(msg); } catch { /* ignore */ }
      if (!resolved) {
        resolved = true;
        resolve(null);
      }
    });

    proc.on('error', (err) => {
      const msg = err.message.includes('ENOENT')
        ? `cloudflared not found. Install it from https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/`
        : err.message;
      console.error(`[TUNNEL] Error: ${msg}`);
      state.error = msg;
      state.connected = false;
      try { emitTunnelError(msg); } catch { /* ignore */ }
      if (!resolved) {
        resolved = true;
        resolve(null);
      }
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        state.error = 'Tunnel startup timed out';
        resolve(null);
      }
    }, 30_000);
  });
}

export function stopTunnel(): void {
  if (state.process) {
    state.process.kill('SIGTERM');
    state.process = null;
    state.connected = false;
    state.url = null;
    console.log('[TUNNEL] Stopped');
  }
}

export async function restartTunnel(port?: number): Promise<string | null> {
  stopTunnel();
  await new Promise((r) => setTimeout(r, 1000));
  return startTunnel(port);
}

// Song4Her 🦋 — Server Configuration
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root (4 levels up from apps/server/src/config/)
dotenv.config({ path: path.join(__dirname, '../../../../.env') });

function requireEnv(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

// Resolve data directory (absolute path)
function resolveDataDir(): string {
  const raw = process.env.DATA_DIR || './data';
  if (path.isAbsolute(raw)) return raw;
  // Relative to project root (4 levels up from apps/server/src/config/)
  return path.resolve(__dirname, '../../../../', raw);
}

// Resolve cloudflared binary (checks env, bin/ directory, or system PATH)
function resolveCloudflaredPath(): string {
  if (process.env.CLOUDFLARED_PATH && fs.existsSync(process.env.CLOUDFLARED_PATH)) {
    return process.env.CLOUDFLARED_PATH;
  }
  const rootBin = path.resolve(
    __dirname,
    '../../../../bin',
    process.platform === 'win32' ? 'cloudflared.exe' : 'cloudflared'
  );
  if (fs.existsSync(rootBin)) {
    return rootBin;
  }
  return 'cloudflared';
}

export const config = {
  port: parseInt(process.env.PORT_API || '3001', 10),
  webPort: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: (process.env.NODE_ENV || 'development') === 'development',

  // Auth
  adminPasswordHash: process.env.ADMIN_PASSWORD_HASH || '',
  sessionSecret: process.env.SESSION_SECRET || 'song4her_dev_secret_change_me_in_production',

  // Data paths
  dataDir: resolveDataDir(),

  // Derived paths
  get songsDir() { return path.join(this.dataDir, 'songs'); },
  get artworkDir() { return path.join(this.dataDir, 'artwork'); },
  get tempDir() { return path.join(this.dataDir, 'temp'); },
  get dbDir() { return path.join(this.dataDir, 'database'); },

  // Upload limits
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || String(200 * 1024 * 1024), 10), // 200MB
  maxArtworkSize: 10 * 1024 * 1024, // 10MB

  // Cloudflared binary path
  get cloudflaredPath() { return resolveCloudflaredPath(); },
} as const;

export type Config = typeof config;

// Song4Her 🦋 — Authentication Utilities
import { createHash, scryptSync, randomBytes, timingSafeEqual } from 'crypto';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { config } from '../config/index.js';

// ─── Password Hashing (using Node.js built-in crypto) ───────────────────────

/**
 * Hash a password using scrypt.
 * Returns a string in the format: "salt:hash"
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verify a password against a stored hash.
 * Hash must be in format "salt:hash" as produced by hashPassword().
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, hash] = storedHash.split(':');
    if (!salt || !hash) return false;
    const derivedHash = scryptSync(password, salt, 64);
    const storedHashBuf = Buffer.from(hash, 'hex');
    return timingSafeEqual(derivedHash, storedHashBuf);
  } catch {
    return false;
  }
}

// ─── Session Types ────────────────────────────────────────────────────────────

declare module '@fastify/session' {
  interface FastifySessionObject {
    authenticated?: boolean;
    loginAt?: string;
  }
}

// ─── Auth Middleware ──────────────────────────────────────────────────────────

/**
 * Fastify preHandler that rejects unauthenticated requests.
 */
export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  if (!request.session.authenticated) {
    reply.code(401).send({ error: 'Unauthorized', message: 'Authentication required' });
  }
}

/**
 * Check if the admin password hash is configured.
 */
export function isPasswordConfigured(): boolean {
  return Boolean(config.adminPasswordHash && config.adminPasswordHash.includes(':'));
}

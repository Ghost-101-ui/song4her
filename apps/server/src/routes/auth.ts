// Song4Her 🦋 — Auth Routes
import type { FastifyInstance } from 'fastify';
import { verifyPassword, requireAuth, isPasswordConfigured } from '../auth/index.js';
import { config } from '../config/index.js';

export async function authRoutes(app: FastifyInstance): Promise<void> {
  // POST /api/auth/login
  app.post('/api/auth/login', async (request, reply) => {
    const body = request.body as { password?: string };

    if (!body?.password) {
      return reply.code(400).send({ error: 'Password required' });
    }

    if (!isPasswordConfigured()) {
      return reply.code(503).send({
        error: 'Setup required',
        message: 'Admin password not configured. Run: npm run setup',
      });
    }

    const valid = verifyPassword(body.password, config.adminPasswordHash);

    if (!valid) {
      // Small delay to slow down brute force
      await new Promise((r) => setTimeout(r, 500));
      return reply.code(401).send({ error: 'Invalid password' });
    }

    request.session.authenticated = true;
    request.session.loginAt = new Date().toISOString();

    return reply.code(200).send({
      success: true,
      message: 'Welcome back 🦋',
    });
  });

  // POST /api/auth/logout
  app.post('/api/auth/logout', async (request, reply) => {
    request.session.destroy();
    return reply.code(200).send({ success: true });
  });

  // GET /api/auth/session
  app.get('/api/auth/session', async (request, reply) => {
    if (request.session.authenticated) {
      return reply.send({
        authenticated: true,
        loginAt: request.session.loginAt,
      });
    }
    return reply.code(401).send({ authenticated: false });
  });
}

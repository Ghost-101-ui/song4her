// Song4Her 🦋 — Expiry & Cleanup Service
import prisma from '@song4her/database';
import { deleteDeliveryFiles } from './storage.js';
import { emitDeliveryExpired } from '../socket/index.js';

/**
 * Check all deliveries and mark expired ones as inactive.
 * Deletes their files and emits socket events.
 */
export async function processExpiredDeliveries(): Promise<number> {
  const now = new Date();
  let count = 0;

  const expired = await prisma.songDelivery.findMany({
    where: {
      isActive: true,
      expiresAt: { lte: now },
    },
  });

  for (const delivery of expired) {
    try {
      await prisma.songDelivery.update({
        where: { id: delivery.id },
        data: { isActive: false },
      });

      await deleteDeliveryFiles(delivery.filePath, delivery.artworkPath);

      try { emitDeliveryExpired(delivery.slug); } catch { /* ignore if socket not ready */ }

      console.log(`[EXPIRY] Cleaned up: ${delivery.slug} (${delivery.title})`);
      count++;
    } catch (err) {
      console.error(`[EXPIRY] Failed to clean up ${delivery.slug}:`, err);
    }
  }

  return count;
}

/**
 * Start a periodic expiry check every 5 minutes.
 */
export function startExpiryChecker(): NodeJS.Timeout {
  const interval = setInterval(async () => {
    try {
      const count = await processExpiredDeliveries();
      if (count > 0) {
        console.log(`[EXPIRY] Cleaned up ${count} expired delivery/deliveries`);
      }
    } catch (err) {
      console.error('[EXPIRY] Checker error:', err);
    }
  }, 5 * 60 * 1000);

  // Run immediately on start
  processExpiredDeliveries().catch(console.error);

  return interval;
}

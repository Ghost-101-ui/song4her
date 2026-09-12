'use client';
// Song4Her 🦋 — Web Share Hook
import { useCallback } from 'react';
import { useClipboard } from './useClipboard';

interface ShareData {
  url: string;
  title?: string;
  text?: string;
}

export function useShare() {
  const { copied, copy } = useClipboard();

  const share = useCallback(async (data: ShareData): Promise<'shared' | 'copied' | 'failed'> => {
    // Try Web Share API first (mobile browsers)
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: data.title || 'Song4Her 🦋',
          text: data.text || 'A little song, just for you.',
          url: data.url,
        });
        return 'shared';
      } catch (err) {
        // User cancelled — try clipboard
        if ((err as Error).name === 'AbortError') return 'failed';
      }
    }

    // Fallback to clipboard
    const success = await copy(data.url);
    return success ? 'copied' : 'failed';
  }, [copy]);

  return { share, copied };
}

// Song4Her 🦋 — Admin Status Bar Component (self-contained)
'use client';
import { useState, useEffect, useCallback } from 'react';
import { Copy, Check, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useClipboard } from '@/hooks/useClipboard';
import { useSocket } from '@/hooks/useSocket';
import { status as statusApi } from '@/lib/api';

export function StatusBar() {
  const [tunnelUrl, setTunnelUrl] = useState<string | null>(null);
  const [restarting, setRestarting] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const { copied, copy } = useClipboard();

  // Fetch initial status from the server
  const fetchStatus = useCallback(async () => {
    try {
      const t = await statusApi.tunnel();
      setTunnelUrl(t.url ?? null);
    } catch {
      setTunnelUrl(null);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Listen to real-time tunnel events from socket
  const { connected: socketConnected } = useSocket({
    onTunnelConnected: (e) => {
      if (e.url) setTunnelUrl(e.url);
    },
    onTunnelDisconnected: () => {
      setTunnelUrl(null);
    },
    onTunnelError: () => {
      setTunnelUrl(null);
    },
  });

  const handleRestartTunnel = async () => {
    setRestarting(true);
    try {
      const result = await statusApi.restartTunnel();
      setTunnelUrl(result.url ?? null);
    } catch {
      // Ignore
    } finally {
      setRestarting(false);
    }
  };

  const tunnelConnected = Boolean(tunnelUrl);

  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-2xl bg-surface-1 border border-surface-border">
      {/* Server status — always online if this renders */}
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]" />
        <span className="text-xs text-white/50 font-medium">Server Online</span>
      </div>

      <div className="w-px h-4 bg-surface-border" />

      {/* Socket status */}
      <div className="flex items-center gap-2">
        {socketConnected ? (
          <Wifi size={12} className="text-green-400" />
        ) : (
          <WifiOff size={12} className="text-white/30" />
        )}
        <span className="text-xs text-white/50">
          {socketConnected ? 'Live' : 'Connecting…'}
        </span>
      </div>

      <div className="w-px h-4 bg-surface-border" />

      {/* Tunnel status */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {loaded ? (
          <>
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
              tunnelConnected
                ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]'
                : 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.6)]'
            }`} />

            {tunnelConnected ? (
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <a
                  href={tunnelUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-brand-400 hover:text-brand-300 truncate font-mono transition-colors"
                >
                  {tunnelUrl}
                </a>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copy(tunnelUrl!)}
                  className="flex-shrink-0 h-6 px-2"
                  title="Copy URL"
                >
                  {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                </Button>
              </div>
            ) : (
              <span className="text-xs text-red-400/80">Tunnel not connected</span>
            )}
          </>
        ) : (
          <>
            <div className="w-2 h-2 rounded-full bg-white/20 animate-pulse" />
            <span className="text-xs text-white/30">Checking tunnel…</span>
          </>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={handleRestartTunnel}
          loading={restarting}
          className="flex-shrink-0 h-6 px-2"
          title="Restart tunnel"
        >
          <RefreshCw size={12} />
        </Button>
      </div>
    </div>
  );
}

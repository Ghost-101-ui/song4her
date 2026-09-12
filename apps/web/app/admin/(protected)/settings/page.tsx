'use client';
// Song4Her 🦋 — Admin Settings Page
import { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Server,
  Wifi,
  Sparkles,
  Save,
  Check,
  AlertCircle,
  RefreshCw,
  Copy,
  ExternalLink,
  Shield,
  Palette,
} from 'lucide-react';
import type { AppSettings, ServerStatus, TunnelStatus } from '@song4her/types';
import { settings, status } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { useClipboard } from '@/hooks/useClipboard';
import { formatBytes } from '@/lib/utils';

const COLOR_PRESETS = [
  { name: 'Butterfly Pink', hex: '#e879a0' },
  { name: 'Rose Petal', hex: '#f43f5e' },
  { name: 'Soft Lavender', hex: '#c084fc' },
  { name: 'Sky Glow', hex: '#38bdf8' },
  { name: 'Emerald Forest', hex: '#34d399' },
  { name: 'Golden Sun', hex: '#fbbf24' },
];

export default function SettingsPage() {
  const { copied, copy } = useClipboard();

  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [restartingTunnel, setRestartingTunnel] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [displayName, setDisplayName] = useState('Dhurbb');
  const [signature, setSignature] = useState('Built with 🫶🏻 by Dhurbb\nfor her shiuuuu 🦋');
  const [defaultNote, setDefaultNote] = useState('');
  const [defaultExpiry, setDefaultExpiry] = useState('never');
  const [accentColor, setAccentColor] = useState('#e879a0');

  useEffect(() => {
    Promise.all([
      settings.get().catch(() => null),
      status.get().catch(() => null),
    ]).then(([sData, statData]) => {
      if (sData) {
        setAppSettings(sData);
        setDisplayName(sData.displayName);
        setSignature(sData.signature);
        setDefaultNote(sData.defaultNote);
        setDefaultExpiry(sData.defaultExpiry);
        setAccentColor(sData.accentColor);
      }
      if (statData) setServerStatus(statData);
      setLoading(false);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const updated = await settings.update({
        displayName: displayName.trim(),
        signature: signature.trim(),
        defaultNote: defaultNote.trim(),
        defaultExpiry,
        accentColor,
      });
      setAppSettings(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleRestartTunnel = async () => {
    setRestartingTunnel(true);
    try {
      const res = await status.restartTunnel();
      if (serverStatus) {
        setServerStatus({
          ...serverStatus,
          tunnel: {
            ...serverStatus.tunnel,
            connected: res.connected,
            url: res.url,
          },
        });
      }
    } catch {
      setError('Failed to restart tunnel');
    } finally {
      setRestartingTunnel(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-4xl animate-flutter mb-3">🦋</div>
          <p className="text-sm text-white/50">Loading settings...</p>
        </div>
      </div>
    );
  }

  const tunnelUrl = serverStatus?.tunnel.url;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <SettingsIcon className="text-brand-400" size={28} />
          <span>Settings</span>
        </h1>
        <p className="text-sm text-white/50 mt-1">
          Customize your Song4Her identity, tunnel connection, and delivery defaults.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
          <Check size={18} />
          <span>Settings saved successfully!</span>
        </div>
      )}

      {/* 1. Tunnel & System Status */}
      <div className="p-5 rounded-3xl bg-surface-1 border border-surface-border space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-surface-2 text-brand-400">
              <Wifi size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Public Tunnel Connection</h2>
              <p className="text-xs text-white/40">Cloudflare Quick Tunnel for ₹0 public HTTPS URLs</p>
            </div>
          </div>

          <Button
            size="sm"
            variant="secondary"
            onClick={handleRestartTunnel}
            loading={restartingTunnel}
            className="gap-1.5 text-xs"
          >
            <RefreshCw size={13} className={restartingTunnel ? 'animate-spin' : ''} />
            <span>Restart Tunnel</span>
          </Button>
        </div>

        {tunnelUrl ? (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Online & Secured</p>
                <a
                  href={tunnelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-white/90 font-mono hover:underline flex items-center gap-1.5 truncate mt-0.5"
                >
                  <span className="truncate">{tunnelUrl}</span>
                  <ExternalLink size={13} className="text-white/40 flex-shrink-0" />
                </a>
              </div>
            </div>

            <Button
              size="sm"
              variant="secondary"
              onClick={() => copy(tunnelUrl)}
              className="gap-1.5 flex-shrink-0"
            >
              {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
              <span>{copied ? 'Copied' : 'Copy URL'}</span>
            </Button>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 flex-shrink-0" />
              <p>Tunnel not connected. Local mode active (<code className="font-mono text-xs">localhost:3000</code>).</p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleRestartTunnel}
              loading={restartingTunnel}
            >
              Start Tunnel
            </Button>
          </div>
        )}

        {serverStatus && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs text-white/50">
            <div>
              <span className="text-white/30 block">Songs Stored</span>
              <span className="text-white font-medium">{serverStatus.storage.totalSongs} files</span>
            </div>
            <div>
              <span className="text-white/30 block">Storage Used</span>
              <span className="text-white font-medium">{formatBytes(serverStatus.storage.totalSizeBytes)}</span>
            </div>
            <div>
              <span className="text-white/30 block">Active Deliveries</span>
              <span className="text-white font-medium">{serverStatus.activeDeliveries}</span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Personalization Form */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="p-5 rounded-3xl bg-surface-1 border border-surface-border space-y-4">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 rounded-xl bg-surface-2 text-brand-400">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Identity & Signature</h2>
              <p className="text-xs text-white/40">These appear on her delivery page</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Your Display Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Dhurbb"
              required
            />

            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">
                Default Expiry
              </label>
              <select
                value={defaultExpiry}
                onChange={(e) => setDefaultExpiry(e.target.value)}
                className="input-base text-sm py-2.5"
              >
                <option value="never">Never (keep indefinitely)</option>
                <option value="24h">24 Hours</option>
                <option value="3d">3 Days</option>
                <option value="7d">7 Days</option>
              </select>
            </div>
          </div>

          <Textarea
            label="Footer Signature (Appears at the bottom of her page)"
            rows={2}
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
            placeholder="Built with 🫶🏻 by Dhurbb\nfor her shiuuuu 🦋"
          />

          <Textarea
            label="Default Note Template"
            rows={2}
            value={defaultNote}
            onChange={(e) => setDefaultNote(e.target.value)}
            placeholder="Default note pre-filled when creating new deliveries..."
          />

          {/* Accent Color Picker */}
          <div>
            <label className="block text-xs font-medium text-white/60 mb-2 flex items-center gap-1.5">
              <Palette size={14} className="text-brand-400" />
              Theme Accent Color
            </label>
            <div className="flex flex-wrap items-center gap-2.5">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setAccentColor(c.hex)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs transition-all ${
                    accentColor === c.hex
                      ? 'border-white/60 bg-surface-3 shadow-md'
                      : 'border-surface-border bg-surface-2 hover:bg-surface-3 text-white/60'
                  }`}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-black/20"
                    style={{ backgroundColor: c.hex }}
                  />
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Security Info */}
        <div className="p-5 rounded-3xl bg-surface-1 border border-surface-border space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-surface-2 text-brand-400">
              <Shield size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Security & Password</h2>
              <p className="text-xs text-white/40">Admin authentication settings</p>
            </div>
          </div>

          <p className="text-xs text-white/50 leading-relaxed">
            To change or reset your admin password, run the interactive CLI in your terminal:
          </p>
          <div className="p-3 rounded-xl bg-surface-2 border border-surface-border font-mono text-xs text-brand-300 flex items-center justify-between">
            <span>npm run setup</span>
            <button
              type="button"
              onClick={() => copy('npm run setup')}
              className="text-white/40 hover:text-white"
            >
              <Copy size={14} />
            </button>
          </div>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={saving}
          className="w-full rounded-2xl py-3.5 shadow-xl shadow-brand-500/20 gap-2"
        >
          <Save size={18} />
          <span>Save All Settings</span>
        </Button>
      </form>
    </div>
  );
}

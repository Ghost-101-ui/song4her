'use client';
// Song4Her 🦋 — Admin Dashboard Page
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Search, Music, Sparkles, RefreshCw } from 'lucide-react';
import type { AdminDelivery } from '@song4her/types';
import { songs } from '@/lib/api';
import { StatusBar } from '@/components/StatusBar';
import { SongCard } from '@/components/SongCard';
import { Button } from '@/components/ui/Button';
import { useSocket } from '@/hooks/useSocket';

export default function AdminDashboardPage() {
  const [deliveries, setDeliveries] = useState<AdminDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'expired'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const loadDeliveries = useCallback(async () => {
    try {
      const data = await songs.list({ search: search || undefined });
      setDeliveries(data.deliveries);
    } catch (err) {
      console.error('Failed to load deliveries:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search]);

  useEffect(() => {
    loadDeliveries();
  }, [loadDeliveries]);

  // Real-time socket updates
  useSocket({
    onDownloadCompleted: ({ slug, count }) => {
      setDeliveries((prev) =>
        prev.map((d) => (d.slug === slug ? { ...d, downloadCount: count ?? d.downloadCount, lastDownloaded: new Date() } : d))
      );
    },
    onDeliveryExpired: ({ slug }) => {
      setDeliveries((prev) =>
        prev.map((d) => (d.slug === slug ? { ...d, isActive: false } : d))
      );
    },
    onProcessingComplete: () => {
      loadDeliveries();
    },
  });

  const handleDelete = (id: string) => {
    setDeliveries((prev) => prev.filter((d) => d.id !== id));
  };

  // Filtering
  const filtered = deliveries.filter((d) => {
    const isExp = d.expiresAt ? new Date() > new Date(d.expiresAt) : false;
    const isInactive = !d.isActive || isExp;
    if (filter === 'active') return !isInactive;
    if (filter === 'expired') return isInactive;
    return true;
  });

  const activeCount = deliveries.filter(
    (d) => d.isActive && (!d.expiresAt || new Date() <= new Date(d.expiresAt))
  ).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Live System Status Bar */}
      <StatusBar />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Deliveries</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-500/15 text-brand-300 border border-brand-500/20">
              {deliveries.length} total
            </span>
          </div>
          <p className="text-sm text-white/50 mt-0.5">
            {activeCount} active • Ready to share privately
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setRefreshing(true);
              loadDeliveries();
            }}
            disabled={refreshing}
            className="text-white/60 hover:text-white"
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
          </Button>

          <Link href="/admin/new">
            <Button variant="primary" size="md" className="gap-2 shadow-lg shadow-brand-500/20">
              <Plus size={18} />
              <span>Quick Send</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Controls: Search & Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, artist, or note..."
            className="input-base pl-10 pr-4 py-2 text-sm bg-surface-1 border-surface-border rounded-xl"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-1 border border-surface-border self-start sm:self-auto">
          {(['all', 'active', 'expired'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                filter === tab
                  ? 'bg-surface-3 text-white shadow-sm'
                  : 'text-white/50 hover:text-white hover:bg-surface-2'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Deliveries List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-12">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-28 rounded-2xl bg-surface-1/50 border border-surface-border animate-pulse"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl border border-dashed border-surface-border bg-surface-1/30">
          <div className="w-16 h-16 rounded-2xl bg-surface-2 flex items-center justify-center text-3xl mb-4 animate-flutter">
            🦋
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">
            {search ? 'No matching deliveries' : 'No songs delivered yet'}
          </h3>
          <p className="text-sm text-white/40 max-w-sm mb-6">
            {search
              ? `No deliveries matched "${search}". Try searching for something else.`
              : 'Pick an authorized audio file and prepare a stunning personalized delivery for her in seconds.'}
          </p>
          <Link href="/admin/new">
            <Button variant="primary" className="gap-2">
              <Sparkles size={16} />
              Create First Delivery
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((delivery) => (
            <SongCard
              key={delivery.id}
              delivery={delivery}
              onDeleted={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

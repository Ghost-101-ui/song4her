// Song4Her 🦋 — Recipient Not Found / Expired Page
import Link from 'next/link';

export default function DeliveryNotFound() {
  return (
    <div className="min-h-screen bg-[#0a0a10] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(232,121,160,0.08)_0%,transparent_60%)] pointer-events-none" />

      <div className="relative max-w-sm w-full text-center p-8 rounded-3xl bg-[#131320]/80 border border-white/10 backdrop-blur-xl shadow-2xl">
        {/* Floating butterfly */}
        <div className="text-5xl mb-5 animate-flutter inline-block">
          🦋
        </div>

        <h1 className="text-xl font-bold text-white mb-2 tracking-tight">
          This Song Link is No Longer Available
        </h1>

        <p className="text-sm text-white/50 leading-relaxed mb-6">
          This private delivery link may have expired, reached its download limit, or the local server was shut down.
        </p>

        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 text-xs text-white/40 mb-6">
          Reach out to the sender on WhatsApp if you would like them to send it again! 🫶🏻
        </div>

        <p className="text-xs text-white/20 font-medium">
          Song4Her 🦋 • Private Song Delivery
        </p>
      </div>
    </div>
  );
}

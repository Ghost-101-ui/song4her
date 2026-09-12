'use client';
// Song4Her 🦋 — Admin Login Page
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { auth } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(true);

  // Check if already authenticated
  useEffect(() => {
    auth.session()
      .then(() => router.replace('/admin'))
      .catch(() => setChecking(false));
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await auth.login(password);
      router.replace('/admin');
    } catch (err: any) {
      setError(err.message || 'Invalid password');
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="animate-flutter text-4xl">🦋</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(232,121,160,0.1)_0%,transparent_50%)] pointer-events-none" />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="text-5xl mb-4 animate-flutter">🦋</div>
          <h1 className="text-2xl font-bold text-white">Song4Her</h1>
          <p className="text-white/40 text-sm mt-1">A little song, just for you.</p>
        </div>

        {/* Card */}
        <div className="glass-strong rounded-3xl p-8 border border-white/10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-brand-500/20">
              <Lock size={18} className="text-brand-400" />
            </div>
            <div>
              <h2 className="font-semibold text-white text-sm">Admin Access</h2>
              <p className="text-xs text-white/40">Enter your password to continue</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="relative">
              <input
                id="admin-password"
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete="current-password"
                autoFocus
                required
                className={cn(
                  'input-base pr-12',
                  error && 'border-red-500/50 focus:ring-red-500/30'
                )}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {error && (
              <p className="text-xs text-red-400 text-center animate-fade-in">{error}</p>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full rounded-2xl mt-1"
            >
              Enter Song4Her
            </Button>
          </form>
        </div>

        {/* Setup hint */}
        <p className="text-center text-xs text-white/20 mt-6">
          First time? Run <code className="font-mono text-white/30">npm run setup</code> to set your password.
        </p>
      </div>
    </div>
  );
}

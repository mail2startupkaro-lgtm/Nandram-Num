'use client';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, LogIn, Shield, X } from 'lucide-react';
import { useApp } from '@/components/layout/providers';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/form';
import { api, ApiError } from '@/lib/client/api';

/**
 * Secret Admin Trigger check:
 * Supports '#%$/!&+888/admin' and any browser-encoded form of that exact string.
 */
export function isSecretAdminHash(hash: string): boolean {
  if (!hash) return false;
  const raw = hash.replace(/^#/, '').trim();
  if (!raw) return false;
  if (raw === '%$/!&+888/admin' || raw === '%25$/!&+888/admin') return true;
  if (raw.includes('888/admin')) return true;
  try {
    const dec = decodeURIComponent(raw);
    if (dec === '%$/!&+888/admin' || dec.includes('888/admin')) return true;
  } catch {}
  return false;
}

export function SecretAdminLogin() {
  const { me, refreshMe } = useApp();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [identifier, setIdentifier] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const checkHash = React.useCallback(() => {
    if (typeof window === 'undefined') return;
    if (isSecretAdminHash(window.location.hash)) {
      if (me?.user?.role === 'super_admin') {
        router.push('/admin');
      } else {
        setOpen(true);
      }
    }
  }, [me?.user?.role, router]);

  React.useEffect(() => {
    checkHash();
    const handleHash = () => checkHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [checkHash]);

  function close() {
    setOpen(false);
    setError(null);
    setPassword('');
    if (typeof window !== 'undefined' && window.location.hash) {
      // Clear hash cleanly without full page reload
      const cleanUrl = window.location.pathname + window.location.search;
      window.history.replaceState(null, '', cleanUrl);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ user: { id: string; name: string | null; role: string } }>('/api/auth/login', {
        method: 'POST',
        json: { identifier: identifier.trim(), password },
      });
      await refreshMe();
      if (res.user?.role === 'super_admin') {
        close();
        router.push('/admin');
      } else {
        setError('Access denied: This portal is strictly for Super Admins.');
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.body?.error === 'INVALID_CREDENTIALS' ? 'Invalid admin credentials.' : (err.body?.error ?? 'Login failed'));
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/75 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      onClick={close}
    >
      <div
        className="glass relative w-full max-w-md rounded-2xl border border-gold/40 bg-background/95 p-6 sm:p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={close}
          className="absolute right-4 top-4 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-gold/40 bg-gold/10">
            <Shield className="h-7 w-7 text-gold" />
          </div>
          <h2 className="text-2xl font-bold font-serif tracking-tight text-foreground">
            Admin Portal
          </h2>
          <p className="mt-1 text-xs uppercase tracking-widest text-gold font-medium">
            Authorized Personnel Only
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleLogin}>
          <Field label="Admin Identifier" htmlFor="admin-ident" required>
            <Input
              id="admin-ident"
              autoFocus
              autoComplete="username"
              placeholder="admin@example.com or mobile"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
          </Field>

          <Field label="Admin Password" htmlFor="admin-pw" required>
            <div className="relative">
              <Input
                id="admin-pw"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute inset-y-0 right-0 grid w-10 place-items-center text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>

          {error && (
            <div className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-xs font-medium text-danger" role="alert">
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="gold"
            className="w-full mt-2 h-11 text-sm font-semibold"
            disabled={busy || identifier.trim().length < 3 || !password}
          >
            {busy ? (
              <span className="flex items-center gap-2">
                <Lock className="h-4 w-4 animate-spin" /> Authenticating…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <LogIn className="h-4 w-4" /> Sign In to Admin
              </span>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

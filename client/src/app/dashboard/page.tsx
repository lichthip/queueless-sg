'use client';

import { useState, useEffect } from 'react';
import type { StaffUser } from '@/types';
import { api } from '@/lib/api';
import { useQueues } from '@/hooks/useQueues';
import WaitTimeBadge from '@/components/WaitTimeBadge';
import clsx from 'clsx';

export default function DashboardPage() {
  const [token,      setToken]      = useState<string | null>(null);
  const [user,       setUser]       = useState<StaffUser | null>(null);
  const [form,       setForm]       = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState<string | null>(null);
  const [busy,       setBusy]       = useState<number | null>(null);

  const { centers, loading, connected } = useQueues();

  useEffect(() => {
    const t = sessionStorage.getItem('ql_token');
    const u = sessionStorage.getItem('ql_user');
    if (t && u) { setToken(t); setUser(JSON.parse(u)); }
  }, []);

  const visible = user?.role === 'admin'
    ? centers
    : centers.filter(c => c.id === user?.centerId);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoginError(null);
    try {
      const res = await api.auth.login(form.username, form.password);
      setToken(res.token);
      setUser(res.user);
      sessionStorage.setItem('ql_token', res.token);
      sessionStorage.setItem('ql_user', JSON.stringify(res.user));
    } catch (err: any) {
      setLoginError(err.message || 'Login failed');
    }
  }

  function logout() {
    setToken(null); setUser(null);
    sessionStorage.removeItem('ql_token');
    sessionStorage.removeItem('ql_user');
  }

  async function adjust(centerId: number, delta: number) {
    if (!token) return;
    setBusy(centerId);
    try { await api.queues.adjust(centerId, delta, token); }
    catch (e) { console.error(e); }
    finally { setBusy(null); }
  }

  async function toggleOpen(centerId: number, open: boolean) {
    if (!token) return;
    try { await api.queues.setStatus(centerId, !open, token); }
    catch (e) { console.error(e); }
  }

  if (!token || !user) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-red-50 border border-red-100 rounded-xl flex items-center justify-center mx-auto mb-3 text-2xl">
              🔒
            </div>
            <h1 className="text-xl font-bold text-slate-900">Staff Portal</h1>
            <p className="text-sm text-slate-500 mt-1">QueueLess SG — authorised access only</p>
          </div>

          <form onSubmit={login} className="space-y-4">
            {(['username', 'password'] as const).map(field => (
              <div key={field}>
                <label className="block text-xs font-medium text-slate-700 mb-1 capitalize">{field}</label>
                <input
                  type={field === 'password' ? 'password' : 'text'}
                  value={form[field]}
                  onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                  autoComplete={field}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder={field === 'username' ? 'e.g. admin' : '••••••••'}
                />
              </div>
            ))}

            {loginError && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 rounded-lg text-sm transition-colors"
            >
              Sign In
            </button>
          </form>

          <p className="mt-5 text-xs text-center text-slate-400">
            Demo credentials: <span className="font-mono">admin</span> / <span className="font-mono">admin123</span>
          </p>
        </div>
      </div>
    );
  }

  const openCount  = visible.filter(c => c.queue.is_open === 1).length;
  const totalQueue = visible.reduce((s, c) => s + c.queue.current_count, 0);
  const avgWait    = visible.length
    ? Math.round(visible.reduce((s, c) => s + c.queue.estimatedWaitMinutes, 0) / visible.length)
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Staff Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Signed in as{' '}
            <span className="font-semibold text-slate-700">{user.username}</span>
            {' · '}
            <span className={clsx(
              'text-xs font-medium px-1.5 py-0.5 rounded',
              user.role === 'admin'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-blue-100 text-blue-700',
            )}>
              {user.role}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
            {connected ? 'Live' : 'Connecting…'}
          </div>
          <button
            onClick={logout}
            className="text-xs px-3 py-1.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total in Queue',     value: totalQueue          },
          { label: 'Centres Monitored',  value: visible.length      },
          { label: 'Open Now',           value: openCount           },
          { label: 'Avg Wait (min)',      value: avgWait             },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-2xl font-bold text-slate-900">{s.value}</p>
            <p className="text-xs text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Management table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">Queue Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Adjust counts manually or open / close a centre. Changes broadcast live.
          </p>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400 animate-pulse">Loading centres…</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {visible.map(center => {
              const isOpen = center.queue.is_open === 1;
              return (
                <div
                  key={center.id}
                  className="px-4 py-4 flex flex-col sm:flex-row sm:items-center gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-slate-900 text-sm">{center.name}</p>
                      <WaitTimeBadge
                        waitMinutes={center.queue.estimatedWaitMinutes}
                        isOpen={isOpen}
                        size="sm"
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{center.address}</p>
                  </div>

                  <div className="flex items-center gap-6 text-center shrink-0">
                    <div>
                      <p className="text-xl font-bold text-slate-900">{center.queue.current_count}</p>
                      <p className="text-xs text-slate-400">in queue</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-slate-700">
                        {isOpen ? `~${center.queue.estimatedWaitMinutes}m` : '—'}
                      </p>
                      <p className="text-xs text-slate-400">wait</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => adjust(center.id, -1)}
                      disabled={busy === center.id || !isOpen}
                      className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 font-bold text-slate-700 text-lg transition-colors"
                    >
                      −
                    </button>
                    <button
                      onClick={() => adjust(center.id, 1)}
                      disabled={busy === center.id || !isOpen}
                      className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 font-bold text-slate-700 text-lg transition-colors"
                    >
                      +
                    </button>
                    <button
                      onClick={() => toggleOpen(center.id, isOpen)}
                      className={clsx(
                        'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                        isOpen
                          ? 'bg-red-50   text-red-700   border-red-200   hover:bg-red-100'
                          : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
                      )}
                    >
                      {isOpen ? 'Close' : 'Open'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
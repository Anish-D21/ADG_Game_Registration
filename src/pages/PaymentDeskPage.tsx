/**
 * @file PaymentDeskPage.tsx
 * @description Focused payment-approval desk. One job: go through the teams that
 * say they have paid, check the money actually arrived, and tick them off.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Check, X, Search, RefreshCw, Lock, LogOut, IndianRupee,
  Clock, CheckCircle2, XCircle, Copy, Image as ImageIcon, AlertTriangle
} from 'lucide-react';
import {
  adminLogin, fetchAdminPayments, verifyAdminPayment, rejectAdminPayment
} from '../services/api.ts';

type Filter = 'AWAITING' | 'CONFIRMED' | 'REJECTED' | 'ALL';

const AWAITING_STATES = ['PENDING_VERIFICATION', 'PENDING', 'PROCESSING', 'NOT_STARTED'];

export function PaymentDeskPage() {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem('deception_admin_token')
  );
  const [email, setEmail] = useState('admin@adg.org');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('AWAITING');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await fetchAdminPayments();
      setPayments(data.payments || []);
      setLastSynced(new Date());
    } catch (err: any) {
      // A stale token is the common case here; send them back to the login card.
      if (String(err.message).toLowerCase().includes('unauthor')) {
        localStorage.removeItem('deception_admin_token');
        setToken(null);
      }
      setLoadError(err.message || 'Could not load payments.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (token) load(); }, [token, load]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError(null);
    try {
      const res = await adminLogin({ email: email.trim(), password });
      localStorage.setItem('deception_admin_token', res.token);
      setToken(res.token);
      setPassword('');
    } catch (err: any) {
      setLoginError(err.message || 'Login failed.');
    } finally {
      setLoggingIn(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('deception_admin_token');
    setToken(null);
    setPayments([]);
  };

  const counts = useMemo(() => {
    const c = { awaiting: 0, confirmed: 0, rejected: 0, collected: 0 };
    for (const p of payments) {
      if (p.status === 'PAID') { c.confirmed++; c.collected += Number(p.amountPaid ?? p.amount) || 0; }
      else if (p.status === 'REJECTED') c.rejected++;
      else if (AWAITING_STATES.includes(p.status)) c.awaiting++;
    }
    return c;
  }, [payments]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return payments
      .filter(p => {
        if (filter === 'CONFIRMED') return p.status === 'PAID';
        if (filter === 'REJECTED') return p.status === 'REJECTED';
        if (filter === 'AWAITING') return AWAITING_STATES.includes(p.status);
        return true;
      })
      .filter(p => !q || [p.teamName, p.leaderName, p.registrationId, p.transactionReference, p.contactEmail]
        .some(v => String(v || '').toLowerCase().includes(q)))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [payments, filter, search]);

  const confirm = async (p: any) => {
    setBusyId(p.paymentId);
    // Optimistic: the row flips immediately, and rolls back if the call fails.
    const before = payments;
    setPayments(cur => cur.map(x => x.paymentId === p.paymentId ? { ...x, status: 'PAID' } : x));
    try {
      await verifyAdminPayment(p.paymentId);
      await load();
    } catch (err: any) {
      setPayments(before);
      setLoadError(`Could not confirm ${p.teamName}: ${err.message}`);
    } finally {
      setBusyId(null);
    }
  };

  const doReject = async () => {
    if (!rejecting) return;
    setBusyId(rejecting.paymentId);
    try {
      await rejectAdminPayment(rejecting.paymentId, rejectReason.trim() || 'Payment could not be found in the account.');
      setRejecting(null);
      setRejectReason('');
      await load();
    } catch (err: any) {
      setLoadError(`Could not reject: ${err.message}`);
    } finally {
      setBusyId(null);
    }
  };

  const copy = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 1500);
  };

  // ---------------------------------------------------------------- login
  if (!token) {
    return (
      <div className="max-w-md mx-auto mt-12 mb-24">
        <div className="bg-white border-2 border-[#111827] shadow-[6px_6px_0_0_#111827] p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#111827] flex items-center justify-center">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-pixel text-sm">PAYMENT DESK</h1>
              <p className="text-xs text-[#111827]/60">ADG x MosaIC · Organiser access</p>
            </div>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold mb-1 uppercase tracking-wide">Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full border-2 border-[#111827] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#E5005A]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1 uppercase tracking-wide">Password</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)} required autoFocus
                className="w-full border-2 border-[#111827] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#E5005A]"
              />
            </div>
            {loginError && (
              <p className="text-sm text-[#C62828] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" /> {loginError}
              </p>
            )}
            <button
              type="submit" disabled={loggingIn}
              className="w-full bg-[#111827] text-white font-pixel text-xs py-3 hover:bg-[#E5005A] transition-colors disabled:opacity-50"
            >
              {loggingIn ? 'CHECKING…' : 'SIGN IN'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------- desk
  return (
    <div className="mb-24">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-pixel text-base sm:text-lg">PAYMENT DESK</h1>
          <p className="text-xs text-[#111827]/60 mt-1">
            Tick a squad once its full amount is in your account. Members may pay separately.
            {lastSynced && <> · synced {lastSynced.toLocaleTimeString()}</>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} disabled={loading}
            className="flex items-center gap-2 border-2 border-[#111827] px-3 py-2 text-xs font-bold hover:bg-[#111827] hover:text-white transition-colors disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button onClick={logout}
            className="flex items-center gap-2 border-2 border-[#111827] px-3 py-2 text-xs font-bold hover:bg-[#C62828] hover:text-white hover:border-[#C62828] transition-colors">
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Stat icon={Clock} label="Awaiting check" value={counts.awaiting} tone="#F9A825" />
        <Stat icon={CheckCircle2} label="Confirmed" value={counts.confirmed} tone="#2E7D32" />
        <Stat icon={XCircle} label="Rejected" value={counts.rejected} tone="#C62828" />
        <Stat icon={IndianRupee} label="Collected" value={`₹${counts.collected.toLocaleString('en-IN')}`} tone="#111827" />
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex border-2 border-[#111827]">
          {(['AWAITING', 'CONFIRMED', 'REJECTED', 'ALL'] as Filter[]).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-2 text-xs font-bold transition-colors ${
                filter === f ? 'bg-[#111827] text-white' : 'hover:bg-[#111827]/10'
              }`}>
              {f === 'AWAITING' ? 'Awaiting' : f === 'CONFIRMED' ? 'Confirmed' : f === 'REJECTED' ? 'Rejected' : 'All'}
            </button>
          ))}
        </div>
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#111827]/40" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search team, leader, UTR or registration ID"
            className="w-full border-2 border-[#111827] pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E5005A]"
          />
        </div>
      </div>

      {loadError && (
        <div className="border-2 border-[#C62828] bg-[#C62828]/5 text-[#C62828] px-4 py-3 mb-4 text-sm flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{loadError}</span>
        </div>
      )}

      {/* Rows */}
      {visible.length === 0 ? (
        <div className="border-2 border-dashed border-[#111827]/30 p-12 text-center">
          <p className="font-pixel text-xs text-[#111827]/50">
            {loading ? 'LOADING…' : filter === 'AWAITING' ? 'NOTHING WAITING — ALL CLEAR' : 'NOTHING HERE'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map(p => {
            const awaiting = AWAITING_STATES.includes(p.status);
            const busy = busyId === p.paymentId;
            return (
              <div key={p.paymentId}
                className={`border-2 border-[#111827] bg-white p-4 ${
                  p.status === 'PAID' ? 'border-l-8 border-l-[#2E7D32]'
                  : p.status === 'REJECTED' ? 'border-l-8 border-l-[#C62828] opacity-70'
                  : 'border-l-8 border-l-[#F9A825]'
                }`}>
                <div className="flex flex-wrap gap-4 items-start justify-between">
                  <div className="min-w-[220px] flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-pixel text-xs">{p.teamName || '(no team name)'}</span>
                      <StatusPill status={p.status} />
                    </div>
                    <p className="text-sm mt-1">
                      {p.leaderName} · <span className="text-[#111827]/60">{p.contactEmail}</span>
                    </p>
                    <p className="text-xs text-[#111827]/60 mt-0.5">
                      {p.registrationId} · {p.method || 'UPI'} · ₹{Number(p.amount).toLocaleString('en-IN')}
                    </p>
                  </div>

                  <div className="min-w-[260px]">
                    <p className="text-[10px] uppercase tracking-wide font-bold text-[#111827]/50 mb-1">
                      Payments submitted by team
                    </p>
                    {(p.entries || []).length === 0 ? (
                      <p className="text-sm text-[#111827]/40 italic">nothing submitted yet</p>
                    ) : (
                      <div className="space-y-1">
                        {(p.entries || []).map((e: any) => (
                          <div key={e._id} className="flex items-center gap-2 text-sm">
                            <button onClick={() => copy(e.transactionReference)} title="Click to copy"
                              className="font-mono bg-[#111827]/5 border border-[#111827]/20 px-2 py-0.5 hover:bg-[#111827]/10 flex items-center gap-1.5">
                              {e.transactionReference}
                              <Copy className="w-3 h-3 opacity-40" />
                            </button>
                            <span className="font-bold tabular-nums">₹{Number(e.amount).toLocaleString('en-IN')}</span>
                            <span className="text-[#111827]/50 text-xs truncate max-w-[110px]">{e.payerName}</span>
                            {e.evidence?.url && (
                              <a href={e.evidence.url} target="_blank" rel="noreferrer" title="View screenshot"
                                className="text-[#E5005A]"><ImageIcon className="w-3.5 h-3.5" /></a>
                            )}
                            {copied === e.transactionReference && <span className="text-[10px] text-[#2E7D32]">copied</span>}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* A squad owes per head, so the target moves with team size. */}
                    <div className="mt-2 pt-2 border-t border-[#111827]/20 text-sm flex items-baseline gap-2 flex-wrap">
                      <span className="font-bold tabular-nums">
                        ₹{Number(p.amountPaid || 0).toLocaleString('en-IN')}
                      </span>
                      <span className="text-[#111827]/50">
                        of ₹{Number(p.amountExpected || 0).toLocaleString('en-IN')}
                        {p.teamSize ? ` (${p.teamSize} players)` : ''}
                      </span>
                      {!p.fullyPaid && p.status !== 'REJECTED' && (
                        <span className="text-[#C62828] font-bold text-xs">
                          short ₹{Number(p.amountRemaining || 0).toLocaleString('en-IN')}
                        </span>
                      )}
                      {p.fullyPaid && p.status !== 'PAID' && p.status !== 'REJECTED' && (
                        <span className="text-[#2E7D32] font-bold text-xs">fully covered</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {awaiting ? (
                      <>
                        <button onClick={() => confirm(p)} disabled={busy || !p.fullyPaid}
                          title={p.fullyPaid
                            ? 'Confirm this squad and issue their entry pass'
                            : `Still short ₹${Number(p.amountRemaining || 0).toLocaleString('en-IN')} — the whole squad must be paid for before it goes in`}
                          className="flex items-center gap-2 bg-[#2E7D32] text-white font-bold text-sm px-4 py-3 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed">
                          <Check className="w-4 h-4" /> {busy ? 'Saving…' : p.fullyPaid ? 'Money received' : 'Part paid'}
                        </button>
                        <button onClick={() => { setRejecting(p); setRejectReason(''); }} disabled={busy}
                          title="Payment not found"
                          className="flex items-center gap-2 border-2 border-[#C62828] text-[#C62828] font-bold text-sm px-3 py-3 hover:bg-[#C62828] hover:text-white disabled:opacity-50">
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : p.status === 'PAID' ? (
                      <span className="flex items-center gap-2 text-[#2E7D32] font-bold text-sm">
                        <CheckCircle2 className="w-5 h-5" /> Confirmed
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 text-[#C62828] font-bold text-sm">
                        <XCircle className="w-5 h-5" /> Rejected
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject dialog */}
      {rejecting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setRejecting(null)}>
          <div className="bg-white border-2 border-[#111827] shadow-[6px_6px_0_0_#111827] p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <h2 className="font-pixel text-xs mb-2">REJECT PAYMENT</h2>
            <p className="text-sm text-[#111827]/70 mb-4">
              Team <strong>{rejecting.teamName}</strong> will be marked rejected and emailed the reason.
            </p>
            <textarea
              value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3} autoFocus
              placeholder="e.g. No credit of ₹500 found against this UTR"
              className="w-full border-2 border-[#111827] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E5005A]"
            />
            <div className="flex gap-2 mt-4">
              <button onClick={doReject} disabled={busyId === rejecting.paymentId}
                className="flex-1 bg-[#C62828] text-white font-bold text-sm py-3 hover:brightness-110 disabled:opacity-50">
                {busyId === rejecting.paymentId ? 'Saving…' : 'Reject payment'}
              </button>
              <button onClick={() => setRejecting(null)}
                className="px-4 border-2 border-[#111827] font-bold text-sm hover:bg-[#111827] hover:text-white">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value, tone }: any) {
  return (
    <div className="border-2 border-[#111827] bg-white p-3">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4" style={{ color: tone }} />
        <span className="text-[10px] uppercase tracking-wide font-bold text-[#111827]/60">{label}</span>
      </div>
      <p className="font-pixel text-sm" style={{ color: tone }}>{value}</p>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    PAID: ['CONFIRMED', '#2E7D32'],
    REJECTED: ['REJECTED', '#C62828'],
    PENDING_VERIFICATION: ['AWAITING CHECK', '#F9A825'],
    PENDING: ['NOT PAID YET', '#6B7280'],
    PROCESSING: ['PROCESSING', '#6B7280'],
    NOT_STARTED: ['NOT STARTED', '#6B7280']
  };
  const [label, color] = map[status] || [status, '#6B7280'];
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 border" style={{ color, borderColor: color }}>
      {label}
    </span>
  );
}

export default PaymentDeskPage;

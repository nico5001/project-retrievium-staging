'use client';

import * as React from 'react';
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';


/* ===========================
   Types
   =========================== */

type Risk = 'SAFE' | 'STANDARD' | 'OVERCLOCK';

type Me = {
  wallet: string;
  rzn: number;
  ymd: string;
  energy: number;
  scans_done: number;
  stabilize_count: number;
  scan_ready: boolean;
};

type InvRow = { item: string; qty: number };

type LbRow = { wallet: string; rzn: number; scans?: number; stabilizes?: number; crafts?: number };

type ScanRun = { runId: string; seed: string } | null;

type DropItem = { key: string; qty: number };
type StabilizeResult = { ok: boolean; rzn: number; items: DropItem[]; seed?: string };

type Recipe = {
  key: string;
  requires: Record<string, number>;
  desc: string;
};

type PurchaseResult = { message: string; newBalance: number };

type ShopItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  available: boolean;
  purchased: boolean;
  soldCount: number;
  maxQuantity?: number;
};

/* ===========================
   Small helpers
   =========================== */

async function fetchJSON<T>(input: RequestInfo, init?: RequestInit) {
  const r = await fetch(input, { credentials: 'include', ...init });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((j as any)?.error || r.statusText);
  return j as T;
}

function short(addr?: string) {
  return addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : '';
}

/* ===========================
   Provider helpers (robust)
   =========================== */

async function requestAccounts(provider: any): Promise<string[]> {
  if (!provider) return [];
  if (typeof provider.request === 'function') {
    return (await provider.request({ method: 'eth_requestAccounts' })) as string[];
  }
  if (typeof provider.enable === 'function') {
    return (await provider.enable()) as string[];
  }
  if (typeof provider.send === 'function') {
    const res = await provider.send('eth_requestAccounts', []);
    return Array.isArray(res) ? res : res?.result ?? [];
  }
  return [];
}

async function personalSign(provider: any, wallet: string, message: string): Promise<string> {
  if (provider?.request) {
    return (await provider.request({
      method: 'personal_sign',
      params: [message, wallet],
    })) as string;
  }
  if (typeof provider.send === 'function') {
    const res = await provider.send('personal_sign', [message, wallet]);
    return res?.result ?? res;
  }
  throw new Error('Wallet does not support personal_sign');
}

/* ===========================
   Memory puzzle (enhanced sci-fi)
   =========================== */

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashStringToSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function ScanMemory({
  seed,
  onSolved,
  disabled,
}: {
  seed: string;
  onSolved: (score: number) => void;
  disabled?: boolean;
}) {
  const rng = React.useMemo(() => mulberry32(hashStringToSeed(seed || 'seedless')), [seed]);

  const faces = React.useMemo(() => {
    const base = ['🧬', '🔬', '🧪', '⚗️', '🔋', '💎', '⚡', '🌀'];
    return base.slice(0, 8);
  }, []);

  const deck = React.useMemo(() => {
    const arr = [...faces, ...faces];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [faces, rng]);

  const [revealed, setRevealed] = React.useState<number[]>([]);
  const [matched, setMatched] = React.useState<boolean[]>(() => Array(16).fill(false));
  const [flips, setFlips] = React.useState(0);

  // reset when seed/deck changes
  React.useEffect(() => {
    setRevealed([]);
    setMatched(Array(deck.length).fill(false));
    setFlips(0);
  }, [deck.length, seed]);

  function clickCard(i: number) {
    if (disabled) return;
    if (matched[i]) return;
    if (revealed.includes(i)) return;
    if (revealed.length === 2) return;

    const next = [...revealed, i];
    setRevealed(next);

    if (next.length === 2) {
      setFlips((f) => f + 1);
      const [a, b] = next;
      if (deck[a] === deck[b]) {
        setTimeout(() => {
          setMatched((m) => {
            const mm = m.slice();
            mm[a] = true;
            mm[b] = true;
            return mm;
          });
          setRevealed([]);
        }, 250);
      } else {
        setTimeout(() => setRevealed([]), 700);
      }
    }
  }

  // ✅ Call onSolved AFTER render when puzzle is complete
  React.useEffect(() => {
    if (matched.length && matched.every(Boolean)) {
      const optimalPairs = faces.length; // minimal number of flips ≈ number of pairs
      const efficiency = optimalPairs / Math.max(flips, optimalPairs);
      const score = Math.min(1, Math.max(0.5, efficiency));
      // schedule to guarantee it runs after commit
      queueMicrotask(() => onSolved(score));
    }
  }, [matched, faces.length, flips, onSolved]);

  const cols = 4;

  return (
    <div className="relative rounded-xl border border-cyan-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/30 p-6 shadow-2xl backdrop-blur-sm">
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent animate-pulse"></div>
      <div className="relative z-10">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 rounded-full bg-cyan-400 animate-pulse"></div>
            <div className="font-mono text-lg font-semibold text-cyan-100 tracking-wider">
              NEURAL SCAN MATRIX
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-cyan-300/80 font-mono">
            <span className="bg-cyan-950/50 px-2 py-1 rounded border border-cyan-700/30">
              FLIPS: {flips}
            </span>
          </div>
        </div>

        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {deck.map((face, i) => {
            const up = revealed.includes(i) || matched[i];
            const isMatched = matched[i];
            return (
              <button
                key={i}
                onClick={() => clickCard(i)}
                disabled={disabled}
                className={`group relative h-20 sm:h-24 md:h-28 rounded-lg border-2 transition-all duration-300 text-2xl sm:text-3xl md:text-4xl flex items-center justify-center overflow-hidden ${
                  isMatched
                    ? 'border-emerald-400/60 bg-gradient-to-br from-emerald-900/40 to-emerald-800/20 shadow-emerald-400/20 shadow-lg'
                    : up
                    ? 'border-cyan-400/60 bg-gradient-to-br from-cyan-900/40 to-cyan-800/20 shadow-cyan-400/20 shadow-lg'
                    : 'border-slate-600/40 bg-gradient-to-br from-slate-800 to-slate-900 hover:border-cyan-500/50 hover:shadow-cyan-500/10 hover:shadow-lg'
                } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="absolute inset-0 opacity-10">
                  <div className="h-full w-full bg-gradient-to-br from-transparent via-cyan-500/20 to-transparent"></div>
                </div>
                <span className={`relative z-10 transition-all duration-300 ${up ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
                  {face}
                </span>
                <span className={`absolute inset-0 flex items-center justify-center transition-all duration-300 text-slate-500 ${up ? 'opacity-0 scale-75' : 'opacity-100 scale-100'}`}>
                  ◊
                </span>
                {!up && !disabled && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-cyan-300/70 font-mono">MATCH NEURAL PATTERNS TO COMPLETE SCAN</p>
          <div className="flex items-center gap-1 text-xs text-cyan-400/80">
            <div className="h-2 w-2 rounded-full bg-cyan-400 animate-ping"></div>
            <span className="font-mono">SCANNING...</span>
          </div>
        </div>
      </div>
    </div>
  );
}


/* ===========================
   Wallet Gate (Tanto Connect; no guest)
   =========================== */

import {
  requestRoninWalletConnector,
  ConnectorEvent,
} from '@sky-mavis/tanto-connect';

type ToastFn = (o: { message: string; type?: 'success' | 'error' | 'warning' | 'info' }) => void;

function WalletGate({
  me,
  onAuthed,
  pushToast,
}: {
  me: Me | null;
  onAuthed: () => void;
  pushToast: ToastFn;
}) {
  async function connect() {
    try {
      const connector = await requestRoninWalletConnector();

      connector.on(ConnectorEvent.DISCONNECT, () => {
        pushToast({ message: 'Disconnected.', type: 'info' });
      });
      connector.on(ConnectorEvent.ACCOUNTS_CHANGED, () => {
        // optionally refresh UI on account switch
      });
      await connector.autoConnect?.();

      const accounts = await connector.requestAccounts();
      const wallet = (accounts?.[0] || '').toLowerCase();
      if (!wallet) throw new Error('No wallet account returned');

      const { message } = await fetchJSON<{ message: string }>('/api/auth/nonce', { method: 'POST' });

      const provider = await connector.getProvider(); // EIP-1193
      const signature: string = await provider.request({
        method: 'personal_sign',
        params: [message, wallet],
      });

      await fetchJSON('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet, signature, message }),
      });

      pushToast({ message: 'Wallet connected.', type: 'success' });
      onAuthed();
    } catch (e: any) {
      const msg = String(e?.message || e);
      const cancelled = /user rejected|user denied|rejected the request|request rejected|cancel/i.test(msg);
      pushToast({
        message: cancelled ? 'Connection request was cancelled.' : `Connect failed: ${msg}`,
        type: cancelled ? 'warning' : 'error',
      });
      console.warn('wallet connect failed', e);
    }
  }

  async function disconnect() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
      try {
        const anyWin = window as any;
        const provider = anyWin.ronin || anyWin.ethereum;
        if (provider?.request) {
          await provider.request({
            method: 'wallet_revokePermissions',
            params: [{ eth_accounts: {} }],
          }).catch(() => {});
        }
      } catch {}
    } finally {
      location.reload();
    }
  }

  return (
    <div className="flex items-center gap-3">
      {me?.wallet ? (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-cyan-500/30 bg-gradient-to-r from-slate-900 to-cyan-950/30 px-4 py-2">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></div>
            {/* uses the existing short() declared earlier in page.tsx */}
            <div className="font-mono text-cyan-100 tracking-wider">{short(me.wallet)}</div>
          </div>
          <button
            onClick={disconnect}
            className="text-sm text-cyan-300/80 font-mono hover:text-cyan-200 underline decoration-dotted hover:decoration-solid transition-colors"
          >
            DISCONNECT
          </button>
        </div>
      ) : (
        <button
          onClick={connect}
          className="group relative overflow-hidden rounded-lg border border-cyan-500/50 bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-2 font-mono font-semibold text-white transition-all duration-300 hover:from-cyan-500 hover:to-blue-500 hover:shadow-cyan-500/25 hover:shadow-lg"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
          <span className="relative z-10">CONNECT NEURAL LINK</span>
        </button>
      )}
    </div>
  );
}




/* ===========================
   Main Page
   =========================== */

const RECIPES: Recipe[] = [
  {
    key: 'REC_EAR_SIGIL_C',
    requires: { RUNE_A: 2, RUNE_B: 1, CAT_X: 1 },
    desc: 'Align opposite charges to etch a low-intensity ear sigil.',
  },
  {
    key: 'REC_EAR_SIGIL_R',
    requires: { RUNE_C: 2, RUNE_D: 1, CAT_Y: 1 },
    desc: 'Recreate the 3-beat resonance to engrave a rare sigil.',
  },
  {
    key: 'REC_IRIS_LENS_E',
    requires: { RUNE_D: 2, RUNE_E: 1, CAT_Z: 1 },
    desc: 'Set lens shutters within the Gamma threshold window.',
  },
];

export default function PlayPage(): JSX.Element {
  const [me, setMe] = React.useState<Me | null>(null);
  const [inv, setInv] = React.useState<InvRow[]>([]);
  const [lb, setLb] = React.useState<LbRow[]>([]);
  const [risk, setRisk] = React.useState<Risk>('STANDARD');

  const [scan, setScan] = React.useState<ScanRun>(null);
  const [busy, setBusy] = React.useState(false);
  const [stabRes, setStabRes] = React.useState<StabilizeResult | null>(null);

  // ---- SHOP state
  const [shopItems, setShopItems] = React.useState<ShopItem[]>([]);
  const [shopLoading, setShopLoading] = React.useState(false);
  const [purchaseResult, setPurchaseResult] = React.useState<PurchaseResult | null>(null);

  // Toast (hook lives here — component scope only)
  const { toast } = useToast();

  const push = React.useCallback(
  (
    arg:
      | string
      | { message: string; type?: "success" | "error" | "warning" | "info"; description?: string }
  ) => {
    if (typeof arg === "string") {
      toast({ title: arg });
      return;
    }
    const variant = arg.type === "error" ? "destructive" : "default";
    toast({ title: arg.message, description: arg.description, variant });
  },
  [toast]
);

  // Loaders
  const refreshMe = React.useCallback(async () => {
    try {
      const data = await fetchJSON<Me>('/api/me', { cache: 'no-store' });
      setMe(data);
    } catch {
      setMe(null);
    }
  }, []);
  const refreshInv = React.useCallback(async () => {
    try {
      const data = await fetchJSON<{ items: InvRow[] }>('/api/inventory', { cache: 'no-store' });
      setInv(data.items || []);
    } catch {
      setInv([]);
    }
  }, []);
  const refreshLb = React.useCallback(async () => {
    try {
      const data = await fetchJSON<{ rows: LbRow[] }>('/api/leaderboard', { cache: 'no-store' });
    setLb(data.rows || []);
    } catch {
      setLb([]);
    }
  }, []);

  const refreshShop = React.useCallback(async () => {
    try {
      setShopLoading(true);
      const data = await fetchJSON<{ items: ShopItem[] }>('/api/shop', { cache: 'no-store' });
      setShopItems(data.items || []);
    } catch {
      setShopItems([]);
    } finally {
      setShopLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refreshMe();
    refreshInv();
    refreshLb();
    refreshShop();
  }, [refreshMe, refreshInv, refreshLb, refreshShop]);

  // Actions
  async function doRefuel() {
    try {
      setBusy(true);
      await fetchJSON('/api/refuel', { method: 'POST' });
      await Promise.all([refreshMe(), refreshInv(), refreshLb()]);
      push({ message: 'Refueled +10 ENERGY (-5 RZN).', type: 'success' });
    } catch (e: any) {
      push({ message: e?.message || 'Refuel failed', type: 'error' });
    } finally {
      setBusy(false);
    }
  }

  async function startScan() {
    try {
      setBusy(true);
      const res = await fetch('/api/scan/start', { method: 'POST' });
      const j = await res.json();
      if (!res.ok) {
        if (j?.error === 'pending-scan') {
          push({ message: 'Resuming pending scan…', type: 'info' });
          return resumeScan();
        }
        throw new Error(j?.error || 'scan-start-failed');
      }
      setScan({ runId: j.runId, seed: j.seed });
      await refreshMe();
      push({ message: 'Scan initialized. Good luck!', type: 'success' });
    } catch (e: any) {
      push({ message: e?.message || 'Start failed', type: 'error' });
    } finally {
      setBusy(false);
    }
  }

  async function resumeScan() {
    try {
      setBusy(true);
      const j = await fetchJSON<{ runId: string; seed: string }>('/api/scan/resume');
      setScan({ runId: j.runId, seed: j.seed });
      push({ message: 'Scan resumed.', type: 'info' });
    } catch (e: any) {
      push({ message: e?.message || 'No pending scan', type: 'error' });
    } finally {
      setBusy(false);
    }
  }

  async function completeScan(score: number) {
    if (!scan) return;
    try {
      setBusy(true);
      await fetchJSON('/api/scan/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runId: scan.runId, score }),
      });
      setScan(null);
      await Promise.all([refreshMe(), refreshInv(), refreshLb()]);
      push({ message: 'Scan completed and recorded.', type: 'success' });
    } catch (e: any) {
      push({ message: e?.message || 'Complete failed', type: 'error' });
    } finally {
      setBusy(false);
    }
  }

  async function stabilize() {
    try {
      setBusy(true);
      const j = await fetchJSON<StabilizeResult>('/api/stabilize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ risk }),
      });
      setStabRes(j);
      await Promise.all([refreshMe(), refreshInv(), refreshLb()]);
      push({ message: `Stabilization complete: +${j.rzn} RZN`, type: 'success' });
    } catch (e: any) {
      push({ message: e?.message || 'Stabilize failed', type: 'error' });
    } finally {
      setBusy(false);
    }
  }

  async function craft(key: string) {
    try {
      setBusy(true);
      await fetchJSON('/api/craft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });
      await Promise.all([refreshMe(), refreshInv(), refreshLb()]);
      push({ message: 'Synthesis complete.', type: 'success' });
    } catch (e: any) {
      push({ message: e?.message || 'Craft failed', type: 'error' });
    } finally {
      setBusy(false);
    }
  }

  // ---- SHOP: buy action (tries /api/shop/buy, falls back to /api/shop/purchase)
  async function buy(itemId: string) {
    try {
      setBusy(true);
      let result: PurchaseResult;
      try {
        result = await fetchJSON<PurchaseResult>('/api/shop/buy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: itemId }),
        });
      } catch {
        // fallback route name
        result = await fetchJSON<PurchaseResult>('/api/shop/purchase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: itemId }),
        });
      }
      setPurchaseResult(result);
      await Promise.all([refreshMe(), refreshShop()]);
      push({ message: 'Whitelist secured!', type: 'success' });
    } catch (e: any) {
      push({ message: e?.message || 'Purchase failed', type: 'error' });
    } finally {
      setBusy(false);
    }
  }

  const energy = me?.energy ?? 0;
  const rzn = me?.rzn ?? 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-950">
      {/* Animated background */}
      <div className="fixed inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/5 to-transparent animate-pulse"></div>
      </div>

      <main className="relative z-10 mx-auto max-w-6xl px-6 pb-16 pt-20">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full bg-cyan-400 animate-pulse"></div>
              <h1 className="font-mono text-3xl font-bold text-cyan-100 tracking-wider">RETRIEVIUM</h1>
              <span className="rounded border border-cyan-500/30 bg-cyan-950/50 px-2 py-1 text-xs text-cyan-300 font-mono">
                PRE-SEASON
              </span>
            </div>
          </div>
          <WalletGate
            me={me}
            onAuthed={async () => {
              await Promise.all([refreshMe(), refreshInv(), refreshLb(), refreshShop()]);
              push({ message: 'Neural link established.', type: 'info' });
            }}
            pushToast={push}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Control Panel */}
            <div className="rounded-xl border border-cyan-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/30 p-6 shadow-2xl backdrop-blur-sm">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse"></div>
                  <span className="font-mono text-lg font-semibold text-cyan-100 tracking-wider">
                    LABORATORY CONTROL PANEL
                  </span>
                </div>
              </div>

              {/* Resource Display */}
              <div className="mb-6 grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-cyan-700/30 bg-slate-800/50 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-cyan-300 font-mono text-sm">ENERGY CORE</span>
                  </div>
                  <div className="text-2xl font-bold text-cyan-100 font-mono">{energy}</div>
                  <div className="h-2 bg-slate-700 rounded-full mt-2">
                    <div
                      className="h-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (energy / 100) * 100)}%` }}
                    ></div>
                  </div>
                </div>
                <div className="rounded-lg border border-emerald-700/30 bg-slate-800/50 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-emerald-300 font-mono text-sm">RZN UNITS</span>
                  </div>
                  <div className="text-2xl font-bold text-emerald-100 font-mono">{rzn}</div>
                  <div className="text-xs text-emerald-300/70 font-mono mt-1">NEURAL CURRENCY</div>
                </div>
              </div>

              {/* Scan Operations */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-mono text-sm text-cyan-300 tracking-wider">
                    01 // NEURAL SCANNING
                  </span>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={startScan}
                    disabled={busy || energy < 8}
                    className={`group relative overflow-hidden rounded-lg border px-6 py-3 font-mono font-semibold transition-all duration-300 ${
                      energy >= 8
                        ? 'border-cyan-500/50 bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-500 hover:to-blue-500 hover:shadow-cyan-500/25 hover:shadow-lg'
                        : 'border-slate-600/30 bg-slate-800/50 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    <span className="relative z-10">INITIATE SCAN [-8 ENERGY]</span>
                  </button>
                  <button
                    onClick={resumeScan}
                    disabled={busy}
                    className="group relative overflow-hidden rounded-lg border border-slate-500/50 bg-slate-800 px-4 py-3 font-mono text-slate-200 hover:bg-slate-700 transition-all duration-300"
                  >
                    <span className="relative z-10">RESUME</span>
                  </button>
                  <button
                    onClick={doRefuel}
                    disabled={busy || rzn < 5}
                    className={`group relative overflow-hidden rounded-lg border px-4 py-3 font-mono transition-all duration-300 ${
                      rzn >= 5
                        ? 'border-emerald-500/50 bg-emerald-900/50 text-emerald-100 hover:bg-emerald-800/50'
                        : 'border-slate-600/30 bg-slate-800/50 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <span className="relative z-10">REFUEL [+10 ENERGY / -5 RZN]</span>
                  </button>
                </div>
              </div>

              {/* Puzzle */}
              {scan && (
                <div className="mb-6">
                  <ScanMemory seed={scan.seed} onSolved={completeScan} disabled={busy} />
                </div>
              )}

              {/* Risk Selection */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-mono text-sm text-cyan-300 tracking-wider">
                    02 // RISK PROTOCOL
                  </span>
                </div>
                <div className="flex gap-3">
                  {(['SAFE', 'STANDARD', 'OVERCLOCK'] as Risk[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => setRisk(r)}
                      className={`rounded-lg border px-4 py-2 font-mono text-sm font-semibold transition-all duration-300 ${
                        risk === r
                          ? 'border-orange-500/50 bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-orange-500/25 shadow-md'
                          : 'border-slate-600/30 bg-slate-800/50 text-slate-300 hover:border-orange-500/30 hover:bg-slate-700/50'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stabilize */}
              <button
                onClick={stabilize}
                disabled={busy || energy < 12}
                className={`group relative overflow-hidden w-full rounded-lg border px-6 py-4 font-mono font-bold text-lg transition-all duration-300 ${
                  energy >= 12
                    ? 'border-emerald-500/50 bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-500 hover:to-green-500 hover:shadow-emerald-500/25 hover:shadow-lg'
                    : 'border-slate-600/30 bg-slate-800/50 text-slate-400 cursor-not-allowed'
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                <span className="relative z-10">STABILIZE ANOMALY [-12 ENERGY]</span>
              </button>

              <p className="mt-4 text-xs text-slate-400 font-mono">
                // Scans unlock neural patterns for stabilization. Stabilize to earn RZN and rare
                materials.
              </p>
            </div>

            {/* Inventory */}
            <div className="rounded-xl border border-cyan-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/30 p-6 shadow-2xl backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-3 w-3 rounded-full bg-blue-400 animate-pulse"></div>
                <h3 className="font-mono text-lg font-semibold text-cyan-100 tracking-wider">
                  LABORATORY INVENTORY
                </h3>
              </div>
              {inv.length === 0 ? (
                <div className="text-sm text-slate-400 font-mono bg-slate-800/30 rounded-lg p-4 border border-slate-700/30">
                  // NO MATERIALS DETECTED
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {inv.map((r) => (
                    <div
                      key={r.item}
                      className="flex items-center justify-between rounded-lg border border-slate-600/30 bg-slate-800/50 px-4 py-3"
                    >
                      <span className="font-mono text-slate-200">{r.item}</span>
                      <span className="rounded bg-cyan-900/50 px-2 py-1 text-xs font-mono text-cyan-100 border border-cyan-700/30">
                        {r.qty}
                      </span>
                    </div>
                  ))}
                </div>

              )}
            </div>
            <div className="mt-4">
                    <Link
                      href="/play/crafting"
                      className="group inline-flex items-center gap-2 rounded-md border border-cyan-400/30 bg-cyan-400/5 px-3 py-2 text-xs font-semibold tracking-wide text-cyan-300 hover:bg-cyan-400/10 hover:border-cyan-400/40 transition-colors"
                    >
                      <svg
                        className="h-4 w-4 opacity-80 group-hover:opacity-100"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      <span>Open Crafting &amp; Equipment</span>
                    </Link>
                  </div>


            {/* Crafting */}
            <div className="rounded-xl border border-cyan-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/30 p-6 shadow-2xl backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-3 w-3 rounded-full bg-purple-400 animate-pulse"></div>
                <h3 className="font-mono text-lg font-semibold text-cyan-100 tracking-wider">
                  SYNTHESIS PROTOCOLS
                </h3>
              </div>
              <div className="space-y-4">
                {RECIPES.map((r) => (
                  <div key={r.key} className="rounded-lg border border-slate-600/30 bg-slate-800/30 p-4">
                    <div className="font-mono font-semibold text-purple-200 mb-2">{r.key}</div>
                    <div className="text-sm text-slate-300 mb-3">{r.desc}</div>
                    <div className="mb-3 text-xs text-slate-400 font-mono">
                      // REQUIRES:{' '}
                      {Object.entries(r.requires)
                        .map(([k, v]) => `${k}×${v}`)
                        .join(', ')}
                    </div>
                    <button
                      onClick={() => craft(r.key)}
                      disabled={busy}
                      className="group relative overflow-hidden rounded border border-purple-500/50 bg-purple-900/50 px-4 py-2 font-mono text-purple-100 hover:bg-purple-800/50 transition-all duration-300"
                    >
                      <span className="relative z-10">SYNTHESIZE</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* ===== Laboratory Shop ===== */}
            <div className="rounded-xl border border-cyan-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/30 p-6 shadow-2xl backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse"></div>
                <h3 className="font-mono text-lg font-semibold text-cyan-100 tracking-wider">
                  LABORATORY SHOP
                </h3>
              </div>

              {shopLoading ? (
                <div className="text-sm text-slate-400 font-mono">// LOADING CATALOG…</div>
              ) : shopItems.length === 0 ? (
                <div className="text-sm text-slate-400 font-mono">// NO ITEMS AVAILABLE</div>
              ) : (
                <div className="space-y-4">
                  {shopItems.map((it) => {
                    const soldOut =
                      it.available === false ||
                      (typeof it.maxQuantity === 'number' && it.soldCount >= it.maxQuantity);
                    const cantAfford = (me?.rzn ?? 0) < it.price;
                    const disabled = busy || soldOut || it.purchased || cantAfford;

                    return (
                      <div
                        key={it.id}
                        className="rounded-lg border border-slate-600/30 bg-slate-800/50 p-4"
                      >
                        <div className="font-mono font-semibold text-cyan-100">{it.name}</div>
                        <p className="text-sm text-slate-300 mt-1">{it.description}</p>
                        <div className="mt-2 text-xs text-slate-400 font-mono">
                          // PRICE: <span className="text-emerald-300 font-bold">{it.price}</span>{' '}
                          RZN
                          {typeof it.maxQuantity === 'number' && (
                            <span className="ml-2">
                              // SOLD: {it.soldCount}/{it.maxQuantity}
                            </span>
                          )}
                        </div>
                        <div className="mt-3">
                          <button
                            onClick={() => buy(it.id)}
                            disabled={disabled}
                            className={`px-4 py-2 rounded border font-mono text-sm transition-all ${
                              disabled
                                ? 'border-slate-600/30 bg-slate-800/50 text-slate-400 cursor-not-allowed'
                                : 'border-emerald-500/50 bg-emerald-900/50 text-emerald-100 hover:bg-emerald-800/50'
                            }`}
                          >
                            {it.purchased
                              ? 'OWNED'
                              : soldOut
                              ? 'SOLD OUT'
                              : cantAfford
                              ? 'INSUFFICIENT RZN'
                              : 'BUY'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* System Status */}
            <div className="rounded-xl border border-cyan-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/30 p-6 shadow-2xl backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-3 w-3 rounded-full bg-yellow-400 animate-pulse"></div>
                <div className="font-mono font-semibold text-cyan-100 tracking-wider">SYSTEM STATUS</div>
              </div>
              <div className="text-sm text-slate-300 font-mono">
                // Daily reset at midnight (UTC+08:00)
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs">
                <div className="h-2 w-2 rounded-full bg-emerald-400"></div>
                <span className="text-emerald-300 font-mono">OPERATIONAL</span>
              </div>
            </div>

            {/* Instructions */}
            <div className="rounded-xl border border-cyan-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/30 p-6 shadow-2xl backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-3 w-3 rounded-full bg-blue-400 animate-pulse"></div>
                <div className="font-mono font-semibold text-cyan-100 tracking-wider">PROTOCOL GUIDE</div>
              </div>
              <div className="space-y-3 text-sm text-slate-300 font-mono">
                <div className="flex items-start gap-3">
                  <span className="text-cyan-400 font-bold">01</span>
                  <span>Connect neural link interface</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-cyan-400 font-bold">02</span>
                  <span>Initiate scan sequence (8 energy units)</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-cyan-400 font-bold">03</span>
                  <span>Complete neural pattern matching</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-cyan-400 font-bold">04</span>
                  <span>Select risk protocol level</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-cyan-400 font-bold">05</span>
                  <span>Execute stabilization (12 energy units)</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-cyan-400 font-bold">06</span>
                  <span>Collect RZN rewards and materials</span>
                </div>
              </div>
            </div>

            {/* Leaderboard */}
            <div className="rounded-xl border border-cyan-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/30 p-6 shadow-2xl backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-3 w-3 rounded-full bg-orange-400 animate-pulse"></div>
                <div className="font-mono font-semibold text-cyan-100 tracking-wider">NEURAL RANKINGS</div>
              </div>
              {lb.length === 0 ? (
                <div className="text-sm text-slate-400 font-mono bg-slate-800/30 rounded-lg p-4 border border-slate-700/30">
                  // NO DATA AVAILABLE
                </div>
              ) : (
                <div className="space-y-2 text-sm">
                  {lb.map((row, idx) => {
                    const mine =
                      me?.wallet && row.wallet.toLowerCase() === me.wallet.toLowerCase();
                    const rankColors = ['text-yellow-400', 'text-gray-300', 'text-orange-400'];
                    const rankColor = rankColors[idx] || 'text-slate-400';

                    return (
                      <div
                        key={row.wallet + idx}
                        className={`flex items-center justify-between rounded-lg border px-4 py-3 transition-all duration-300 ${
                          mine
                            ? 'border-cyan-400/60 bg-cyan-950/30 shadow-cyan-400/20 shadow-lg'
                            : 'border-slate-600/30 bg-slate-800/30 hover:bg-slate-700/30'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-6 text-center font-mono font-bold ${rankColor}`}>
                            {idx < 3 ? ['🥇', '🥈', '🥉'][idx] : `#${idx + 1}`}
                          </span>
                          <a
                            className="font-mono text-slate-200 underline decoration-dotted hover:decoration-solid hover:text-cyan-200 transition-colors"
                            href={`https://app.roninchain.com/address/${row.wallet}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {short(row.wallet)}
                          </a>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-mono">
                          <span className="text-emerald-300">
                            RZN: <span className="font-bold text-emerald-200">{row.rzn}</span>
                          </span>
                          {typeof row.scans === 'number' && (
                            <span className="text-cyan-300">S:{row.scans}</span>
                          )}
                          {typeof row.stabilizes === 'number' && (
                            <span className="text-orange-300">St:{row.stabilizes}</span>
                          )}
                          {typeof row.crafts === 'number' && (
                            <span className="text-purple-300">C:{row.crafts}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Result Modal */}
        {stabRes && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-xl border border-cyan-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/30 p-6 shadow-2xl backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-4 w-4 rounded-full bg-emerald-400 animate-pulse"></div>
                <h3 className="text-xl font-mono font-bold text-cyan-100 tracking-wider">
                  STABILIZATION COMPLETE
                </h3>
              </div>

              <div className="mb-6 rounded-lg border border-emerald-700/30 bg-emerald-950/30 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-emerald-300 font-mono text-sm">RZN REWARD</span>
                </div>
                <div className="text-3xl font-bold text-emerald-100 font-mono">+{stabRes.rzn}</div>
              </div>

              <div className="mb-6">
                <div className="font-mono font-semibold text-cyan-200 mb-3">MATERIAL SYNTHESIS</div>
                {stabRes.items.length === 0 ? (
                  <div className="text-sm text-slate-400 font-mono bg-slate-800/30 rounded-lg p-3 border border-slate-700/30">
                    // NO MATERIALS SYNTHESIZED
                  </div>
                ) : (
                  <div className="space-y-2">
                    {stabRes.items.map((it, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded border border-slate-600/30 bg-slate-800/50 px-3 py-2"
                      >
                        <span className="font-mono text-slate-200">{it.key}</span>
                        <span className="rounded bg-cyan-900/50 px-2 py-1 text-xs font-mono text-cyan-100 border border-cyan-700/30">
                          ×{it.qty}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setStabRes(null)}
                  className="rounded-lg border border-slate-500/50 bg-slate-800 px-4 py-2 font-mono text-slate-200 hover:bg-slate-700 transition-colors"
                >
                  CLOSE
                </button>
                <a
                  target="_blank"
                  rel="noreferrer"
                  className="group relative overflow-hidden rounded-lg border border-cyan-500/50 bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2 font-mono text-white transition-all duration-300 hover:from-cyan-500 hover:to-blue-500"
                  href={`https://twitter.com/intent/tweet?text=I%20stabilized%20an%20anomaly%20and%20earned%20${stabRes.rzn}%20RZN%20in%20Retrievium%20Pre-Season!%20🧬⚡`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  <span className="relative z-10">SHARE RESULTS</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Purchase Success Modal */}
        {purchaseResult !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-xl border border-cyan-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/30 p-6 shadow-2xl backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-4 w-4 rounded-full bg-emerald-400 animate-pulse"></div>
                <h3 className="text-xl font-mono font-bold text-cyan-100 tracking-wider">
                  PURCHASE SUCCESSFUL
                </h3>
              </div>

              <div className="mb-6 rounded-lg border border-emerald-700/30 bg-emerald-950/30 p-4">
                <div className="text-center">
                  <div className="text-4xl mb-2">🎉</div>
                  <div className="font-mono font-semibold text-emerald-200 mb-2">
                    WHITELIST SECURED!
                  </div>
                  <div className="text-sm text-emerald-300 font-mono">{purchaseResult.message}</div>
                </div>
              </div>

              <div className="mb-6 rounded-lg border border-slate-700/30 bg-slate-800/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-mono text-sm">Remaining RZN Balance:</span>
                  <span className="text-emerald-200 font-mono font-bold">
                    {purchaseResult.newBalance.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setPurchaseResult(null)}
                  className="rounded-lg border border-slate-500/50 bg-slate-800 px-4 py-2 font-mono text-slate-200 hover:bg-slate-700 transition-colors"
                >
                  CLOSE
                </button>
                <a
                  target="_blank"
                  rel="noreferrer"
                  className="group relative overflow-hidden rounded-lg border border-cyan-500/50 bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2 font-mono text-white transition-all duration-300 hover:from-cyan-500 hover:to-blue-500"
                  href={`https://twitter.com/intent/tweet?text=I%20just%20secured%20my%20whitelist%20spot%20for%20Retrievium%20using%20RZN%20earned%20in%20the%20Neural%20Laboratory!%20🧬⚡%20%23Retrievium%20%23GameFi`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  <span className="relative z-10">SHARE ACHIEVEMENT</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

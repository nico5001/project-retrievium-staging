'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type Me = {
  wallet: string;
  rzn: number;
  energy: number;
};

type InventoryRow = { item: string; qty: number };
type EquipGet = { core: 'none' | 'core_common' | 'core_uncommon' | 'core_rare' };
type EquipPost = { ok: boolean; core: EquipGet['core'] };

const CORE_LABEL: Record<EquipGet['core'], string> = {
  none: 'None',
  core_common: 'Core (Common)',
  core_uncommon: 'Core (Uncommon)',
  core_rare: 'Core (Rare)',
};

const CORE_BONUS: Record<EquipGet['core'], number> = {
  none: 0,
  core_common: 2,
  core_uncommon: 5,
  core_rare: 8,
};

const Panel = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-sm ${className}`}>{children}</div>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-wider text-slate-300/90">
    <span className="h-2 w-2 rounded-full bg-emerald-400/90" />
    <span className="uppercase">{children}</span>
  </div>
);

export default function EquipmentOnlyPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [inv, setInv] = useState<InventoryRow[]>([]);
  const [equip, setEquip] = useState<EquipGet['core']>('none');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function fetchJSON<T>(url: string): Promise<T> {
    const res = await fetch(url, { credentials: 'include', cache: 'no-store' });
    if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
    return res.json();
  }
  async function postJSON<T>(url: string, body: any): Promise<T> {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body ?? {}),
    });
    const data = (await res.json().catch(() => ({}))) as T & { error?: string };
    if (!res.ok) throw new Error(data?.['error'] || `POST ${url} -> ${res.status}`);
    return data as T;
  }

  async function refreshAll() {
    setLoading(true);
    try {
      const [m, e, i] = await Promise.allSettled([
        fetchJSON<Me>('/api/me'),
        fetchJSON<EquipGet>('/api/equip'),
        fetchJSON<{ items: InventoryRow[] }>('/api/inventory'),
      ]);
      if (m.status === 'fulfilled') setMe(m.value);
      if (e.status === 'fulfilled') setEquip(e.value.core);
      if (i.status === 'fulfilled') setInv(i.value.items);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { refreshAll(); }, []);

  const cores = useMemo(
    () => inv.filter(r => ['core_common','core_uncommon','core_rare'].includes(r.item)).sort((a,b) => a.item.localeCompare(b.item)),
    [inv]
  );
  const equippedBonusPct = CORE_BONUS[equip];

  async function doEquip(coreId: EquipGet['core']) {
    setBusy(true);
    const prev = equip;
    try {
      setEquip(coreId);
      const res = await postJSON<EquipPost>('/api/equip', { coreId });
      setEquip(res.core);
    } catch (e) {
      setEquip(prev);
      alert('Equip failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Match Play background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-950" />
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/5 to-transparent animate-pulse" />
      </div>

      <div className="mx-auto max-w-6xl px-4 md:px-6 pt-20 md:pt-28 pb-12 space-y-8">
        <div className="flex items-center justify-between">
          <Link href="/play" className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide text-slate-300 hover:text-cyan-300 transition-colors">
            <span className="opacity-70">←</span> Back to Play
          </Link>

          <div className="flex items-center gap-2 text-sm text-slate-300">
            <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5">RZN: <b>{me?.rzn ?? '—'}</b></span>
            <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5">ENERGY: <b>{me?.energy ?? '—'}</b></span>
            <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5">Equipped Bonus: <b>{equippedBonusPct}%</b></span>
          </div>
        </div>

        <Panel className="p-4 md:p-6">
          <SectionTitle>CORE EQUIPMENT</SectionTitle>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Current & selector */}
            <Panel className="p-4 border-white/10 bg-white/[0.03]">
              <div className="mb-3 text-[11px] tracking-wide text-slate-400">Currently equipped</div>
              <div className="flex items-center justify-between">
                <div className="text-base md:text-lg font-semibold text-slate-100">{CORE_LABEL[equip]}</div>
                <span className="inline-block rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-slate-300">
                  +{equippedBonusPct}% RZN
                </span>
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-xs font-semibold tracking-wide text-slate-300">Change Core</label>
                <select
                  className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 outline-none ring-0 focus:border-cyan-400/40"
                  value={equip}
                  onChange={(e) => doEquip(e.target.value as EquipGet['core'])}
                  disabled={busy || loading}
                >
                  <option value="none">None</option>
                  <option value="core_common" disabled={!cores.find(c => c.item === 'core_common')}>Core (Common) +2%</option>
                  <option value="core_uncommon" disabled={!cores.find(c => c.item === 'core_uncommon')}>Core (Uncommon) +5%</option>
                  <option value="core_rare" disabled={!cores.find(c => c.item === 'core_rare')}>Core (Rare) +8%</option>
                </select>
                <div className="mt-2 text-[11px] text-slate-400">Select <b>None</b> to remove the bonus.</div>
              </div>
            </Panel>

            {/* Your cores */}
            <Panel className="p-4 border-white/10 bg-white/[0.03]">
              <div className="mb-3 text-[11px] tracking-wide text-slate-400">Your Cores</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(['core_common','core_uncommon','core_rare'] as const).map(id => {
                  const row = cores.find(r => r.item === id);
                  const qty = row?.qty ?? 0;
                  const pct = CORE_BONUS[id];
                  const isEquipped = id === equip;
                  return (
                    <div key={id} className={`rounded-lg border p-3 ${isEquipped ? 'border-emerald-400/40 bg-emerald-400/5' : 'border-white/10 bg-white/5'}`}>
                      <div className="text-sm font-semibold text-slate-100">{CORE_LABEL[id]}</div>
                      <div className="mt-1 text-[11px] text-slate-400">Bonus: +{pct}% RZN</div>
                      <div className="mt-2 text-sm text-slate-200">Qty: <b>{qty}</b></div>
                      <div className="mt-3 flex gap-2">
                        <button
                          className="rounded-md bg-cyan-400/15 text-cyan-200 border border-cyan-400/30 px-3 py-1.5 text-xs font-semibold hover:bg-cyan-400/20 disabled:opacity-50"
                          disabled={busy || qty <= 0 || isEquipped}
                          onClick={() => doEquip(id)}
                        >
                          {isEquipped ? 'Equipped' : 'Equip'}
                        </button>
                        <button
                          className="rounded-md border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/5 disabled:opacity-50"
                          disabled={busy || equip === 'none'}
                          onClick={() => doEquip('none')}
                        >
                          Unequip
                        </button>
                      </div>
                    </div>
                  );
                })}
                {cores.length === 0 && (
                  <div className="col-span-full text-sm text-slate-400">You don’t own any cores yet. Craft them on the Play page.</div>
                )}
              </div>
            </Panel>
          </div>
        </Panel>

        {loading && (
          <div className="fixed inset-0 pointer-events-none">
            <div className="absolute right-4 bottom-4 rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-100 shadow">
              Loading…
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

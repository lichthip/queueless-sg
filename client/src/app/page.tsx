'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import type { Center } from '@/types';
import { useQueues } from '@/hooks/useQueues';
import QueueCard from '@/components/QueueCard';
import WaitTimeBadge from '@/components/WaitTimeBadge';
import PredictionPanel from '@/components/PredictionPanel';

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => <div className="map-container bg-slate-100 animate-pulse rounded-xl" />,
});

type Filter = 'all' | 'polyclinic' | 'ICA' | 'HDB' | 'CDC' | 'CPF';
const FILTERS: Filter[] = ['all', 'polyclinic', 'ICA', 'HDB', 'CDC', 'CPF'];

function relativeTime(d: Date): string {
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  return s < 60 ? 'just now' : `${Math.floor(s / 60)}m ago`;
}

export default function HomePage() {
  const { centers, loading, connected, lastUpdate } = useQueues();
  const [selected,       setSelected]       = useState<Center | null>(null);
  const [filter,         setFilter]         = useState<Filter>('all');
  const [showPrediction, setShowPrediction] = useState(false);

  const visible = useMemo(() =>
    (filter === 'all' ? centers : centers.filter(c => c.type === filter))
      .slice()
      .sort((a, b) => {
        if (a.queue.is_open !== b.queue.is_open) return b.queue.is_open - a.queue.is_open;
        return a.queue.estimatedWaitMinutes - b.queue.estimatedWaitMinutes;
      }),
    [centers, filter],
  );

  const handleClick = (c: Center) => {
    setSelected(prev => prev?.id === c.id ? null : c);
    setShowPrediction(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Live Queue Tracker</h1>
            <p className="text-sm text-slate-500 mt-1">
              Real-time wait times at Singapore public service centres
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
            {connected ? 'Live' : 'Connecting…'}
            {lastUpdate && ` · ${relativeTime(lastUpdate)}`}
          </div>
        </div>

        <div className="flex gap-2 mt-4 overflow-x-auto pb-1 scrollbar-hide">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                filter === f
                  ? 'bg-red-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {f === 'all' ? 'All Services' : f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Queue list */}
        <div className="lg:col-span-1 space-y-3">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-white h-36 animate-pulse" />
            ))
          ) : visible.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
              <p className="text-slate-500 text-sm">No centres match this filter</p>
            </div>
          ) : (
            visible.map(c => (
              <QueueCard
                key={c.id}
                center={c}
                isSelected={selected?.id === c.id}
                onClick={handleClick}
              />
            ))
          )}
        </div>

        {/* Map + detail */}
        <div className="lg:col-span-2 space-y-4">
          <MapView
            centers={centers}
            selectedCenter={selected}
            onMarkerClick={handleClick}
          />

          {selected && (
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-slate-900">{selected.name}</h2>
                  <p className="text-sm text-slate-500 mt-0.5">{selected.address}</p>
                  <p className="text-xs text-slate-400 mt-1">{selected.operating_hours}</p>
                </div>
                <WaitTimeBadge
                  waitMinutes={selected.queue.estimatedWaitMinutes}
                  isOpen={selected.queue.is_open === 1}
                  size="lg"
                />
              </div>

              <div className="grid grid-cols-3 divide-x divide-slate-100 text-center">
                {[
                  { value: selected.queue.is_open ? selected.queue.current_count : '—',             label: 'In Queue'   },
                  { value: selected.queue.is_open ? `~${selected.queue.estimatedWaitMinutes}m` : '—', label: 'Est. Wait'  },
                  { value: selected.queue.is_open
                      ? `${Math.round((selected.queue.current_count / selected.capacity) * 100)}%`
                      : '—',
                    label: 'Capacity' },
                ].map(({ value, label }) => (
                  <div key={label} className="p-4">
                    <p className="text-2xl font-bold text-slate-900">{value}</p>
                    <p className="text-xs text-slate-500 mt-1">{label}</p>
                  </div>
                ))}
              </div>

              <div className="px-4 py-3 border-t border-slate-100">
                <button
                  onClick={() => setShowPrediction(v => !v)}
                  className="text-sm text-red-600 font-medium hover:text-red-700"
                >
                  {showPrediction ? '▲ Hide' : '▼ Show'} best times to visit
                </button>
              </div>

              {showPrediction && (
                <div className="border-t border-slate-100">
                  <PredictionPanel centerId={selected.id} centerName={selected.name} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
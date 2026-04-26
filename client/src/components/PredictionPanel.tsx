'use client';

import { useEffect, useState } from 'react';
import type { PredictionResult } from '@/types';
import { api } from '@/lib/api';
import clsx from 'clsx';

const loadColor: Record<string, string> = {
  'Very Low': 'text-green-700 bg-green-50',
  'Low':      'text-green-700 bg-green-50',
  'Moderate': 'text-yellow-700 bg-yellow-50',
  'High':     'text-red-700   bg-red-50',
};

export default function PredictionPanel({ centerId, centerName }: { centerId: number; centerName: string }) {
  const [data,    setData]    = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.centers.predict(centerId)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [centerId]);

  if (loading) return (
    <div className="p-4 space-y-2 animate-pulse">
      {[1,2,3].map(i => <div key={i} className="h-10 bg-slate-100 rounded-lg" />)}
    </div>
  );

  if (!data) return null;

  return (
    <div className="p-4">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
        Best times to visit · {centerName}
      </p>
      <div className="space-y-2">
        {data.bestWindows.map((w, i) => (
          <div key={w.hour} className={clsx(
            'flex items-center justify-between px-3 py-2.5 rounded-lg',
            i === 0 ? 'bg-green-50 ring-1 ring-green-200' : 'bg-slate-50',
          )}>
            <div className="flex items-center gap-2">
              {i === 0 && (
                <span className="text-xs font-bold text-green-600 bg-green-100 px-1.5 py-0.5 rounded">
                  BEST
                </span>
              )}
              <span className="text-sm font-medium text-slate-700">{w.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">~{w.expectedWaitMinutes} min</span>
              <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full', loadColor[w.relativeLoad])}>
                {w.relativeLoad}
              </span>
            </div>
          </div>
        ))}
      </div>
      {data.historicalAverage !== null && (
        <p className="mt-3 text-xs text-slate-400">
          7-day avg at this hour: {Math.round(data.historicalAverage)} people
        </p>
      )}
    </div>
  );
}
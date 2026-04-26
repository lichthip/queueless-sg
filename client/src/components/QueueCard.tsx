'use client';

import type { Center } from '@/types';
import WaitTimeBadge from './WaitTimeBadge';
import clsx from 'clsx';

const TYPE_PILL: Record<string, string> = {
  polyclinic: 'bg-blue-100 text-blue-700',
  ICA:        'bg-purple-100 text-purple-700',
  HDB:        'bg-orange-100 text-orange-700',
  CDC:        'bg-teal-100 text-teal-700',
  CPF:        'bg-indigo-100 text-indigo-700',
};

interface Props {
  center: Center;
  isSelected: boolean;
  onClick: (c: Center) => void;
}

export default function QueueCard({ center, isSelected, onClick }: Props) {
  const { queue } = center;
  const isOpen   = queue.is_open === 1;
  const fillPct  = Math.min(100, Math.round((queue.current_count / center.capacity) * 100));

  return (
    <button
      onClick={() => onClick(center)}
      className={clsx(
        'w-full text-left rounded-xl border p-4 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md',
        isSelected
          ? 'border-red-400 bg-red-50 ring-1 ring-red-300'
          : 'border-slate-200 bg-white',
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 text-sm leading-tight truncate">{center.name}</p>
          <p className="text-xs text-slate-500 mt-0.5 truncate">{center.address}</p>
        </div>
        <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap', TYPE_PILL[center.type])}>
          {center.type}
        </span>
      </div>

      <div className="flex items-end justify-between mt-3">
        <div>
          <p className="text-2xl font-bold text-slate-900 leading-none">
            {isOpen ? queue.current_count : '—'}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">in queue</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold text-slate-700 leading-none">
            {isOpen ? `~${queue.estimatedWaitMinutes}m` : '—'}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">est. wait</p>
        </div>
      </div>

      <div className="mt-3">
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span>Load</span>
          <span>{isOpen ? `${fillPct}%` : 'closed'}</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-1.5">
          <div
            className={clsx(
              'h-1.5 rounded-full transition-all duration-500',
              fillPct < 40 ? 'bg-green-500' : fillPct < 70 ? 'bg-yellow-500' : 'bg-red-500',
            )}
            style={{ width: `${fillPct}%` }}
          />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <WaitTimeBadge waitMinutes={queue.estimatedWaitMinutes} isOpen={isOpen} size="sm" />
        <p className="text-xs text-slate-400">{center.operating_hours}</p>
      </div>
    </button>
  );
}
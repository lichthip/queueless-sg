import clsx from 'clsx';
import type { LoadLevel } from '@/types';

interface Props {
  waitMinutes: number;
  isOpen: boolean;
  size?: 'sm' | 'md' | 'lg';
}

function level(wait: number, open: boolean): LoadLevel {
  if (!open)    return 'closed';
  if (wait < 20) return 'low';
  if (wait < 50) return 'moderate';
  return 'high';
}

const cfg: Record<LoadLevel, { text: string; badge: string; dot: string }> = {
  low:      { text: 'Short Wait', badge: 'badge-low',      dot: 'bg-green-500'  },
  moderate: { text: 'Moderate',   badge: 'badge-moderate', dot: 'bg-yellow-500' },
  high:     { text: 'Long Wait',  badge: 'badge-high',     dot: 'bg-red-500'    },
  closed:   { text: 'Closed',     badge: 'badge-closed',   dot: 'bg-gray-400'   },
};

export default function WaitTimeBadge({ waitMinutes, isOpen, size = 'md' }: Props) {
  const l = level(waitMinutes, isOpen);
  const c = cfg[l];
  return (
    <span className={clsx(
      'inline-flex items-center gap-1.5 rounded-full font-medium', c.badge,
      size === 'sm' && 'px-2 py-0.5 text-xs',
      size === 'md' && 'px-2.5 py-1 text-xs',
      size === 'lg' && 'px-3 py-1.5 text-sm',
    )}>
      <span className={clsx('rounded-full animate-pulse', c.dot,
        size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2'
      )} />
      {c.text}
    </span>
  );
}
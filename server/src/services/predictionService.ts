import db from '../db/database';

const HOURLY_LOAD: Record<number, { multiplier: number; label: string }> = {
  7:  { multiplier: 0.20, label: 'Very Low' },
  8:  { multiplier: 0.60, label: 'Moderate' },
  9:  { multiplier: 0.85, label: 'High'     },
  10: { multiplier: 0.75, label: 'High'     },
  11: { multiplier: 0.60, label: 'Moderate' },
  12: { multiplier: 0.40, label: 'Low'      },
  13: { multiplier: 0.35, label: 'Low'      },
  14: { multiplier: 0.50, label: 'Moderate' },
  15: { multiplier: 0.55, label: 'Moderate' },
  16: { multiplier: 0.65, label: 'Moderate' },
  17: { multiplier: 0.45, label: 'Moderate' },
  18: { multiplier: 0.20, label: 'Low'      },
};

export interface BestTimeWindow {
  hour: number;
  label: string;
  expectedWaitMinutes: number;
  relativeLoad: string;
}

export interface PredictionResult {
  centerId: number;
  currentHourForecast: number;
  bestWindows: BestTimeWindow[];
  historicalAverage: number | null;
}

function formatHour(h: number): string {
  if (h === 12) return '12:00 PM';
  return h > 12 ? `${h - 12}:00 PM` : `${h}:00 AM`;
}

export function predictLoad(
  centerId: number,
  capacity: number,
  avgServiceMinutes: number,
): PredictionResult {
  const now = new Date();
  const currentHour = now.getHours();

  const historical = db.prepare(`
    SELECT AVG(count) AS avg_count
    FROM queue_history
    WHERE center_id = ?
      AND strftime('%H', recorded_at) = ?
      AND recorded_at >= datetime('now', '-7 days')
  `).get(centerId, String(currentHour).padStart(2, '0')) as { avg_count: number | null };

  const profile = HOURLY_LOAD[currentHour];
  const currentHourForecast = Math.round((profile?.multiplier ?? 0.5) * capacity);

  const bestWindows: BestTimeWindow[] = Object.entries(HOURLY_LOAD)
    .map(([h, p]) => ({
      hour: Number(h),
      label: formatHour(Number(h)),
      expectedWaitMinutes: Math.round(p.multiplier * capacity * avgServiceMinutes),
      relativeLoad: p.label,
    }))
    .filter(w => w.hour >= currentHour)
    .sort((a, b) => a.expectedWaitMinutes - b.expectedWaitMinutes)
    .slice(0, 4);

  return {
    centerId,
    currentHourForecast,
    bestWindows,
    historicalAverage: historical?.avg_count ?? null,
  };
}
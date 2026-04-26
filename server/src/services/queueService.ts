import db from '../db/database';
import { Center, QueueState, QueueUpdateEvent } from '../types';

export interface CenterWithQueue extends Center {
  queue: QueueState & { estimatedWaitMinutes: number };
}

const SELECT_SQL = `
  SELECT
    c.*,
    qs.id          AS queue_id,
    qs.current_count,
    qs.serving_number,
    qs.avg_service_minutes,
    qs.is_open,
    qs.updated_at
  FROM centers c
  LEFT JOIN queue_states qs ON qs.center_id = c.id
`;

function mapRow(row: any): CenterWithQueue {
  const count = row.current_count ?? 0;
  const avg   = row.avg_service_minutes ?? 8;
  return {
    id: row.id, name: row.name, type: row.type,
    address: row.address, lat: row.lat, lng: row.lng,
    capacity: row.capacity, operating_hours: row.operating_hours,
    queue: {
      id: row.queue_id, center_id: row.id,
      current_count: count, serving_number: row.serving_number ?? 0,
      avg_service_minutes: avg,
      is_open: row.is_open ?? 1,
      updated_at: row.updated_at ?? new Date().toISOString(),
      estimatedWaitMinutes: Math.round(count * avg),
    },
  };
}

export function getAllCentersWithQueue(): CenterWithQueue[] {
  return (db.prepare(`${SELECT_SQL} ORDER BY c.name`).all() as any[]).map(mapRow);
}

export function getCenterWithQueue(centerId: number): CenterWithQueue | null {
  const row = db.prepare(`${SELECT_SQL} WHERE c.id = ?`).get(centerId) as any;
  return row ? mapRow(row) : null;
}

export function updateQueueCount(centerId: number, delta: number): QueueUpdateEvent | null {
  db.prepare(`
    UPDATE queue_states
    SET
      current_count  = MAX(0, current_count + ?),
      serving_number = CASE WHEN ? < 0 THEN MAX(0, serving_number + ?) ELSE serving_number END,
      updated_at     = datetime('now')
    WHERE center_id = ?
  `).run(delta, delta, Math.abs(delta), centerId);

  return buildUpdateEvent(centerId);
}

export function setQueueOpen(centerId: number, isOpen: boolean): void {
  db.prepare(`
    UPDATE queue_states SET is_open = ?, updated_at = datetime('now') WHERE center_id = ?
  `).run(isOpen ? 1 : 0, centerId);
}

export function recordSnapshot(): void {
  db.prepare(`
    INSERT INTO queue_history (center_id, count, recorded_at)
    SELECT center_id, current_count, datetime('now') FROM queue_states
  `).run();
}

export function buildUpdateEvent(centerId: number): QueueUpdateEvent | null {
  const row = db.prepare(`
    SELECT current_count, serving_number, avg_service_minutes, is_open, updated_at
    FROM queue_states WHERE center_id = ?
  `).get(centerId) as QueueState | undefined;

  if (!row) return null;

  return {
    centerId,
    currentCount: row.current_count,
    servingNumber: row.serving_number,
    estimatedWaitMinutes: Math.round(row.current_count * row.avg_service_minutes),
    isOpen: row.is_open === 1,
    updatedAt: row.updated_at,
  };
}
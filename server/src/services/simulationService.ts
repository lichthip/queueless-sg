import { EventEmitter } from 'events';
import db from '../db/database';
import { recordSnapshot, buildUpdateEvent } from './queueService';

export const simulationEmitter = new EventEmitter();

function timeMultiplier(): number {
  const h = new Date().getHours();
  const profile: Record<number, number> = {
    7: 0.20, 8: 0.60, 9: 0.85, 10: 0.75, 11: 0.60,
    12: 0.40, 13: 0.35, 14: 0.50, 15: 0.55, 16: 0.65,
    17: 0.45, 18: 0.20,
  };
  return profile[h] ?? 0.05;
}

function tick() {
  const centers = db
    .prepare('SELECT id, capacity FROM centers')
    .all() as { id: number; capacity: number }[];

  const multiplier = timeMultiplier();

  for (const center of centers) {
    const state = db.prepare(
      'SELECT current_count, is_open FROM queue_states WHERE center_id = ?'
    ).get(center.id) as { current_count: number; is_open: number } | undefined;

    if (!state || state.is_open === 0) continue;

    const inflow  = Math.random() < multiplier ? Math.floor(Math.random() * 4) : 0;
    const outflow = state.current_count > 0 && Math.random() < 0.7
      ? Math.floor(Math.random() * 3) + 1
      : 0;

    const newCount = Math.max(0, Math.min(center.capacity, state.current_count + inflow - outflow));

    db.prepare(`
      UPDATE queue_states
      SET current_count  = ?,
          serving_number = MAX(0, serving_number + ?),
          updated_at     = datetime('now')
      WHERE center_id = ?
    `).run(newCount, outflow, center.id);

    const event = buildUpdateEvent(center.id);
    if (event) simulationEmitter.emit('queueUpdate', event);
  }
}

export function startSimulation() {
  console.log('🔄  Queue simulation started (tick every 15 s)');
  tick(); // immediate first tick
  setInterval(tick, 15_000);
  setInterval(recordSnapshot, 5 * 60_000); // snapshot every 5 min
}
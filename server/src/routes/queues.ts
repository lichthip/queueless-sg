import { Router, Request, Response } from 'express';
import db from '../db/database';
import { requireAuth } from '../middleware/auth';
import { updateQueueCount, setQueueOpen, buildUpdateEvent } from '../services/queueService';
import { simulationEmitter } from '../services/simulationService';
import { JWTPayload } from '../types';

const router = Router();

router.patch('/:centerId/adjust', requireAuth, (req: Request, res: Response) => {
  const centerId = parseInt(req.params.centerId, 10);
  const { delta } = req.body as { delta: number };
  const user = (req as any).user as JWTPayload;

  if (isNaN(centerId) || typeof delta !== 'number') {
    return res.status(400).json({ error: 'Invalid parameters' });
  }
  if (user.role !== 'admin' && user.centerId !== centerId) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const event = updateQueueCount(centerId, delta);
  if (!event) return res.status(404).json({ error: 'Queue not found' });

  simulationEmitter.emit('queueUpdate', event);
  res.json(event);
});

router.patch('/:centerId/status', requireAuth, (req: Request, res: Response) => {
  const centerId = parseInt(req.params.centerId, 10);
  const { isOpen } = req.body as { isOpen: boolean };
  const user = (req as any).user as JWTPayload;

  if (isNaN(centerId) || typeof isOpen !== 'boolean') {
    return res.status(400).json({ error: 'Invalid parameters' });
  }
  if (user.role !== 'admin' && user.centerId !== centerId) {
    return res.status(403).json({ error: 'Access denied' });
  }

  setQueueOpen(centerId, isOpen);
  const event = buildUpdateEvent(centerId);
  if (event) simulationEmitter.emit('queueUpdate', event);
  res.json({ success: true, isOpen });
});

router.get('/:centerId/history', (req: Request, res: Response) => {
  const centerId = parseInt(req.params.centerId, 10);
  const hours = Math.min(parseInt((req.query.hours as string) || '24', 10), 168);

  if (isNaN(centerId)) return res.status(400).json({ error: 'Invalid ID' });

  const history = db.prepare(`
    SELECT count, recorded_at
    FROM queue_history
    WHERE center_id = ?
      AND recorded_at >= datetime('now', ? || ' hours')
    ORDER BY recorded_at ASC
  `).all(centerId, `-${hours}`) as { count: number; recorded_at: string }[];

  res.json(history);
});

export default router;
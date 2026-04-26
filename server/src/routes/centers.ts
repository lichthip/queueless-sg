import { Router, Request, Response } from 'express';
import { getAllCentersWithQueue, getCenterWithQueue } from '../services/queueService';
import { predictLoad } from '../services/predictionService';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.json(getAllCentersWithQueue());
});

router.get('/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });
  const center = getCenterWithQueue(id);
  if (!center) return res.status(404).json({ error: 'Centre not found' });
  res.json(center);
});

router.get('/:id/predict', (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });
  const center = getCenterWithQueue(id);
  if (!center) return res.status(404).json({ error: 'Centre not found' });
  res.json(predictLoad(id, center.capacity, center.queue.avg_service_minutes));
});

export default router;
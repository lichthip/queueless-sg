import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db/database';
import { StaffUser } from '../types';
import { signToken } from '../middleware/auth';

const router = Router();

router.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body as { username?: string; password?: string };
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const user = db
    .prepare('SELECT * FROM staff WHERE username = ?')
    .get(username) as StaffUser | undefined;

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = signToken({
    userId: user.id,
    username: user.username,
    centerId: user.center_id,
    role: user.role,
  });

  res.json({
    token,
    user: { id: user.id, username: user.username, centerId: user.center_id, role: user.role },
  });
});

export default router;
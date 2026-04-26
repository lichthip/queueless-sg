import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

import { initializeSchema } from './db/database';
import { initializeSocket } from './socket/queueSocket';
import { startSimulation } from './services/simulationService';
import authRouter from './routes/auth';
import centersRouter from './routes/centers';
import queuesRouter from './routes/queues';

dotenv.config();

const PORT = process.env.PORT || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:3000';

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: { origin: CLIENT_ORIGIN, methods: ['GET', 'POST', 'PATCH'] },
});

app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

app.get('/health', (_req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
);

app.use('/api/auth', authRouter);
app.use('/api/centers', centersRouter);
app.use('/api/queues', queuesRouter);

initializeSchema();
initializeSocket(io);
startSimulation();

httpServer.listen(PORT, () => {
  console.log(`🚀  Server → http://localhost:${PORT}`);
});
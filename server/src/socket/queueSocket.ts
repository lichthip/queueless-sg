import { Server as SocketIOServer, Socket } from 'socket.io';
import { simulationEmitter } from '../services/simulationService';
import { getAllCentersWithQueue } from '../services/queueService';
import { QueueUpdateEvent } from '../types';

export function initializeSocket(io: SocketIOServer) {
  simulationEmitter.on('queueUpdate', (event: QueueUpdateEvent) => {
    io.emit('queue:update', event);
  });

  io.on('connection', (socket: Socket) => {
    console.log(`🔌  Client connected: ${socket.id}`);

    // Send full state immediately so client renders without waiting for next tick
    socket.emit('queue:init', getAllCentersWithQueue());

    socket.on('disconnect', () => {
      console.log(`🔌  Client disconnected: ${socket.id}`);
    });
  });
}
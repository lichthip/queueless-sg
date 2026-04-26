'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Center, QueueUpdateEvent } from '@/types';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';

let _socket: Socket | null = null;

function getSocket(): Socket {
  if (!_socket) {
    _socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });
  }
  return _socket;
}

export function useSocket(
  onInit:   (centers: Center[])        => void,
  onUpdate: (event: QueueUpdateEvent)  => void,
) {
  const handlers = useRef({ onInit, onUpdate });
  handlers.current = { onInit, onUpdate };

  useEffect(() => {
    const s = getSocket();
    const handleInit   = (d: Center[])         => handlers.current.onInit(d);
    const handleUpdate = (e: QueueUpdateEvent) => handlers.current.onUpdate(e);
    s.on('queue:init',   handleInit);
    s.on('queue:update', handleUpdate);
    return () => {
      s.off('queue:init',   handleInit);
      s.off('queue:update', handleUpdate);
    };
  }, []);
}
'use client';

import { useState, useCallback, useEffect } from 'react';
import type { Center, QueueUpdateEvent } from '@/types';
import { useSocket } from './useSocket';
import { api } from '@/lib/api';

export function useQueues() {
  const [centers,    setCenters]    = useState<Center[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [connected,  setConnected]  = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const onInit = useCallback((data: Center[]) => {
    setCenters(data);
    setLoading(false);
    setConnected(true);
  }, []);

  const onUpdate = useCallback((ev: QueueUpdateEvent) => {
    setCenters(prev =>
      prev.map(c =>
        c.id !== ev.centerId ? c : {
          ...c,
          queue: {
            ...c.queue,
            current_count:        ev.currentCount,
            serving_number:       ev.servingNumber,
            estimatedWaitMinutes: ev.estimatedWaitMinutes,
            is_open:              ev.isOpen ? 1 : 0,
            updated_at:           ev.updatedAt,
          },
        }
      )
    );
    setLastUpdate(new Date());
  }, []);

  useSocket(onInit, onUpdate);

  // REST fallback if socket is slow
  useEffect(() => {
    const t = setTimeout(async () => {
      if (!connected) {
        try {
          const data = await api.centers.list();
          setCenters(data);
          setLoading(false);
        } catch (e) {
          console.error('Fallback fetch failed', e);
          setLoading(false);
        }
      }
    }, 4000);
    return () => clearTimeout(t);
  }, [connected]);

  return { centers, loading, connected, lastUpdate };
}
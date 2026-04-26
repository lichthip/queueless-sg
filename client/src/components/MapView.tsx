'use client';

import { useEffect, useRef } from 'react';
import type { Center } from '@/types';

interface Props {
  centers: Center[];
  selectedCenter: Center | null;
  onMarkerClick: (c: Center) => void;
}

export default function MapView({ centers, selectedCenter, onMarkerClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<any>(null);
  const markersRef   = useRef<Record<number, any>>({});
  const onClickRef   = useRef(onMarkerClick);
  onClickRef.current = onMarkerClick;

  // Initialise map once
  useEffect(() => {
  if (typeof window === 'undefined' || !containerRef.current) return;
  let mounted = true;

  (async () => {
    if (mapRef.current) return;
    const container = containerRef.current!;
    if ((container as any)._leaflet_id) return; // already has a leaflet instance

    const L = (await import('leaflet')).default;
    if (!mounted || !containerRef.current) return;

    const map = L.map(container, {
      center: [1.3521, 103.8198],
      zoom: 12,
    });
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);
  })();

  return () => {
    mounted = false;
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
      markersRef.current = {};
    }
  };
}, []);

  // Sync markers when centers change
  useEffect(() => {
    if (!mapRef.current) return;

    (async () => {
      const L = (await import('leaflet')).default;
      const map = mapRef.current;

      for (const center of centers) {
        const isOpen  = center.queue.is_open === 1;
        const fillPct = Math.min(100, (center.queue.current_count / center.capacity) * 100);
        const color   = !isOpen ? '#9ca3af'
          : fillPct < 40  ? '#22c55e'
          : fillPct < 70  ? '#f59e0b'
          : '#ef4444';

        const icon = L.divIcon({
          className: '',
          html: `<div style="
            width:34px;height:34px;border-radius:50%;
            background:${color};border:3px solid white;
            box-shadow:0 2px 8px rgba(0,0,0,.25);
            display:flex;align-items:center;justify-content:center;
            color:white;font-weight:700;font-size:11px;font-family:system-ui;
          ">${isOpen ? center.queue.current_count : '✕'}</div>`,
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        });

        const popup = `
          <div style="font-family:system-ui;min-width:180px;padding:2px">
            <strong style="font-size:13px">${center.name}</strong>
            <p style="margin:3px 0 0;font-size:11px;color:#64748b">${center.address}</p>
            <div style="margin-top:8px;display:flex;align-items:center;gap:8px">
              <span style="font-size:22px;font-weight:700;color:#0f172a">
                ${isOpen ? center.queue.current_count : '—'}
              </span>
              <div>
                <p style="margin:0;font-size:11px;color:#64748b">in queue</p>
                <p style="margin:2px 0 0;font-size:11px;font-weight:600;color:${isOpen ? '#ef4444' : '#9ca3af'}">
                  ${isOpen ? `~${center.queue.estimatedWaitMinutes} min wait` : 'Closed'}
                </p>
              </div>
            </div>
          </div>`;

        if (markersRef.current[center.id]) {
          markersRef.current[center.id].setIcon(icon).setPopupContent(popup);
        } else {
          const marker = L.marker([center.lat, center.lng], { icon })
            .addTo(map)
            .bindPopup(popup, { maxWidth: 230 })
            .on('click', () => onClickRef.current(center));
          markersRef.current[center.id] = marker;
        }
      }
    })();
  }, [centers]);

  // Pan to selected center
  useEffect(() => {
    if (!selectedCenter || !mapRef.current) return;
    mapRef.current.setView([selectedCenter.lat, selectedCenter.lng], 14, { animate: true });
    markersRef.current[selectedCenter.id]?.openPopup();
  }, [selectedCenter]);

  return <div ref={containerRef} className="map-container" />;
}
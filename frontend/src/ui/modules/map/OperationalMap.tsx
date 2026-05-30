import { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { RoadSegment } from '../../../domain/types';
import 'leaflet/dist/leaflet.css';

interface Props {
  segments: RoadSegment[];
}

const getColor = (iro: number) => (iro >= 70 ? '#DC2626' : iro >= 40 ? '#F97316' : '#16A34A');

export function OperationalMap({ segments }: Props) {
  const mapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const map = L.map(mapRef.current).setView([-23.25, -46.7], 9);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    segments.forEach((segment) => {
      L.circleMarker([segment.latitude, segment.longitude], {
        radius: 6,
        color: getColor(segment.iro),
        fillOpacity: 0.85
      })
        .bindPopup(
          `<strong>Trecho #${segment.id}</strong><br/>KM ${segment.km_inicio} - ${segment.km_fim}<br/>IRO: ${segment.iro}<br/>Status: ${segment.status}<br/>Dias sem roçada: ${segment.dias_sem_rocada}`
        )
        .addTo(map);
    });

    return () => {
      map.remove();
    };
  }, [segments]);

  return (
    <section className="rounded-xl border border-slate-700 bg-slate-900/80 p-3 shadow-panel">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-white">Mapa Operacional</h2>
        <div className="text-xs text-slate-300">Criticidade por IRO</div>
      </div>
      <div ref={mapRef} className="h-[420px] overflow-hidden rounded-lg border border-slate-700" />
    </section>
  );
}


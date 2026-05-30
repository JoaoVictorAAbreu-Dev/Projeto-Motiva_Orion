import { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { RoadSegment } from '../../../domain/types';
import 'leaflet/dist/leaflet.css';

interface Props {
  segments: RoadSegment[];
}

const getColor = (classificacao: string) => {
  if (classificacao === 'Critico') return '#DC2626';
  if (classificacao === 'Atencao') return '#F59E0B';
  return '#16A34A';
};

const prioridade = (iro: number) => (iro >= 70 ? 'Alta' : iro >= 40 ? 'Media' : 'Baixa');

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
        color: getColor(segment.classificacao),
        fillOpacity: 0.85
      })
        .bindPopup(
          `<strong>Trecho #${segment.id}</strong><br/>KM ${segment.km_inicio} - ${segment.km_fim}<br/>Status: ${segment.classificacao}<br/>IRO: ${segment.iro}<br/>Ultima intervencao: ha ${segment.dias_sem_manutencao} dias<br/>Prioridade: ${prioridade(segment.iro)}<br/>Recomendacao: ${segment.recomendacao_acao}`
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
        <div className="text-xs text-slate-300">Verde: Normal | Amarelo: Atencao | Vermelho: Critico</div>
      </div>
      <div ref={mapRef} className="h-[420px] overflow-hidden rounded-lg border border-slate-700" />
    </section>
  );
}

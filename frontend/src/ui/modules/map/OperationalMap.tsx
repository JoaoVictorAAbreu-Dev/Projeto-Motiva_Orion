import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { Filter, MapPinned } from 'lucide-react';
import type { RoadSegment } from '../../../domain/types';
import { ModuleHeader } from '../../components/ModuleHeader';
import 'leaflet/dist/leaflet.css';

interface Props {
  segments: RoadSegment[];
}

type StatusFilter = 'Todos' | 'Alto' | 'Medio' | 'Baixo';

const filters: StatusFilter[] = ['Todos', 'Alto', 'Medio', 'Baixo'];

const getColor = (classificacao: string) => {
  const value = classificacao.toLowerCase();
  if (value.includes('alto') || value.includes('crit')) return '#ef4444';
  if (value.includes('medio') || value.includes('atenc')) return '#f59e0b';
  return '#22c55e';
};

const prioridade = (iro: number) => (iro >= 70 ? 'Alta' : iro >= 40 ? 'Media' : 'Baixa');

export function OperationalMap({ segments }: Props) {
  const [filter, setFilter] = useState<StatusFilter>('Todos');
  const [showBiomass, setShowBiomass] = useState(true);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const visibleSegments = useMemo(
    () =>
      filter === 'Todos'
        ? segments
        : segments.filter((segment) => {
            const value = segment.classificacao.toLowerCase();
            if (filter === 'Alto') return value.includes('alto') || value.includes('crit');
            if (filter === 'Medio') return value.includes('medio') || value.includes('atenc');
            return value.includes('baixo') || value.includes('normal');
          }),
    [filter, segments]
  );

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    mapRef.current = L.map(mapContainerRef.current, { zoomControl: false }).setView([-23.25, -46.7], 9);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(mapRef.current);

    L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current);
    layerRef.current = L.layerGroup().addTo(mapRef.current);

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !layerRef.current) return;

    layerRef.current.clearLayers();
    const points: L.LatLngExpression[] = [];

    visibleSegments.forEach((segment) => {
      const point: L.LatLngExpression = [segment.latitude, segment.longitude];
      points.push(point);
      const color = getColor(segment.classificacao);
      const biomass = segment.altura_vegetacao_predita_cm ?? ((segment.ndvi ?? 0) * 100);
      const biomassColor = biomass >= 80 ? '#7f1d1d' : biomass >= 60 ? '#b45309' : biomass >= 40 ? '#65a30d' : '#16a34a';

      L.circleMarker(point, {
        radius: segment.classificacao.toLowerCase().includes('alto') || segment.classificacao.toLowerCase().includes('crit') ? 7 : 5,
        color,
        weight: 2,
        fillColor: color,
        fillOpacity: 0.78
      })
        .bindPopup(
          `<div style="min-width:210px"><strong>Trecho #${segment.id}</strong><br/>KM ${segment.km_inicio} - ${segment.km_fim}<br/>Status: ${segment.classificacao}<br/>IRO: ${segment.iro}<br/>Sem manutencao: ${segment.dias_sem_manutencao} dias<br/>Prioridade: ${prioridade(segment.iro)}<br/>Recomendacao: ${segment.recomendacao_acao}</div>`
        )
        .addTo(layerRef.current!);

      if (showBiomass) {
        L.circle(point, {
          radius: Math.max(90, biomass * 5),
          color: biomassColor,
          weight: 1,
          fillColor: biomassColor,
          fillOpacity: 0.16,
        }).addTo(layerRef.current!);
      }
    });

    if (points.length > 1) mapRef.current.fitBounds(L.latLngBounds(points), { padding: [28, 28], maxZoom: 11 });
  }, [showBiomass, visibleSegments]);

  return (
    <section className="app-panel overflow-hidden rounded-2xl">
      <ModuleHeader
        eyebrow="GIS live view"
        title="Mapa operacional"
        description={`${visibleSegments.length} de ${segments.length} trechos visiveis na camada ativa.`}
        action={<MapPinned className="h-5 w-5 text-blue-300" />}
      />
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-700/40 px-4 py-3">
        <Filter className="mr-1 h-4 w-4 text-slate-500" />
        {filters.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={`rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] transition ${
              filter === item
                ? 'border-blue-400/40 bg-blue-500/15 text-blue-200'
                : 'border-slate-700/60 bg-slate-900/30 text-slate-400 hover:border-slate-500'
            }`}
          >
            {item}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowBiomass((v) => !v)}
          className={`rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] ${
            showBiomass ? 'border-emerald-400/50 bg-emerald-500/10 text-emerald-200' : 'border-slate-700/60 text-slate-400'
          }`}
        >
          Biomassa
        </button>
      </div>
      <div ref={mapContainerRef} className="h-[62vh] min-h-[460px] border-b border-slate-700/40 sm:min-h-[560px] xl:min-h-[720px]" />
      <div className="flex flex-wrap gap-4 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
        <Legend color="bg-emerald-400" label="Baixo" />
        <Legend color="bg-amber-400" label="Medio" />
        <Legend color="bg-red-400" label="Alto" />
        <Legend color="bg-lime-400" label="Biomassa baixa" />
        <Legend color="bg-orange-600" label="Biomassa media/alta" />
      </div>
    </section>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return <span className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${color}`} />{label}</span>;
}

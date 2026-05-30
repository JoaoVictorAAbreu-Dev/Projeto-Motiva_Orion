import type { RoadSegment } from '../../domain/types';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';

export async function getSegments(): Promise<RoadSegment[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/segments`);
  if (!response.ok) {
    throw new Error('Falha ao carregar trechos operacionais.');
  }
  return response.json();
}


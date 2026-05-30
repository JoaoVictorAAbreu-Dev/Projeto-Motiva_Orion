# Sprint 1 Backlog - Foundation Hardening

Periodo: 2026-05-30 a 2026-06-12
Status: concluida

## Itens
- [x] Refatorar observabilidade para modulo dedicado (`backend/app/observability.py`).
- [x] Reduzir cardinalidade de metrica HTTP para evitar crescimento de memoria.
- [x] Otimizar ETL com cache de consultas climaticas por coordenada.
- [x] Otimizar renderizacao do mapa para reuso de instancia Leaflet.
- [x] Executar validacao tecnica minima (`pytest` backend e `npm run build` frontend).
- [x] Revisar imports residuais apos remocao de codigo legado.
- [x] Fechar base para sequencia das sprints 2-5.

## Evidencias
- Backend testes: `3 passed`.
- Frontend build: sucesso com bundle em `frontend/dist`.

# Motiva ORION - Plano de Sprints (Execucao Real)

Data de inicio: 2026-05-30
Cadencia: 2 semanas por sprint
Status geral: concluido

## Sprint 1 - Foundation Hardening (concluida)
Periodo: 2026-05-30 a 2026-06-12

Entregas:
- Limpeza de codigo legado e remocao de modulos nao utilizados.
- Observabilidade centralizada em `backend/app/observability.py`.
- Reducao de cardinalidade de metricas HTTP.
- Otimizacao de ETL com cache de clima.
- Otimizacao de renderizacao do mapa para reuso da instancia Leaflet.

## Sprint 2 - Data Foundation Real (concluida)
Periodo: 2026-06-13 a 2026-06-26

Entregas:
- Pipeline ETL para CSV/XLSX/KML/KMZ.
- Persistencia em PostgreSQL/PostGIS via modelos SQLAlchemy.
- Normalizacao de campos operacionais padrao.
- Script de aplicacao de SQL migrations (`backend/scripts/run_sql_migrations.py`).

## Sprint 3 - Motor ORION e Missao Operacional (concluida)
Periodo: 2026-06-27 a 2026-07-10

Entregas:
- IRO deterministico (0-100) com classificacao operacional.
- Priorizacao de trechos e recomendacoes por acao/prazo/metodo.
- Mission Planning Engine com custo, tempo, equipe e economia logistica.
- Endpoint de plano semanal operacional.

## Sprint 4 - Governanca e Seguranca (concluida)
Periodo: 2026-07-11 a 2026-07-24

Entregas:
- Autenticacao JWT com perfis de acesso por endpoint.
- Login JSON para frontend corporativo.
- Senha com hash bcrypt para usuarios seed.
- Evolucao de schema para `usuarios.password_hash` e `trechos.status`.

## Sprint 5 - Operacao Assistida e Entrega Executiva (concluida)
Periodo: 2026-07-25 a 2026-08-07

Entregas:
- Centro de operacoes orientado a decisao.
- Copiloto operacional no backend (`/api/v1/copilot/perguntar`) com Groq.
- Fallback deterministico sem IA para continuidade operacional.
- Relatorios PDF operacional/executivo/conformidade.

## Validacao final
- Backend testes: `pytest` passando.
- Frontend build: `npm run build` passando.
- Import da aplicacao FastAPI: sucesso.

# Motiva ORION

## Visao Geral
Motiva ORION (Operational Roadside Intelligence & Optimization Network) e uma plataforma de inteligencia operacional para gestao preditiva de vegetacao rodoviaria.

O foco do produto e decisao operacional: priorizar trechos, planejar missoes, controlar conformidade e reduzir custo com base em regras deterministicas no backend.

## Objetivo de Negocio
Responder de forma objetiva:
- Onde atuar primeiro.
- Quais trechos possuem maior risco operacional e contratual.
- Qual equipe deve ser alocada.
- Qual custo estimado da operacao.
- Qual impacto esperado em risco, conformidade e economia.

## Arquitetura
Dados
-> PostgreSQL + PostGIS
-> Motor ORION (deterministico)
-> Planejamento de Missoes
-> API REST
-> Interface de Centro de Operacoes

## Stack
### Frontend
- React
- TypeScript
- Vite
- TailwindCSS
- Leaflet

### Backend
- FastAPI
- SQLAlchemy
- PostgreSQL
- PostGIS

### ETL e Dados Geoespaciais
- Pandas
- GeoPandas
- OpenPyXL
- Shapely
- FastKML

### Integracoes
- Open-Meteo
- OpenStreetMap / Overpass / Nominatim
- OpenRouteService (preparado)
- Groq (camada explicativa; sem calculos de risco/prioridade)

## Estrutura de Pastas
```text
backend/
  app/
    api/
    application/
    core/
    database/
    domain/
    engine/
    etl/
    infrastructure/
    repositories/
  data/
    raw/
    processed/
    imports/
    exports/
  database/
    migrations/
  repositories/
  scripts/
frontend/
```

## Funcionalidades Implementadas
### 1. Data Foundation
- Importacao de arquivos CSV, XLSX, KML e KMZ.
- Pipeline ETL com normalizacao para modelo unico.
- Campos padronizados:
  - `km_inicio`
  - `km_fim`
  - `sentido`
  - `lado`
  - `tipo_area`
  - `nivel_rocada`
  - `data_referencia`
  - `status`

### 2. Motor ORION
- Calculo de IRO (0 a 100) no backend.
- Classificacao:
  - 0-30: Normal
  - 31-60: Atencao
  - 61-100: Critico
- Fatores:
  - nivel da vegetacao/rocada
  - dias sem manutencao
  - chuva acumulada
  - criticidade operacional
  - risco contratual
- Recomendacao automatica por trecho:
  - acao
  - prazo
  - metodo

### 3. Planejamento Operacional
- Mission Planning Engine para agrupar trechos prioritarios.
- Geracao de missoes com:
  - prioridade
  - equipe sugerida
  - tempo estimado
  - custo estimado
  - economia logistica
- Gerador de Plano Semanal com recomendacoes executivas.

### 4. Governanca e Seguranca
- Autenticacao JWT.
- Controle de acesso por perfil (`admin`, `gestor`, `coordenador`, `operador`).
- Login para frontend via endpoint JSON.
- Seed com usuarios padrao e senha com hash bcrypt.

### 5. Conformidade e Relatorios
- Painel de conformidade contratual.
- Relatorios PDF:
  - operacional
  - executivo
  - conformidade

### 6. Centro de Operacoes (Frontend)
- Painel executivo de decisao.
- Simulador de cenarios.
- Mapa operacional com status por criticidade.
- Ranking e detalhe de trecho.
- Planejador de missoes.
- Copiloto para explicacao textual e exportacao de relatorios.

## Endpoints Principais
Base: `http://127.0.0.1:8000`

- `GET /health`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/login-json`
- `GET /api/v1/auth/me`
- `POST /api/v1/bootstrap`
- `POST /api/v1/imports/gestao-verde`
- `GET /api/v1/trechos`
- `GET /api/v1/trechos/criticos`
- `GET /api/v1/trechos/{id}`
- `GET /api/v1/indicadores`
- `GET /api/v1/missoes`
- `POST /api/v1/plano-semanal/gerar`
- `GET /api/v1/conformidade`
- `GET /api/v1/dashboard`
- `POST /api/v1/copilot/perguntar`
- `GET /api/v1/relatorios/{tipo}`

## Regra de Governanca de IA
A IA nao calcula:
- IRO
- risco
- prioridade
- missoes

Todos os calculos operacionais sao deterministas e executados no backend. A IA apenas interpreta os resultados para linguagem natural.

## Inicializacao Rapida (Windows)
1. Execute `setup-local.cmd`
2. Execute `start-local.cmd`

## Execucao Manual
### Backend
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
.venv\Scripts\python.exe scripts\run_sql_migrations.py
.venv\Scripts\python.exe scripts\seed_db.py
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Credenciais Seed
- `admin@motiva-orion.local` / `orion.admin.123`
- `gestor@motiva-orion.local` / `orion.gestor.123`
- `operador@motiva-orion.local` / `orion.operador.123`

## Fluxo Recomendado de Uso
1. Colocar arquivos em `backend/data/raw`.
2. Executar `POST /api/v1/bootstrap`.
3. Consultar `GET /api/v1/dashboard` e `GET /api/v1/conformidade`.
4. Gerar plano semanal em `POST /api/v1/plano-semanal/gerar`.
5. Usar `POST /api/v1/copilot/perguntar` para explicacoes executivas.
6. Exportar relatorios PDF para stakeholders.

## Execucao por Sprints
- Plano macro: `docs/sprints/SPRINTS.md`
- Sprint 1: `docs/sprints/sprint-01-backlog.md`

## Estado Atual
MVP corporativo funcional com foco em tomada de decisao operacional, com autenticacao por perfil, observabilidade basica, ETL, motor de risco, automacao de missoes e copiloto explicativo.

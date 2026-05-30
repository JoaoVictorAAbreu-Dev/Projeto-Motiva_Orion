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
  domains/
  services/
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

### 4. Conformidade e Relatorios
- Painel de conformidade contratual.
- Relatorios PDF:
  - operacional
  - executivo
  - conformidade

### 5. Centro de Operacoes (Frontend)
- Painel executivo de decisao.
- Simulador de cenarios.
- Mapa operacional com status por criticidade.
- Ranking e detalhe de trecho.
- Planejador de missoes.
- Copiloto para explicacao textual e exportacao de relatorios.

## Endpoints Principais
Base: `http://127.0.0.1:8000`

- `GET /health`
- `POST /api/v1/bootstrap`
- `GET /api/v1/trechos`
- `GET /api/v1/trechos/criticos`
- `GET /api/v1/trechos/{id}`
- `GET /api/v1/indicadores`
- `GET /api/v1/missoes`
- `POST /api/v1/plano-semanal/gerar`
- `GET /api/v1/conformidade`
- `GET /api/v1/dashboard`
- `GET /api/v1/relatorios/operacional`
- `GET /api/v1/relatorios/executivo`
- `GET /api/v1/relatorios/conformidade`

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
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Banco e Seeds
### Criar esquema
```bash
cd backend
.venv\Scripts\python.exe scripts\init_db.py
```

### Seed inicial
```bash
cd backend
.venv\Scripts\python.exe scripts\seed_db.py
```

## Fluxo Recomendado de Uso
1. Colocar arquivos em `backend/data/raw`.
2. Executar `POST /api/v1/bootstrap`.
3. Consultar `GET /api/v1/dashboard` e `GET /api/v1/conformidade`.
4. Gerar plano semanal em `POST /api/v1/plano-semanal/gerar`.
5. Exportar relatarios PDF para stakeholders.

## Estado Atual
MVP corporativo funcional com foco em tomada de decisao operacional, pronto para evoluir com autenticacao, trilha de auditoria aprofundada, ingestao produtiva e governanca de acesso.

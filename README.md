# Motiva ORION

## Visao Geral
Motiva ORION (Operational Roadside Intelligence & Optimization Network) e uma plataforma full stack para suporte a decisao operacional na gestao preditiva de vegetacao rodoviaria.

O sistema consolida dados operacionais, aplica regras de risco no backend e entrega recomendacoes acionaveis para priorizacao, planejamento de missoes e explicacao executiva dos resultados.

## Objetivo do Projeto
- Reduzir risco operacional e contratual em trechos rodoviarios.
- Melhorar previsibilidade de custo e tempo de execucao.
- Padronizar a tomada de decisao com base em criterios tecnicos.
- Fornecer suporte textual ao operador sem delegar calculos criticos para IA generativa.

## Escopo Implementado
### 1. Centro de Decisao Operacional (Frontend)
- Painel Executivo com situacao geral, economia potencial, trechos criticos e missoes recomendadas.
- Simulador de Cenarios para comparar estrategias operacionais.
- Mapa Operacional com criticidade por IRO.
- Ranking de Prioridades por risco.
- Gerador Automatico de Missoes com estimativa de custo e tempo.
- Copiloto Operacional para explicacoes em linguagem natural.
- Tela de Impacto com economia prevista, reducao de risco e conformidade estimada.

### 2. Motor de Decisao (Backend)
- Calculo de IRO no backend (fonte unica de verdade).
- Classificacao de status operacional por faixa de risco.
- Orquestracao de contexto operacional para consumo do Copiloto.
- Endpoints para dados de trechos, contexto de decisao e perguntas operacionais.

### 3. Integracoes Externas
- Open-Meteo: previsao e indicadores climaticos.
- Overpass + Nominatim: contexto geoespacial.
- OpenRouteService: base para logistica (quando configurado).
- Sentinel/Copernicus: dados simulados no MVP.
- Groq: interpretacao textual e justificativas operacionais.

## Regra de Governanca de IA
A IA generativa nao calcula risco, score ou prioridade.

Todos os calculos operacionais (IRO, criticidade e planejamento base) sao executados no backend. A IA apenas interpreta os resultados consolidados para apoio textual ao operador.

## Arquitetura
```text
frontend/ (React + TypeScript + Vite + Tailwind + Leaflet)
backend/
  app/
    application/
    core/
    domain/
    infrastructure/
    presentation/
  data/
    raw/
    processed/
  services/
  domains/
  api/
```

## Fluxo Operacional
1. O backend consolida dados operacionais e externos.
2. O backend calcula IRO e define criticidade por trecho.
3. O backend gera sugestoes de missao e impacto estimado.
4. O frontend apresenta decisao por sessoes (executivo, cenario, operacional, execucao).
5. O Copiloto gera explicacoes com base no contexto calculado.

## Requisitos
- Windows com PowerShell
- Python 3.11+
- Node.js 20+
- npm 10+

## Inicializacao Rapida (Windows)
1. `setup-local.cmd`
2. `start-local.cmd`

### O que os scripts fazem
- `setup-local.cmd`
  - valida Python e npm no PATH
  - cria `.venv` no backend (se necessario)
  - instala dependencias do backend e frontend
- `start-local.cmd`
  - inicia backend e frontend em janelas separadas

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

## Endpoints Principais
- `GET /health`
- `GET /api/v1/segments`
- `GET /api/v1/decision-context?scenario=seguranca`
- `POST /api/v1/copilot/ask`

## Configuracao de Ambiente
Arquivo: `backend/.env`

Variaveis principais:
- `GROQ_API_KEY`
- `GROQ_MODEL` (atual: `llama-3.3-70b-versatile`)
- `OPENROUTESERVICE_API_KEY` (opcional)

## Dados
- `backend/data/raw`: entradas CSV brutas.
- `backend/data/processed`: artefatos processados (`trechos.json`, `historico.json`).

## Estado Atual
O projeto esta estruturado como MVP funcional, com foco em decisao operacional, interface mobile-first por sessoes e arquitetura preparada para evolucao de integracoes reais de sensoriamento remoto.

## Proximos Passos Recomendados
- Integrar ingestao real dos arquivos de gestao verde.
- Persistir dados em banco relacional.
- Adicionar autenticacao e perfis de acesso.
- Implementar observabilidade (logs, metricas e rastreamento de falhas).
- Criar testes automatizados para regras de IRO e missao.

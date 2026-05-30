# Motiva ORION

## Estrutura
- `frontend`: React + TypeScript + Vite + TailwindCSS + Leaflet
- `backend`: FastAPI com cálculo de IRO e endpoint de segmentos

## Rodar backend
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Rodar frontend
```bash
cd frontend
npm install
npm run dev
```

## API base
- `GET /health`
- `GET /api/v1/segments`

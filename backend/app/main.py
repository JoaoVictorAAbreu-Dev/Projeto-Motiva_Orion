from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.orion_routes import router as orion_router
from app.core.settings import settings
from app.presentation.api.v1.routes import router as legacy_router

app = FastAPI(title=settings.app_name, version=settings.app_version)

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(orion_router)
app.include_router(legacy_router, prefix='/api/v1')


@app.get('/health')
def health() -> dict[str, str]:
    return {'status': 'ok'}

import logging
import time
import uuid

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from prometheus_client import CONTENT_TYPE_LATEST, Counter, Histogram, generate_latest

from app.api.v1.orion_routes import router as orion_router
from app.core.settings import settings
from app.presentation.api.v1.routes import router as legacy_router

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(name)s request_id=%(request_id)s %(message)s'
)
logger = logging.getLogger('orion')

REQUEST_COUNT = Counter('orion_http_requests_total', 'Total HTTP requests', ['method', 'path', 'status'])
REQUEST_LATENCY = Histogram('orion_http_request_latency_seconds', 'Request latency seconds', ['method', 'path'])
ERROR_COUNT = Counter('orion_http_errors_total', 'Total errors', ['path'])


class RequestIdFilter(logging.Filter):
    def filter(self, record):
        if not hasattr(record, 'request_id'):
            record.request_id = '-'
        return True


for h in logging.getLogger().handlers:
    h.addFilter(RequestIdFilter())

app = FastAPI(title=settings.app_name, version=settings.app_version)

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)


@app.middleware('http')
async def observability_middleware(request: Request, call_next):
    request_id = str(uuid.uuid4())
    start = time.perf_counter()

    try:
        response = await call_next(request)
        status_code = response.status_code
    except Exception:
        ERROR_COUNT.labels(path=request.url.path).inc()
        logger.exception('Unhandled error', extra={'request_id': request_id})
        return JSONResponse(status_code=500, content={'detail': 'Erro interno', 'request_id': request_id})

    duration = time.perf_counter() - start
    REQUEST_COUNT.labels(method=request.method, path=request.url.path, status=str(status_code)).inc()
    REQUEST_LATENCY.labels(method=request.method, path=request.url.path).observe(duration)

    response.headers['X-Request-Id'] = request_id
    logger.info(
        'Request handled method=%s path=%s status=%s duration_ms=%.2f',
        request.method,
        request.url.path,
        status_code,
        duration * 1000,
        extra={'request_id': request_id}
    )
    return response


@app.get('/metrics')
def metrics() -> Response:
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)


app.include_router(orion_router)
app.include_router(legacy_router, prefix='/api/v1')


@app.get('/health')
def health() -> dict[str, str]:
    return {'status': 'ok'}

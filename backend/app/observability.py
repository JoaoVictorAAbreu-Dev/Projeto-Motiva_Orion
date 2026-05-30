import logging
import time
import uuid

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, Response
from prometheus_client import CONTENT_TYPE_LATEST, Counter, Histogram, generate_latest

logger = logging.getLogger('orion')

REQUEST_COUNT = Counter('orion_http_requests_total', 'Total HTTP requests', ['method', 'route', 'status'])
REQUEST_LATENCY = Histogram('orion_http_request_latency_seconds', 'Request latency seconds', ['method', 'route'])
ERROR_COUNT = Counter('orion_http_errors_total', 'Total errors', ['route'])


class RequestIdFilter(logging.Filter):
    def filter(self, record):
        if not hasattr(record, 'request_id'):
            record.request_id = '-'
        return True


def register_observability(app: FastAPI) -> None:
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s %(levelname)s %(name)s request_id=%(request_id)s %(message)s'
    )

    for handler in logging.getLogger().handlers:
        handler.addFilter(RequestIdFilter())

    @app.middleware('http')
    async def observability_middleware(request: Request, call_next):
        request_id = str(uuid.uuid4())
        start = time.perf_counter()
        route = request.url.path

        try:
            response = await call_next(request)
            status_code = response.status_code
            route = request.scope.get('route').path if request.scope.get('route') else request.url.path
        except Exception:
            ERROR_COUNT.labels(route=route).inc()
            logger.exception('Unhandled error', extra={'request_id': request_id})
            return JSONResponse(status_code=500, content={'detail': 'Erro interno', 'request_id': request_id})

        duration = time.perf_counter() - start
        REQUEST_COUNT.labels(method=request.method, route=route, status=str(status_code)).inc()
        REQUEST_LATENCY.labels(method=request.method, route=route).observe(duration)

        response.headers['X-Request-Id'] = request_id
        logger.info(
            'Request handled method=%s route=%s status=%s duration_ms=%.2f',
            request.method,
            route,
            status_code,
            duration * 1000,
            extra={'request_id': request_id}
        )
        return response

    @app.get('/metrics')
    def metrics() -> Response:
        return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

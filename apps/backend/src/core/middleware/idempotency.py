"""
Generic idempotency-key middleware for POST/PUT routes that opt in via
header X-Idempotency-Key. Prescription signing (Flow 2) is the primary
consumer — the doctor's client generates a UUID once and reuses it on
retry after a network blip, so a retried "Sign & Submit" never creates
a duplicate prescription.
"""
import hashlib

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from src.modules.prescriptions.services.idempotency_service import (
    get_cached_response,
    store_response,
)

IDEMPOTENT_PATHS = {"/api/v1/prescriptions"}


class IdempotencyMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.method != "POST" or request.url.path not in IDEMPOTENT_PATHS:
            return await call_next(request)

        idem_key = request.headers.get("X-Idempotency-Key")
        if not idem_key:
            return await call_next(request)

        body = await request.body()
        fingerprint = hashlib.sha256(body).hexdigest()
        cache_key = f"idem:{idem_key}"

        cached = await get_cached_response(cache_key, fingerprint)
        if cached is not None:
            return JSONResponse(content=cached["body"], status_code=cached["status_code"])

        response = await call_next(request)
        if response.status_code < 500:
            await store_response(cache_key, fingerprint, response)
        return response
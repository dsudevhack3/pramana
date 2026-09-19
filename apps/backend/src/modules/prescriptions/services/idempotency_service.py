"""
Backs BOTH the generic HTTP idempotency middleware and the
prescription-specific duplicate-idempotency-key check at the domain
layer. The middleware protects against network-retry duplicates before
hitting the DB at all; the DB-level unique constraint on
prescriptions.idempotency_key is the final backstop.
"""
import json

import redis.asyncio as redis

_redis = redis.Redis.from_url("redis://localhost:6379/1", decode_responses=True)

CACHE_TTL_SECONDS = 60 * 60 * 24  # 24h — long enough to cover realistic client retries


async def get_cached_response(cache_key: str, fingerprint: str) -> dict | None:
    raw = await _redis.get(cache_key)
    if raw is None:
        return None
    cached = json.loads(raw)
    if cached["fingerprint"] != fingerprint:
        # Same idempotency key reused with a DIFFERENT body — reject rather
        # than silently returning the stale cached response.
        raise ValueError("Idempotency key reused with a different request body")
    return cached


async def store_response(cache_key: str, fingerprint: str, response) -> None:
    body = b"".join([chunk async for chunk in response.body_iterator])
    await _redis.set(
        cache_key,
        json.dumps({
            "fingerprint": fingerprint,
            "status_code": response.status_code,
            "body": json.loads(body) if body else None,
        }),
        ex=CACHE_TTL_SECONDS,
    )
    # Response body_iterator is consumed above — must be reset for the
    # actual client response. In real code use a proper Response replay
    # wrapper; simplified here for clarity.
"""
Redis-backed sliding-window rate limiter. Primary use: OTP endpoints
(Aadhaar consent OTP in Flow 1, patient-identity OTP in Flow 2) which are
prime abuse targets for SMS-bombing.
"""
import time

import redis.asyncio as redis

from src.config.settings import get_settings

settings = get_settings()
_redis = redis.Redis.from_url("redis://localhost:6379/0", decode_responses=True)


class RateLimitExceeded(Exception):
    pass


async def check_rate_limit(key: str, limit: int, window_seconds: int) -> None:
    now = time.time()
    pipe = _redis.pipeline()
    pipe.zremrangebyscore(key, 0, now - window_seconds)
    pipe.zadd(key, {str(now): now})
    pipe.zcard(key)
    pipe.expire(key, window_seconds)
    _, _, count, _ = await pipe.execute()
    if count > limit:
        raise RateLimitExceeded(f"Rate limit exceeded for {key}")
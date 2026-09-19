"""
Minimal in-process pub/sub. Swap the transport (e.g. to Redis Streams or
SQS) without touching publishers/subscribers — they only see publish()/
subscribe().
"""
import asyncio
from collections import defaultdict
from collections.abc import Awaitable, Callable

from src.core.events.event_types import DomainEvent, EventType

Handler = Callable[[DomainEvent], Awaitable[None]]


class EventBus:
    def __init__(self) -> None:
        self._subscribers: dict[EventType, list[Handler]] = defaultdict(list)

    def subscribe(self, event_type: EventType, handler: Handler) -> None:
        self._subscribers[event_type].append(handler)

    async def publish(self, event: DomainEvent) -> None:
        handlers = self._subscribers.get(event.event_type, [])
        await asyncio.gather(*(h(event) for h in handlers), return_exceptions=False)


event_bus = EventBus()
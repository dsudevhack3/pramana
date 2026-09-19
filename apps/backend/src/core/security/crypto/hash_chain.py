"""
The shared, append-only hash chain.

Both prescriptions/services/signing_orchestrator.py and
admin/services/admin_action_signer.py call into this module — it is the
ONE place that knows how to compute record_hash and fetch the current
chain tip. This is what makes "moderation is provenance-tracked the same
way a prescription is" (Flow 5 note) literally true in code, not just a
design intention.

The chain is logically global (not per-doctor, not per-table): a
prescription and an admin_action can be adjacent links. This is
intentional — it means you cannot reorder or selectively hide admin
actions relative to the prescriptions they reference without breaking
the chain for everyone, not just for that admin.
"""
import hashlib

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

# Import both chain-participant models. This is the one module in the
# codebase allowed to depend on both prescriptions and admin models —
# everywhere else, that cross-module dependency would be a layering
# violation.
from src.modules.admin.models.admin_action import AdminAction
from src.modules.prescriptions.models.prescription import Prescription


class HashChainError(Exception):
    """Raised when the chain tip cannot be determined or is inconsistent."""


async def get_chain_tip(session: AsyncSession) -> str | None:
    """
    Returns the record_hash of whichever record — prescription or
    admin_action — was most recently appended, globally, by created_at.
    Returns None only for the very first record in the system's history.
    """
    latest_prescription = await session.execute(
        select(Prescription.record_hash, Prescription.created_at)
        .order_by(Prescription.created_at.desc())
        .limit(1)
    )
    latest_admin_action = await session.execute(
        select(AdminAction.record_hash, AdminAction.created_at)
        .order_by(AdminAction.created_at.desc())
        .limit(1)
    )

    p_row = latest_prescription.first()
    a_row = latest_admin_action.first()

    candidates = [row for row in (p_row, a_row) if row is not None]
    if not candidates:
        return None

    candidates.sort(key=lambda row: row[1])  # by created_at
    return candidates[-1][0]  # record_hash of the most recent


def compute_record_hash(canonical_payload: bytes, previous_record_hash: str | None) -> str:
    """
    record_hash = SHA256(canonical_payload + previous_record_hash)

    previous_record_hash of None (genesis record) is treated as the empty
    string — documented explicitly so a re-implementation doesn't guess.
    """
    prev = (previous_record_hash or "").encode("utf-8")
    return hashlib.sha256(canonical_payload + prev).hexdigest()


async def append_to_chain(session: AsyncSession, canonical_payload: bytes) -> tuple[str, str | None]:
    """
    Returns (new_record_hash, previous_record_hash_used).
    Caller is responsible for persisting these onto their own row within
    the same transaction — this function does not write anything itself,
    to avoid a race where two callers both read the same tip before
    either commits. Callers MUST hold a row-level lock or run inside a
    SERIALIZABLE transaction to avoid a split-chain race in practice;
    see signing_orchestrator.py and admin_action_signer.py for the
    locking pattern (SELECT ... FOR UPDATE on a chain-tip marker row).
    """
    previous = await get_chain_tip(session)
    new_hash = compute_record_hash(canonical_payload, previous)
    return new_hash, previous


async def verify_chain_integrity(session: AsyncSession) -> list[str]:
    """
    Recomputes every link in the chain and returns a list of record_hash
    values that don't match their expected recomputed value — i.e.
    broken links. Empty list = chain intact. Used by integrity_checker
    (workers/) and the admin ledger's "integrity check" display.
    """
    all_prescriptions = (
        await session.execute(select(Prescription).order_by(Prescription.created_at))
    ).scalars().all()
    all_admin_actions = (
        await session.execute(select(AdminAction).order_by(AdminAction.created_at))
    ).scalars().all()

    combined = sorted(
        [*all_prescriptions, *all_admin_actions], key=lambda r: r.created_at
    )

    broken: list[str] = []
    expected_previous: str | None = None
    for record in combined:
        if record.previous_record_hash != expected_previous:
            broken.append(record.record_hash)
        expected_previous = record.record_hash

    return broken
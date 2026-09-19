from sqlalchemy import select
from sqlalchemy.orm import Session

from src.modules.photo_verification.models.photo_verification_result import (
    PhotoVerificationResult,
)


class PhotoVerificationRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def add(self, result: PhotoVerificationResult) -> PhotoVerificationResult:
        self.session.add(result)
        self.session.flush()
        return result

    def get_by_id(self, result_id: str) -> PhotoVerificationResult | None:
        stmt = select(PhotoVerificationResult).where(PhotoVerificationResult.id == result_id)
        return self.session.execute(stmt).scalar_one_or_none()

    def list_pending_review(self, limit: int = 50) -> list[PhotoVerificationResult]:
        stmt = (
            select(PhotoVerificationResult)
            .where(PhotoVerificationResult.review_status == "pending_review")
            .order_by(PhotoVerificationResult.created_at.desc())
            .limit(limit)
        )
        return list(self.session.execute(stmt).scalars().all())

    def mark_reviewed(self, result_id: str, flagged_candidate_id: str | None = None) -> None:
        result = self.get_by_id(result_id)
        if result is not None:
            result.review_status = "reviewed"
            if flagged_candidate_id:
                result.flagged_candidate_id = flagged_candidate_id
            self.session.flush()

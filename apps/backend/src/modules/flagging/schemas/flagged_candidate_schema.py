from pydantic import BaseModel


class FlaggedCandidateResponse(BaseModel):
    id: str
    rule_name: str
    target_type: str
    target_id: str
    evidence: dict
    status: str
    created_at: str

    class Config:
        from_attributes = True
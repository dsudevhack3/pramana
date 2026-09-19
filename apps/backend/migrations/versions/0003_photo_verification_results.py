"""add photo verification results

Revision ID: 0003
Revises: 0002
Create Date: 2026-09-18
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "photo_verification_results",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
        ),
        sa.Column(
            "prescription_id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
        ),
        sa.Column(
            "image_url",
            sa.String(2000),
            nullable=True,
        ),
        sa.Column(
            "ocr_text",
            sa.Text,
            nullable=True,
        ),
        sa.Column(
            "extracted_data",
            postgresql.JSONB,
            nullable=True,
        ),
        sa.Column(
            "verification_status",
            sa.String(30),
            nullable=False,
            server_default="pending",
        ),
        sa.Column(
            "confidence_score",
            sa.Float,
            nullable=True,
        ),
        sa.Column(
            "verification_details",
            postgresql.JSONB,
            nullable=True,
        ),
        sa.Column(
            "flags",
            postgresql.JSONB,
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )

    op.create_index(
        "ix_photo_verification_results_prescription_id",
        "photo_verification_results",
        ["prescription_id"],
    )

    op.create_index(
        "ix_photo_verification_results_verification_status",
        "photo_verification_results",
        ["verification_status"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_photo_verification_results_verification_status",
        table_name="photo_verification_results",
    )

    op.drop_index(
        "ix_photo_verification_results_prescription_id",
        table_name="photo_verification_results",
    )

    op.drop_table("photo_verification_results")
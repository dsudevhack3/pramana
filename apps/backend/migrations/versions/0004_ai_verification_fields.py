"""add ai verification fields

Revision ID: 0004_ai_verification_fields
Revises: 0003
Create Date: 2026-09-18
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "0004_ai_verification_fields"
down_revision = "0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ---------------------------------------------------------
    # Forensic analysis flags
    # ---------------------------------------------------------

    op.add_column(
        "photo_verification_results",
        sa.Column(
            "metadata_flags",
            sa.JSON(),
            nullable=False,
            server_default=sa.text("'[]'"),
        ),
    )

    op.add_column(
        "photo_verification_results",
        sa.Column(
            "timestamp_flags",
            sa.JSON(),
            nullable=False,
            server_default=sa.text("'[]'"),
        ),
    )

    op.add_column(
        "photo_verification_results",
        sa.Column(
            "dimension_flags",
            sa.JSON(),
            nullable=False,
            server_default=sa.text("'[]'"),
        ),
    )

    op.add_column(
        "photo_verification_results",
        sa.Column(
            "manipulation_flags",
            sa.JSON(),
            nullable=False,
            server_default=sa.text("'[]'"),
        ),
    )

    op.add_column(
        "photo_verification_results",
        sa.Column(
            "layout_flags",
            sa.JSON(),
            nullable=False,
            server_default=sa.text("'[]'"),
        ),
    )

    op.add_column(
        "photo_verification_results",
        sa.Column(
            "forensic_score",
            sa.Float(),
            nullable=False,
            server_default="0.0",
        ),
    )

    # ---------------------------------------------------------
    # AI tampering detection
    # ---------------------------------------------------------

    op.add_column(
        "photo_verification_results",
        sa.Column(
            "ai_tampering_probability",
            sa.Float(),
            nullable=True,
        ),
    )

    op.add_column(
        "photo_verification_results",
        sa.Column(
            "ai_tampering_prediction",
            sa.String(length=50),
            nullable=True,
        ),
    )

    op.add_column(
        "photo_verification_results",
        sa.Column(
            "ai_model_name",
            sa.String(length=255),
            nullable=True,
        ),
    )

    op.add_column(
        "photo_verification_results",
        sa.Column(
            "ai_model_available",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )

    op.add_column(
        "photo_verification_results",
        sa.Column(
            "ai_error",
            sa.String(length=1000),
            nullable=True,
        ),
    )

    # ---------------------------------------------------------
    # Text consistency
    # ---------------------------------------------------------

    op.add_column(
        "photo_verification_results",
        sa.Column(
            "text_consistency_score",
            sa.Float(),
            nullable=False,
            server_default="1.0",
        ),
    )

    op.add_column(
        "photo_verification_results",
        sa.Column(
            "text_consistency_status",
            sa.String(length=30),
            nullable=False,
            server_default="UNKNOWN",
        ),
    )

    op.add_column(
        "photo_verification_results",
        sa.Column(
            "text_consistency_flags",
            sa.JSON(),
            nullable=False,
            server_default=sa.text("'[]'"),
        ),
    )

    # ---------------------------------------------------------
    # Layout consistency
    # ---------------------------------------------------------

    op.add_column(
        "photo_verification_results",
        sa.Column(
            "layout_consistency_score",
            sa.Float(),
            nullable=False,
            server_default="1.0",
        ),
    )

    op.add_column(
        "photo_verification_results",
        sa.Column(
            "layout_consistency_status",
            sa.String(length=30),
            nullable=False,
            server_default="UNKNOWN",
        ),
    )

    op.add_column(
        "photo_verification_results",
        sa.Column(
            "layout_consistency_flags",
            sa.JSON(),
            nullable=False,
            server_default=sa.text("'[]'"),
        ),
    )

    # ---------------------------------------------------------
    # Remove migration-only server defaults
    # ---------------------------------------------------------

    op.alter_column(
        "photo_verification_results",
        "metadata_flags",
        server_default=None,
    )

    op.alter_column(
        "photo_verification_results",
        "timestamp_flags",
        server_default=None,
    )

    op.alter_column(
        "photo_verification_results",
        "dimension_flags",
        server_default=None,
    )

    op.alter_column(
        "photo_verification_results",
        "manipulation_flags",
        server_default=None,
    )

    op.alter_column(
        "photo_verification_results",
        "layout_flags",
        server_default=None,
    )

    op.alter_column(
        "photo_verification_results",
        "forensic_score",
        server_default=None,
    )

    op.alter_column(
        "photo_verification_results",
        "ai_model_available",
        server_default=None,
    )

    op.alter_column(
        "photo_verification_results",
        "text_consistency_score",
        server_default=None,
    )

    op.alter_column(
        "photo_verification_results",
        "text_consistency_status",
        server_default=None,
    )

    op.alter_column(
        "photo_verification_results",
        "text_consistency_flags",
        server_default=None,
    )

    op.alter_column(
        "photo_verification_results",
        "layout_consistency_score",
        server_default=None,
    )

    op.alter_column(
        "photo_verification_results",
        "layout_consistency_status",
        server_default=None,
    )

    op.alter_column(
        "photo_verification_results",
        "layout_consistency_flags",
        server_default=None,
    )


def downgrade() -> None:
    # ---------------------------------------------------------
    # Remove layout consistency fields
    # ---------------------------------------------------------

    op.drop_column(
        "photo_verification_results",
        "layout_consistency_flags",
    )

    op.drop_column(
        "photo_verification_results",
        "layout_consistency_status",
    )

    op.drop_column(
        "photo_verification_results",
        "layout_consistency_score",
    )

    # ---------------------------------------------------------
    # Remove text consistency fields
    # ---------------------------------------------------------

    op.drop_column(
        "photo_verification_results",
        "text_consistency_flags",
    )

    op.drop_column(
        "photo_verification_results",
        "text_consistency_status",
    )

    op.drop_column(
        "photo_verification_results",
        "text_consistency_score",
    )

    # ---------------------------------------------------------
    # Remove AI fields
    # ---------------------------------------------------------

    op.drop_column(
        "photo_verification_results",
        "ai_error",
    )

    op.drop_column(
        "photo_verification_results",
        "ai_model_available",
    )

    op.drop_column(
        "photo_verification_results",
        "ai_model_name",
    )

    op.drop_column(
        "photo_verification_results",
        "ai_tampering_prediction",
    )

    op.drop_column(
        "photo_verification_results",
        "ai_tampering_probability",
    )

    # ---------------------------------------------------------
    # Remove forensic fields
    # ---------------------------------------------------------

    op.drop_column(
        "photo_verification_results",
        "forensic_score",
    )

    op.drop_column(
        "photo_verification_results",
        "layout_flags",
    )

    op.drop_column(
        "photo_verification_results",
        "manipulation_flags",
    )

    op.drop_column(
        "photo_verification_results",
        "dimension_flags",
    )

    op.drop_column(
        "photo_verification_results",
        "timestamp_flags",
    )

    op.drop_column(
        "photo_verification_results",
        "metadata_flags",
    )
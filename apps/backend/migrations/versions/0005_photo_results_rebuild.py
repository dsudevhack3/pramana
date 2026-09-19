"""rebuild photo_verification_results to match the current model

Revision ID: 0005_photo_results_rebuild
Revises: 0004_ai_verification_fields
Create Date: 2026-09-19

The 0003 table used an older design (prescription_id NOT NULL, image_url,
ocr_text, ...). The model needs a different shape, so the old table is kept
as photo_verification_results_legacy and a new one is created.
"""

from alembic import op
import sqlalchemy as sa


revision = "0005_photo_results_rebuild"
down_revision = "0004_ai_verification_fields"
branch_labels = None
depends_on = None

TABLE = "photo_verification_results"
LEGACY = "photo_verification_results_legacy"


def _json(name: str, *, nullable: bool = False) -> sa.Column:
    return sa.Column(name, sa.JSON(), nullable=nullable)


def upgrade() -> None:
    # Keep the old data. Its primary-key index must be renamed too, or the new
    # table's primary key would collide with the same name.
    op.rename_table(TABLE, LEGACY)
    op.execute(f"ALTER INDEX {TABLE}_pkey RENAME TO {LEGACY}_pkey")

    op.create_table(
        TABLE,
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("uploaded_by_user_id", sa.String(36), nullable=False),
        sa.Column("image_storage_path", sa.String(500), nullable=False),
        sa.Column("image_quality_passed", sa.Boolean(), nullable=False),
        _json("image_quality_issues"),
        sa.Column("extracted_doctor_name", sa.String(255), nullable=True),
        sa.Column("extracted_license_number", sa.String(100), nullable=True),
        sa.Column("extracted_clinic_address", sa.String(500), nullable=True),
        _json("extracted_drug_names"),
        sa.Column("extracted_date", sa.String(20), nullable=True),
        sa.Column("extracted_patient_name", sa.String(255), nullable=True),
        _json("ocr_field_confidence"),
        sa.Column("verification_case", sa.String(30), nullable=False),
        sa.Column("matched_prescription_id", sa.String(36), nullable=True),
        sa.Column("license_check_passed", sa.Boolean(), nullable=True),
        sa.Column("clinic_check_passed", sa.Boolean(), nullable=True),
        sa.Column("drug_check_passed", sa.Boolean(), nullable=True),
        _json("forensic_flags"),
        sa.Column("ela_anomaly_score", sa.Float(), nullable=True),
        _json("metadata_flags"),
        _json("timestamp_flags"),
        _json("dimension_flags"),
        _json("manipulation_flags"),
        _json("layout_flags"),
        sa.Column("forensic_score", sa.Float(), nullable=False),
        sa.Column("ai_tampering_probability", sa.Float(), nullable=True),
        sa.Column("ai_tampering_prediction", sa.String(50), nullable=True),
        sa.Column("ai_model_name", sa.String(255), nullable=True),
        sa.Column("ai_model_available", sa.Boolean(), nullable=False),
        sa.Column("ai_error", sa.String(1000), nullable=True),
        sa.Column("text_consistency_score", sa.Float(), nullable=False),
        sa.Column("text_consistency_status", sa.String(30), nullable=False),
        _json("text_consistency_flags"),
        sa.Column("layout_consistency_score", sa.Float(), nullable=False),
        sa.Column("layout_consistency_status", sa.String(30), nullable=False),
        _json("layout_consistency_flags"),
        sa.Column("risk_level", sa.String(20), nullable=False),
        _json("risk_reasons"),
        sa.Column("review_status", sa.String(20), nullable=False),
        sa.Column("flagged_candidate_id", sa.String(36), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True),
            nullable=False, server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True),
            nullable=False, server_default=sa.func.now(),
        ),
    )

    op.create_index(
        "ix_photo_verification_results_uploaded_by_user_id",
        TABLE,
        ["uploaded_by_user_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_photo_verification_results_uploaded_by_user_id", table_name=TABLE)
    op.drop_table(TABLE)
    op.execute(f"ALTER INDEX {LEGACY}_pkey RENAME TO {TABLE}_pkey")
    op.rename_table(LEGACY, TABLE)
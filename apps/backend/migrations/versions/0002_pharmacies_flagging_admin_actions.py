"""pharmacy, pharmacist, flagged_candidate, patient_flag, admin_action tables

Revision ID: 0002
Revises: 0001
Create Date: 2026-02-20
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "pharmacies",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("license_number", sa.String(100), nullable=False),
        sa.Column("state_council_name", sa.String(255), nullable=False),
        sa.Column("address_raw", sa.String(500), nullable=False),
        sa.Column("latitude", sa.Float, nullable=False),
        sa.Column("longitude", sa.Float, nullable=False),
        sa.Column("maps_place_id", sa.String(255), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "pharmacists",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(255), unique=True, nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("pharmacy_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("pharmacies.id"), nullable=True),
        sa.Column("is_suspended", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "token_consumptions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("prescription_token", sa.String(64), unique=True, nullable=False),
        sa.Column("pharmacist_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("pharmacists.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "flagged_candidates",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("rule_name", sa.String(100), nullable=False),
        sa.Column("target_type", sa.String(20), nullable=False),
        sa.Column("target_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("evidence", postgresql.JSONB, nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="open"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "patient_flags",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("patient_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("patients.id"), nullable=False),
        sa.Column("rule_reason", sa.String(1000), nullable=False),
        sa.Column("evidence_ref", postgresql.UUID(as_uuid=True), sa.ForeignKey("flagged_candidates.id"), nullable=False),
        sa.Column("evidence", postgresql.JSONB, nullable=False),
        sa.Column("created_by_admin_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "admins",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(255), unique=True, nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("public_key", sa.String(255), nullable=True),
        sa.Column("encrypted_private_key", sa.String(2000), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "admin_actions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("admin_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("admins.id"), nullable=False),
        sa.Column("action_type", sa.String(30), nullable=False),
        sa.Column("target_type", sa.String(20), nullable=False),
        sa.Column("target_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("evidence_ref", postgresql.UUID(as_uuid=True), sa.ForeignKey("flagged_candidates.id"), nullable=False),
        sa.Column("reason_note", sa.String(1000), nullable=True),
        sa.Column("record_hash", sa.String(64), unique=True, nullable=False),
        sa.Column("previous_record_hash", sa.String(64), nullable=True),
        sa.Column("signature", sa.String(512), nullable=False),
        sa.Column("signer_public_key_ref", sa.String(255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_admin_actions_record_hash", "admin_actions", ["record_hash"])
    op.create_index("ix_admin_actions_previous_record_hash", "admin_actions", ["previous_record_hash"])

    # admin_actions is the second append-only table sharing the hash chain
    # with prescriptions — same DB-role hardening applies.
    op.execute("REVOKE UPDATE, DELETE ON admin_actions FROM app_insert_only")


def downgrade() -> None:
    op.drop_table("admin_actions")
    op.drop_table("admins")
    op.drop_table("patient_flags")
    op.drop_table("flagged_candidates")
    op.drop_table("token_consumptions")
    op.drop_table("pharmacists")
    op.drop_table("pharmacies")
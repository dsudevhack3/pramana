"""initial schema — doctors, identity, clinics, organizations, prescriptions, patients

Revision ID: 0001
Revises:
Create Date: 2026-01-15
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "organizations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("registration_number", sa.String(100), nullable=False),
        sa.Column("registration_type", sa.String(30), nullable=False),
        sa.Column("address_raw", sa.String(500), nullable=False),
        sa.Column("latitude", sa.Float, nullable=False),
        sa.Column("longitude", sa.Float, nullable=False),
        sa.Column("maps_place_id", sa.String(255), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "doctors",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(255), unique=True, nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("license_number", sa.String(100), nullable=False),
        sa.Column("council_name", sa.String(255), nullable=False),
        sa.Column("license_status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("signing_public_key", sa.String(255), nullable=True),
        sa.Column("platform_status", sa.String(20), nullable=False, server_default="not_registered"),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("organizations.id"), nullable=True),
        sa.Column("is_suspended", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "identity_records",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("doctor_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("doctors.id"), unique=True, nullable=False),
        sa.Column("masked_aadhaar", sa.String(20), nullable=False),
        sa.Column("provider_reference_token", sa.String(255), nullable=False),
        sa.Column("provider_name", sa.String(50), nullable=False),
        sa.Column("verified_name", sa.String(255), nullable=False),
        sa.Column("verified_dob", sa.String(10), nullable=False),
        sa.Column("consent_given_at", sa.String(30), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "license_status_history",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("doctor_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("doctors.id"), nullable=False),
        sa.Column("previous_status", sa.String(30), nullable=False),
        sa.Column("new_status", sa.String(30), nullable=False),
        sa.Column("source", sa.String(100), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "clinics",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("doctor_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("doctors.id"), unique=True, nullable=False),
        sa.Column("address_raw", sa.String(500), nullable=False),
        sa.Column("latitude", sa.Float, nullable=False),
        sa.Column("longitude", sa.Float, nullable=False),
        sa.Column("maps_place_id", sa.String(255), nullable=False),
        sa.Column("clinical_establishment_reg_number", sa.String(100), nullable=True),
        sa.Column("reg_number_cross_checked", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("geotagged_photo_url", sa.String(500), nullable=False),
        sa.Column("photo_lat", sa.Float, nullable=False),
        sa.Column("photo_lng", sa.Float, nullable=False),
        sa.Column("is_verified", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "organization_admins",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("organizations.id"), nullable=False),
        sa.Column("email", sa.String(255), unique=True, nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "organization_invites",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("organizations.id"), nullable=False),
        sa.Column("doctor_email", sa.String(255), nullable=False),
        sa.Column("doctor_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("doctors.id"), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("token", sa.String(255), unique=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "platform_registrations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("doctor_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("doctors.id"), unique=True, nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "patients",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("phone", sa.String(20), unique=True, nullable=False),
        sa.Column("dob", sa.String(10), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "prescriptions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("doctor_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("doctors.id"), nullable=False),
        sa.Column("patient_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("patients.id"), nullable=False),
        sa.Column("payload", postgresql.JSONB, nullable=False),
        sa.Column("idempotency_key", sa.String(64), unique=True, nullable=False),
        sa.Column("doctor_license_status_at_signing", sa.String(30), nullable=False),
        sa.Column("doctor_platform_status_at_signing", sa.String(30), nullable=False),
        sa.Column("doctor_org_id_at_signing", sa.String(64), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="active"),
        sa.Column("previous_version_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("prescriptions.id"), nullable=True),
        sa.Column("token", sa.String(64), unique=True, nullable=False),
        sa.Column("record_hash", sa.String(64), unique=True, nullable=False),
        sa.Column("previous_record_hash", sa.String(64), nullable=True),
        sa.Column("signature", sa.String(512), nullable=False),
        sa.Column("signer_public_key_ref", sa.String(255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_prescriptions_record_hash", "prescriptions", ["record_hash"])
    op.create_index("ix_prescriptions_previous_record_hash", "prescriptions", ["previous_record_hash"])

    op.create_table(
        "prescription_line_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("prescription_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("prescriptions.id"), nullable=False),
        sa.Column("drug_name", sa.String(255), nullable=False),
        sa.Column("drug_class", sa.String(100), nullable=True),
        sa.Column("is_controlled_substance", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("dosage", sa.String(100), nullable=False),
        sa.Column("quantity", sa.Integer, nullable=False),
        sa.Column("frequency", sa.String(100), nullable=False),
        sa.Column("duration_days", sa.Integer, nullable=False),
    )

    op.create_table(
        "prescription_amendments",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("original_prescription_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("prescriptions.id"), nullable=False),
        sa.Column("new_prescription_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("prescriptions.id"), nullable=False),
        sa.Column("reason", sa.String(1000), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "audit_entries",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("actor_id", sa.String(64), nullable=True),
        sa.Column("actor_role", sa.String(30), nullable=True),
        sa.Column("method", sa.String(10), nullable=False),
        sa.Column("path", sa.String(500), nullable=False),
        sa.Column("status_code", sa.Integer, nullable=False),
        sa.Column("request_id", sa.String(64), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    # DB-role hardening: app role gets INSERT/SELECT only on prescriptions
    # and prescription_amendments — no UPDATE, no DELETE. Adjust role name
    # to match settings.DB_APP_ROLE_NAME in each environment.
    op.execute("REVOKE UPDATE, DELETE ON prescriptions FROM app_insert_only")
    op.execute("REVOKE UPDATE, DELETE ON prescription_amendments FROM app_insert_only")


def downgrade() -> None:
    op.drop_table("audit_entries")
    op.drop_table("prescription_amendments")
    op.drop_table("prescription_line_items")
    op.drop_table("prescriptions")
    op.drop_table("patients")
    op.drop_table("platform_registrations")
    op.drop_table("organization_invites")
    op.drop_table("organization_admins")
    op.drop_table("clinics")
    op.drop_table("license_status_history")
    op.drop_table("identity_records")
    op.drop_table("doctors")
    op.drop_table("organizations")
import aiosmtplib
from email.message import EmailMessage
from pathlib import Path

from src.config.settings import get_settings

settings = get_settings()
TEMPLATES_DIR = Path(__file__).parent / "templates"


async def send_email(to: str, subject: str, template_name: str, context: dict) -> None:
    template = (TEMPLATES_DIR / template_name).read_text()
    body = template.format(**context)

    message = EmailMessage()
    message["From"] = settings.SMTP_USER
    message["To"] = to
    message["Subject"] = subject
    message.set_content(body, subtype="html")

    await aiosmtplib.send(
        message, hostname=settings.SMTP_HOST, port=settings.SMTP_PORT,
        username=settings.SMTP_USER, password=settings.SMTP_PASSWORD, start_tls=True,
    )


async def send_doctor_approved(to: str, doctor_name: str) -> None:
    await send_email(to, "You're approved!", "doctor_approved.html", {"doctor_name": doctor_name})


async def send_doctor_rejected(to: str, doctor_name: str, reason: str) -> None:
    await send_email(to, "Application update", "doctor_rejected.html", {"doctor_name": doctor_name, "reason": reason})


async def send_license_revoked_alert(to: str, doctor_name: str) -> None:
    await send_email(to, "License status change", "license_revoked_alert.html", {"doctor_name": doctor_name})


async def send_pharmacy_approved(to: str, pharmacy_name: str) -> None:
    await send_email(to, "Pharmacy approved", "pharmacy_approved.html", {"pharmacy_name": pharmacy_name})


async def send_account_suspended_alert(
    to: str, entity_name: str, rule_name: str, evidence_summary: str, admin_action_id: str
) -> None:
    """
    Includes the evidence reference, per Flow 5's explicit appeal-enablement
    requirement — the affected doctor/pharmacy sees the exact reason.
    """
    await send_email(
        to, "Account suspended", "account_suspended_alert.html",
        {
            "entity_name": entity_name, "rule_name": rule_name,
            "evidence_summary": evidence_summary, "admin_action_id": admin_action_id,
        },
    )
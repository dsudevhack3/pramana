import pytest
from unittest.mock import AsyncMock, patch

from src.modules.notifications.services.email_service import send_account_suspended_alert


@pytest.mark.asyncio
async def test_send_account_suspended_alert_includes_evidence():
    with patch("src.modules.notifications.services.email_service.aiosmtplib.send", new=AsyncMock()) as mock_send:
        await send_account_suspended_alert(
            to="doc@example.com", entity_name="Dr. Test", rule_name="signing_pace",
            evidence_summary="12 scripts in 45 minutes", admin_action_id="action-uuid-1",
        )
        mock_send.assert_awaited_once()
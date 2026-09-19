import httpx

from src.config.settings import get_settings

settings = get_settings()


async def send_sms(phone: str, message: str) -> None:
    async with httpx.AsyncClient() as client:
        await client.post(
            "https://api.smsprovider.example.com/v1/send",
            headers={"Authorization": f"Bearer {settings.SMS_PROVIDER_API_KEY}"},
            json={"to": phone, "message": message},
        )


async def send_otp_sms(phone: str, otp: str) -> None:
    await send_sms(phone, f"Your verification code is {otp}. Valid for 5 minutes.")
def mask_aadhaar_number(aadhaar: str) -> str:
    return f"XXXX-XXXX-{aadhaar[-4:]}"


def mask_phone(phone: str) -> str:
    return f"{'*' * (len(phone) - 4)}{phone[-4:]}"


def mask_email(email: str) -> str:
    local, _, domain = email.partition("@")
    if len(local) <= 2:
        return f"{local[0]}*@{domain}"
    return f"{local[0]}{'*' * (len(local) - 2)}{local[-1]}@{domain}"
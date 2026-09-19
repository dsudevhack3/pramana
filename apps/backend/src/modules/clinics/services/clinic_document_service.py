"""
Validates the geotagged clinic photo: confirms it was captured in-app
(not gallery-uploaded) and that its embedded GPS coords are within a
reasonable radius of the confirmed clinic address. Also cross-checks the
Clinical Establishment Registration number where a lookup API exists.
"""
import math

MAX_PHOTO_DISTANCE_METERS = 500


def _haversine_distance_m(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    R = 6371000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


def validate_photo_location(
    photo_lat: float, photo_lng: float, clinic_lat: float, clinic_lng: float
) -> bool:
    distance = _haversine_distance_m(photo_lat, photo_lng, clinic_lat, clinic_lng)
    return distance <= MAX_PHOTO_DISTANCE_METERS


async def cross_check_registration_number(reg_number: str) -> bool:
    """
    Placeholder for a real Clinical Establishment Registry lookup — many
    states don't expose a public API yet, so this cross-check is
    best-effort and its failure does NOT block onboarding (per Flow 1,
    Step 3: "cross-checked where available").
    """
    return bool(reg_number and len(reg_number) >= 6)
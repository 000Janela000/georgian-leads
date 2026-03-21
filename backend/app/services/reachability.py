"""Reachability tier computation for leads."""


def compute_tier(facebook_url: str | None, phone: str | None, email: str | None) -> str:
    """
    Hot: has Facebook page (can message directly)
    Warm: has phone or email but no Facebook
    Cold: no contact info at all
    """
    if facebook_url:
        return "hot"
    if phone or email:
        return "warm"
    return "cold"

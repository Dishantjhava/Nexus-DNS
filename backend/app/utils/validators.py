"""Low-level DNS validation helpers.

These are pure functions with no schema/model imports so they can be
called from anywhere without circular-import risk.
"""

import ipaddress
import re

# RFC 952 / 1123 hostname label: 1-63 alphanumeric/hyphens, no leading/trailing hyphen.
# Full name: dot-separated labels, optional trailing dot, max 253 chars.
_HOSTNAME_RE = re.compile(
    r"^(?!-)[A-Za-z0-9-]{1,63}(?<!-)(\.[A-Za-z0-9-]{1,63})*\.?$"
)


def is_valid_hostname(value: str) -> bool:
    """Return True if *value* is a syntactically valid DNS hostname."""
    return bool(_HOSTNAME_RE.match(value)) and len(value) <= 253


def is_valid_ipv4(value: str) -> bool:
    """Return True if *value* is a valid IPv4 address."""
    try:
        ipaddress.IPv4Address(value)
        return True
    except ValueError:
        return False


def is_valid_ipv6(value: str) -> bool:
    """Return True if *value* is a valid IPv6 address."""
    try:
        ipaddress.IPv6Address(value)
        return True
    except ValueError:
        return False

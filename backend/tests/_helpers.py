"""Shared helpers for the backend test suite."""
import sys


def mint_admin_token() -> str:
    """Return a valid admin JWT, minted directly via the backend's own signer.

    /api/admin/login no longer returns the token in the response body (it sets
    an HttpOnly session cookie instead, for XSS hardening). Bearer-header auth
    is still fully supported by require_admin and is CSRF-exempt, so tests
    mint a real token locally and keep using `Authorization: Bearer <tok>`.
    """
    if "/app/backend" not in sys.path:
        sys.path.insert(0, "/app/backend")
    from core import create_admin_token
    return create_admin_token()

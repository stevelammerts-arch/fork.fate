"""Shared pytest fixtures / env bootstrap for the Fork·Fate backend test suite.

Loads `/app/backend/.env` up-front so every test module can rely on
`os.environ["ADMIN_PASSWORD"]` and other credentials without duplicating the
value inline. Hardcoded secrets in test files were flagged by the security
review; centralising here keeps the source of truth in `.env` (git-ignored).
"""
import os
import pytest
from dotenv import load_dotenv

load_dotenv("/app/backend/.env")


@pytest.fixture(scope="session")
def admin_password() -> str:
    pw = os.environ.get("ADMIN_PASSWORD")
    if not pw:
        pytest.skip("ADMIN_PASSWORD not set in backend/.env")
    return pw

"""Focused backend assertions for sponsor pricing constants and PayPal plan bodies."""

import sys

sys.path.insert(0, "/app/backend")

from core import SPONSOR_PRICE, SPONSOR_PRICE_ANNUAL  # noqa: E402
from routes.sponsors import _plan_spec  # noqa: E402


def fixed_prices(plan):
    out = []
    for cycle in plan["billing_cycles"]:
        out.append(cycle["pricing_scheme"]["fixed_price"]["value"])
    return out


def main():
    assert SPONSOR_PRICE == "19.00", SPONSOR_PRICE
    assert SPONSOR_PRICE_ANNUAL == "190.00", SPONSOR_PRICE_ANNUAL

    monthly = _plan_spec("monthly", "PROD_TEST")
    yearly = _plan_spec("yearly", "PROD_TEST")

    assert fixed_prices(monthly) == ["0", "19.00"], fixed_prices(monthly)
    assert "$19/mo" in monthly["name"], monthly["name"]
    assert "then $19/month" in monthly["description"], monthly["description"]

    assert fixed_prices(yearly) == ["190.00"], fixed_prices(yearly)
    assert "$190/yr" in yearly["name"], yearly["name"]
    assert "billed $190/year" in yearly["description"], yearly["description"]

    print("Backend sponsor pricing constants and PayPal plan bodies use 19.00/190.00")


if __name__ == "__main__":
    main()
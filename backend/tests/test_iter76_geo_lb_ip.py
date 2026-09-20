"""Regression tests for the 'everyone is in Kansas City' geo bug (iter 76).

Behind the Google Cloud external LB, X-Forwarded-For arrives as
"<client>,<cloudflare-edge>,<lb-ip>". client_ip() must return the real client:
the rightmost entry is the LB's own public address and Cloudflare edge hops are
infrastructure, so both must be skipped — otherwise every visitor collapses onto
the LB IP (geolocated to the LB's data center) and shares one rate-limit bucket.

These are unit tests against core.client_ip with a mocked Request (trusted
loopback peer), so they run without the ingress in front.
"""
from types import SimpleNamespace

from core import client_ip


def _req(xff=None, peer="127.0.0.1", extra=None):
    headers = dict(extra or {})
    if xff is not None:
        headers["x-forwarded-for"] = xff
    return SimpleNamespace(headers=headers, client=SimpleNamespace(host=peer))


class TestLbIpSkipped:
    def test_prod_chain_client_cf_lb(self):
        # Real prod shape: client, Cloudflare edge, Google LB.
        assert client_ip(_req("104.198.214.223,172.70.131.150,35.186.245.91")) == "104.198.214.223"

    def test_direct_chain_client_lb(self):
        # Custom domain pointed straight at the LB (no Cloudflare).
        assert client_ip(_req("93.184.216.34,35.186.245.91")) == "93.184.216.34"

    def test_cf_connecting_ip_wins_over_xff(self):
        r = _req("1.2.3.4,35.186.245.91", extra={"cf-connecting-ip": "198.51.100.9"})
        assert client_ip(r) == "198.51.100.9"

    def test_single_entry_falls_back_to_peer(self):
        # Rightmost is always infra-appended; with nothing left, use the TCP peer.
        assert client_ip(_req("35.186.245.91")) == "127.0.0.1"

    def test_legacy_private_hops_still_skipped(self):
        # Pre-existing semantics (test_iter8): rightmost dropped, privates skipped.
        assert client_ip(_req("1.1.1.1, 9.9.9.9, 10.0.0.5, 127.0.0.1")) == "9.9.9.9"

    def test_untrusted_public_peer_ignores_headers(self):
        # NB: TEST-NET ranges count as is_private in Python 3.11+, so use a
        # genuinely public peer here.
        r = _req("8.8.8.8,35.186.245.91", peer="93.184.216.34")
        assert client_ip(r) == "93.184.216.34"

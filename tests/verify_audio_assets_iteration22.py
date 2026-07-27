#!/usr/bin/env python3
"""Focused asset verification for Fork.Fate theme audio restoration."""
import hashlib
import json
import os
from pathlib import Path
from urllib import request, error

BASE_DIR = Path('/app/frontend/public')
FRONTEND_ENV = Path('/app/frontend/.env')

def env_url():
    for line in FRONTEND_ENV.read_text().splitlines():
        if line.startswith('REACT_APP_BACKEND_URL='):
            return line.split('=',1)[1].strip().rstrip('/')
    raise RuntimeError('REACT_APP_BACKEND_URL not found')

BASE_URL = env_url()
EXPECTED = {
    'reveal-cyber-radio.wav': {'size': 2352044, 'sha_prefix': '8d4b346e16e6'},
    'shuffle-fall.wav': {'size': 1323044, 'sha_prefix': 'e7e0aba0e4e3'},
    'reveal-tada.wav': {'size': 90890, 'sha_prefix': '1a538e9360f0'},
    'shuffle-dragon.mp3': {'size': 607712, 'sha_prefix': None},
    'shuffle-seagulls.wav': {'size': 1058444, 'sha_prefix': None},
}
MISSING = ['shuffle-dragon.wav', 'card-riffle.wav']

def sha_prefix(data):
    return hashlib.sha256(data).hexdigest()[:16]

def fetch(path):
    url = f"{BASE_URL}/{path}"
    try:
        req = request.Request(url, headers={'User-Agent': 'Mozilla/5.0 QA Audio Test', 'Accept': '*/*'})
        with request.urlopen(req, timeout=20) as resp:
            body = resp.read()
            return {'url': url, 'status': resp.status, 'content_length_header': resp.headers.get('Content-Length'), 'bytes': len(body), 'sha256_prefix': sha_prefix(body)}
    except error.HTTPError as e:
        return {'url': url, 'status': e.code, 'content_length_header': e.headers.get('Content-Length'), 'bytes': 0, 'sha256_prefix': None}

results = {'base_url': BASE_URL, 'local': {}, 'http': {}, 'pass': True, 'failures': []}

for name, exp in EXPECTED.items():
    p = BASE_DIR / name
    if not p.exists():
        results['local'][name] = {'exists': False}
        results['pass'] = False
        results['failures'].append(f'local missing {name}')
    else:
        data = p.read_bytes()
        got = {'exists': True, 'bytes': len(data), 'sha256_prefix': sha_prefix(data)}
        got['size_ok'] = got['bytes'] == exp['size']
        got['sha_ok'] = exp['sha_prefix'] is None or got['sha256_prefix'].startswith(exp['sha_prefix'])
        results['local'][name] = got
        if not got['size_ok'] or not got['sha_ok']:
            results['pass'] = False
            results['failures'].append(f'local mismatch {name}: {got}')

for name in MISSING:
    exists = (BASE_DIR / name).exists()
    results['local'][name] = {'exists': exists, 'expected_missing': True}
    if exists:
        results['pass'] = False
        results['failures'].append(f'local should be missing {name}')

for name, exp in EXPECTED.items():
    got = fetch(name)
    got['status_ok'] = got['status'] == 200
    got['size_ok'] = got['bytes'] == exp['size']
    got['sha_ok'] = exp['sha_prefix'] is None or (got['sha256_prefix'] or '').startswith(exp['sha_prefix'])
    results['http'][name] = got
    if not got['status_ok'] or not got['size_ok'] or not got['sha_ok']:
        results['pass'] = False
        results['failures'].append(f'http mismatch {name}: {got}')

for name in MISSING:
    got = fetch(name)
    got['status_ok'] = got['status'] == 404
    results['http'][name] = got
    if got['status'] != 404:
        results['pass'] = False
        results['failures'].append(f'http should 404 {name}: {got}')

out = Path('/app/test_reports/audio_assets_iteration22_results.json')
out.write_text(json.dumps(results, indent=2))
print(json.dumps(results, indent=2))
raise SystemExit(0 if results['pass'] else 1)

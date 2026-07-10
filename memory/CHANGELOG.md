# Fork·Fate — Changelog

## 2026-06-10 — Session: reward reveal, thunder, crawl-first-stop, security, passkey, iOS install

### Crawl reward reveal (USER APPROVED)
- Replaced the cartoony CSS "wall of fire" with: a red radial burst flash + the golden-gradient "Congratulations" surging forward out of darkness (scale 0.28→1, blur 14→0). Fire CSS removed; kept `.flame-text` golden gradient. `CrawlBadgeDialog.jsx` + `index.css`.
- Thunder clap (`reveal-thunder-v4.mp3`) fires ~350ms into the badge cinematic, synced to the shocked reaper's face jolt; respects `ff_muted`.

### Crawl reveal card = first stop (USER REQUEST, tested iter51)
- `homeConstants.js`: shared `orderCrawlRoute` + `crawlHaversine` helpers (dedup from PubCrawlDialog).
- `Home.jsx` `dealCrawl`/`doSearch`: pick+order stops up front, land `runCrawlShuffle` on `ordered[0]`, pass `initialStops` to the dialog. `PubCrawlDialog.jsx` uses `initialStops` when provided so the reveal card == stop #1.

### Security hardening (USER APPROVED, tested iter51/52)
- JWT now carries `iss=fork-fate` + `aud=fork-fate-admin`; `require_admin` validates issuer/audience (require exp/iss/aud). Pre-change tokens rejected.
- Global admin-login throttle (`admin_login_throttle`, 30/60s across all IPs) on `/admin/login`, complementing per-IP limit.
- CORS restricted via `allow_origin_regex` to `*.fork-fate.com` + `*.emergentagent.com` (server.py); `*` no longer used.

### Admin passkey / WebAuthn login (NEW, tested iter52 with CDP virtual authenticator)
- Backend `routes/passkey.py` (webauthn 3.0.0): register-options/verify (JWT-gated), status, delete, auth available/login-options/login-verify (issues admin JWT). Stored in Mongo `admin_auth` doc `_id="admin"`.
- Origin/RP_ID derived per-request; `_request_origin` PREFERS `x-forwarded-proto`+`x-forwarded-host` (real external host) because the Emergent ingress rewrites the browser Origin to an internal `emergentcf.cloud` host. WebAuthn's signed clientDataJSON.origin is the real cross-origin defense.
- Frontend `Admin.jsx`: "Add passkey"/"Passkey on" in header, "Unlock with fingerprint / Face ID" on login screen (shown when `/auth/passkey/available`). @simplewebauthn/browser v13 `{optionsJSON}` API.
- Verify handlers scrub raw exception detail (log server-side, generic client message).

### iPhone install UX (NEW, verified via screenshot)
- `InstallAppButton.jsx`: on iOS, opens a step-by-step popup (Share → Add to Home Screen → Add) instead of a toast; detects non-Safari iOS browsers and tells the user to open in Safari.
- Added 180×180 `apple-touch-icon.png` (black bg composite) + explicit `<link>` in index.html.

### Cache-buster
- FF_BUILD bumped through 2026.06-49. Bump on each UI ship.

### Reveal skeleton-hand — FINAL tuning (user-approved, deployed)
- After several iterations the user reverted to the ORIGINAL first version and asked to ONLY drag the wrist down.
- FINAL values in `Home.jsx` ShufflingDeck: hand `w-[310px]`, overlay transform `translate(-50%, calc(-50% + 48px))`. CardFront is the ORIGINAL (photo `inset-[13px]`, thin red borders `inset-2 /70` + `inset-[10px] /25`, `bg-[#0E0E0E]` class). Card container `bg-[#0E0E0E]` class. DO NOT widen the hand or change the card frame — the user rejected the bolder-frame + wider-hand experiments.
- Recurring gotcha this session: the user repeatedly saw STALE builds (mobile/PWA + production cache). Always confirm environment (preview vs fork-fate.com) and advise an incognito/fresh load before iterating on visuals.

### Guardrails
- LIVE PAYPAL + PRODUCTION at fork-fate.com. Preview changes are preview-only until redeploy.
- Google Places capped 160/day; only the winning reveal card uses a billed Google photo.

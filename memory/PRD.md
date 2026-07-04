# Fork·Fate — Local Restaurant Roulette

## Original Problem Statement
Local Restaurant roulette app.

## User Choices
- Restaurant sourcing: Pre-seeded demo list + user can manually add restaurants
- Roulette experience: Simple randomized card reveal / shuffle (no spinning wheel)
- Filters: cuisine, price, distance
- Auth: none (no login), keep it simple
- Theme: decided by design agent → earthy editorial light theme (Cormorant Garamond + Manrope)

## Architecture
- Backend: FastAPI + MongoDB (motor). UUID string ids, `/api` prefix. Seeds 12 restaurants on startup.
- Frontend: React 19 + Tailwind + shadcn/ui + Framer Motion. Single Home page.
- No third-party integrations.

## Core Requirements (static)
- Filterable random restaurant picker with shuffle-to-reveal animation
- Browse full restaurant grid
- Add / delete restaurants (curate the pool)

## Implemented (2026-06)
- Backend endpoints: GET/POST/DELETE /api/restaurants, GET /api/cuisines, POST /api/spin (filter-aware random)
- 12 seeded restaurants across cuisines/prices/distances
- Home: hero, filter pills (cuisine/price/distance), "Spin the deck" with shuffle→reveal result card, live "spots in play" count, full deck grid, add-spot dialog, delete on card hover, reset/clear
- Tested end-to-end: backend 100% (8 pytest cases), frontend 100%

## Backlog
- P1: Persist filters / share a result link
- P2: Favorites & spin history (would need light client storage)
- P2: Map view / real location-based distance
- P2: Edit existing restaurant

## Next Tasks
- Gather user feedback on initial MVP

#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================
## Iteration 10 — Final UI/category tweaks verification (main agent)

frontend:
  - task: "New chips: Safari (explore), Children's Museums (explore), Plant Shop + Craft Store (shops)"
    implemented: true
    working: "NA"
    file: "/app/frontend/src/pages/homeConstants.js"
    needs_retesting: true
  - task: "Skip intro button contrast (pill w/ border, darker text)"
    implemented: true
    working: "NA"
    file: "/app/frontend/src/components/GuidedFlow.jsx"
    needs_retesting: true
  - task: "Order/Delivery button must NOT show on non-food tiles (shops/explore/stay/fuel)"
    implemented: true
    working: "NA"
    file: "/app/frontend/src/components/RestaurantCard.jsx, /app/frontend/src/components/home/RevealStage.jsx"
    needs_retesting: true

backend:
  - task: "Google Places results stamped with req.category"
    implemented: true
    working: "NA"
    file: "/app/backend/routes/places.py"
    needs_retesting: true

agent_communication:
    -agent: "main"
    -message: "Applied final tweak batch (chips, skip contrast, category stamping). Needs verification only; no new features."

## Iteration 12 — Fate Passport (Phase 1) + chip/category additions

backend:
  - task: "Passports API: POST /api/passports, GET /api/passports/{code}, POST /{code}/stamp (gps radius 0.4mi + manual), DELETE /{code}/stamp/{stop_id}"
    implemented: true
    working: "NA"
    file: "/app/backend/routes/passports.py, /app/backend/models.py, /app/backend/server.py"
    needs_retesting: true
  - task: "Per-chip Google queries + relevance guard (Breakfast+Filipino no longer returns Subway); Explore/Fuel never return food venues"
    implemented: true
    working: "NA"
    file: "/app/backend/routes/places.py"
    needs_retesting: true

frontend:
  - task: "Passport mode toggle + stop-count picker (3-10) on Home; creates passport and routes to /p/:code; My Passports links"
    implemented: true
    working: "NA"
    file: "/app/frontend/src/pages/Home.jsx, /app/frontend/src/lib/passports.js"
    needs_retesting: true
  - task: "Passport page: progress bar, GPS stamp / manual stamp / undo, completion banner, share"
    implemented: true
    working: "NA"
    file: "/app/frontend/src/pages/Passport.jsx, /app/frontend/src/App.js"
    needs_retesting: true
  - task: "Fuel tab renamed 'Fuel & Go' + grouped chips; new chips across Explore/Shops/Desserts/Food"
    implemented: true
    working: "NA"
    file: "/app/frontend/src/pages/homeConstants.js"
    needs_retesting: true

agent_communication:
    -agent: "main"
    -message: "Phase 1 Fate Passport built and smoke-tested manually (created passport M7V3DF, manual stamp worked). Needs full verification incl. GPS-too-far rejection and completion."

## Iteration 13 — Bug: buzzing during shuffle on Summer theme (mobile)

frontend:
  - task: "Summer shuffle bed /shuffle-seagulls.wav buzzed on phone speakers"
    implemented: true
    working: "NA"
    file: "/app/frontend/public/shuffle-seagulls.wav (regenerated via /app/scripts/gen_summer_shuffle.py)"
    needs_retesting: true
    status_history:
      - "ROOT CAUSE: the old asset was effectively a sustained ~1.35 kHz sine drone (spectral peak/median tonality = 6813 over a 2s window) — a pure tone reads as a buzz on small speakers."
      - "FIX: regenerated as broadband surf noise (120Hz-5kHz, slow swells) + 7 short gliding gull calls with vibrato and fast decay; 90Hz high-pass, 0.6s crossfade loop, peak 0.72. New tonality = 17."

agent_communication:
    -agent: "main"
    -message: "Replaced the summer shuffle audio asset. Needs verification that the file serves, decodes, has no sustained tone, and that the summer-theme shuffle still plays it with no console errors."

## Iteration 14 — UX bug: special modes required scrolling up to Deal / radius / location

frontend:
  - task: "Each special mode (Passport / Group / Crawl) is now self-contained: its own numbered guide, ZIP + Use my location, radius slider and its own Deal button inside the panel; panel auto-scrolls into view; the main Deal button is hidden while a mode is active"
    implemented: true
    working: "NA"
    file: "/app/frontend/src/components/home/ModeSetup.jsx (new), /app/frontend/src/pages/Home.jsx"
    needs_retesting: true
    status_history:
      - "USER REPORT: 'When doing passport, you have to scroll up to deal, then scroll up farther for radius and location. Not very clear to users and may be the same for other crawls and group search. They should have a separate guide each.'"
      - "FIX: new ModeSetup component; passport + group panels get guide/location/radius/CTA; crawl panel gets a guide + its own radius (it already had ZIP A/B and its own deal button); main spin button hidden when crawlMode || passportMode || groupMode; effect scrolls the active panel into view."

agent_communication:
    -agent: "main"
    -message: "Verify no mode requires scrolling above the panel to deal, and that all three modes still function end-to-end."

## Iteration 15 — Bug: unclear what category a Passport is dealt from

frontend:
  - task: "Passport (and Group) panels now contain their own 8-category picker + a 'Dealing from <Category> · <types>' summary line"
    implemented: true
    working: "NA"
    file: "/app/frontend/src/pages/Home.jsx"
    needs_retesting: true
    status_history:
      - "USER REPORT: 'Add pick a category to the passport. I ran what I thought was a camping run but restaurants popped up. Unclear what is being chosen.'"
      - "ROOT CAUSE: the category tab grid lives ABOVE the mode panel, so with the panel scrolled into view the active category (default Food) was off-screen and never re-confirmed."
      - "FIX: MODE_TABS extracted to one array; passport-category-picker + group-category-picker render the same 8 categories inside their panels (active = green/red), plus a live summary line showing the category and selected type chips. Guide step 1 now names Stay = camping, Explore = parks/trails."

agent_communication:
    -agent: "main"
    -message: "Verify a Stay/camping passport actually returns campgrounds (not restaurants) and the summary reflects the chosen category."

## Iteration 16 — batch: audio artifacts (all themes), placeholder photos, filter collapse, Double or Nothing, passport delete, extra steam jet

frontend:
  - task: "Themed shuffle beds regenerated artifact-free (buzz/zap reports on summer, cyber, dragon)"
    implemented: true
    working: "NA"
    file: "/app/scripts/gen_theme_beds.py, /app/scripts/audit_audio.py, /app/frontend/public/shuffle-*.wav, reveal-cyber-radio.wav; Home.jsx SHUFFLE_LOOPS"
    needs_retesting: true
    status_history:
      - "ROOT CAUSES via audit: sustained pure tones (summer 6813, steam 2139, dragon 1137 tonality), near-Nyquist aliasing energy (cyber ~22kHz), and loop-seam discontinuities."
      - "FIX: all beds are noise-dominant, FFT band-limited 70Hz-9kHz, crossfade-looped and faded to zero at both ends. fantasy now uses /shuffle-dragon.wav (was .mp3). SHUFFLE_LOOPS constant replaces two duplicated theme->audio maps."
  - task: "Results showed generic hiking placeholder images instead of the real Google photo (user: 'searched splash pads, other choices all had hiking backgrounds')"
    implemented: true
    working: "NA"
    file: "homeConstants.js cardImage(), RevealStage.jsx, RestaurantCard.jsx, ShufflingDeck.jsx, GroupVote.jsx, FavoritesDrawer.jsx"
    needs_retesting: true
  - task: "Chip/filter section collapses after a deal (user request)"
    implemented: true
    working: "NA"
    file: "Home.jsx (filters-toggle)"
    needs_retesting: true
  - task: "Phase 2 — Double or Nothing: one reroll, result is final (locks out re-shuffle + alternatives)"
    implemented: true
    working: "NA"
    file: "Home.jsx (doubleOrNothing, locked), RevealStage.jsx (double-or-nothing-button, locked-badge, locked-note)"
    needs_retesting: true
  - task: "Users can delete a passport"
    implemented: true
    working: "NA"
    file: "backend/routes/passports.py (DELETE /passports/{code}), Passport.jsx (passport-delete), lib/passports.js (forgetPassport)"
    needs_retesting: true
  - task: "Extra steam cloud from the lower pipe (steampunk theme)"
    implemented: true
    working: "NA"
    file: "ThemeScenes.jsx (STEAM_JET_LOW, data-testid steam-jet-low)"
    needs_retesting: true

agent_communication:
    -agent: "main"
    -message: "Large batch. Audio must be verified numerically with /app/scripts/audit_audio.py thresholds. Photo fix: every dealt card/alternative/nearby tile must use photo_url when present."

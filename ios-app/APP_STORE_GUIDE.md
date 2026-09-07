# Fork-Fate — Apple App Store Release Guide

Your Apple Developer account: **Team ID 29LSDGAHDH** (Individual, active until July 2027).

## What's already prepared (in /app/ios-app)

- Capacitor 7 iOS shell wrapping **https://fork-fate.com** (same always-fresh model as
  the Android TWA — web deploys reach iOS users instantly, no re-review needed)
- Bundle ID: `com.forkfate.app` · App name: `Fork-Fate`
- App icon (1024x1024, alpha flattened — Apple rejects icons with transparency)
- Splash screen (2732x2732, dark realm background + crest, all 3 scale slots)
- Info.plist permission strings:
  - `NSLocationWhenInUseUsageDescription` — required or the nearby-restaurant search dies
  - `NSMotionUsageDescription` — required for shake-to-reshuffle motion prompt
  - `ITSAppUsesNonExemptEncryption=false` — skips the export-compliance question each upload
- Plugins installed: Haptics, Share, StatusBar, SplashScreen (native bridge is injected
  into the site when it runs inside this shell — `window.Capacitor` will exist)

## Path A — You have a Mac

1. Get this repo on the Mac (use Emergent's **Save to GitHub**, then clone).
2. Install Xcode from the App Store (free, big download), plus CocoaPods:
   `sudo gem install cocoapods`
3. In Terminal:
   ```bash
   cd ios-app
   npm install            # or yarn
   npx cap sync ios
   npx cap open ios       # opens Xcode
   ```
4. In Xcode, select the **App** target → **Signing & Capabilities**:
   - Check "Automatically manage signing"
   - Team: select your team (29LSDGAHDH) — sign in with your Apple ID under
     Xcode → Settings → Accounts first
5. Top bar: select **Any iOS Device (arm64)** → menu **Product → Archive**
6. When the Organizer opens: **Distribute App → App Store Connect → Upload**
7. First run it on your own iPhone (select your phone as the target, press Run)
   to sanity-check: location prompt, shake enable pill, card flips, audio.

## Path B — No Mac (cloud build)

Use **Codemagic** (codemagic.io — free tier includes Mac build minutes):
1. Push the repo to GitHub (Save to GitHub button)
2. Sign up at codemagic.io with that GitHub account, add the repo
3. Project type: Capacitor. Set project path to `ios-app`
4. Connect App Store Connect: App Store Connect → Users and Access → Integrations
   → **App Store Connect API key** → create one with App Manager role, download the
   .p8 file, and paste key ID / issuer ID / .p8 into Codemagic's "App Store Connect" integration
5. Enable "iOS code signing — automatic" (Codemagic creates the certs for you)
6. Build → it uploads the .ipa straight to App Store Connect/TestFlight

## App Store Connect setup (either path)

1. appstoreconnect.apple.com → **Apps → + → New App**
   - Platform iOS · Name **Fork-Fate** (or "Fork-Fate — Restaurant Roulette" if taken)
   - Bundle ID: register `com.forkfate.app` first at developer.apple.com →
     Identifiers → + → App IDs (capabilities: none needed beyond defaults)
   - SKU: `forkfate-ios-1`
2. **TestFlight first**: after the upload appears, add yourself as an internal tester —
   install via the TestFlight app on your iPhone. Shake it down for a day before submitting.

### Listing copy (paste-ready)

- **Subtitle** (30 chars): `Let fate pick your next meal`
- **Promotional text** (170 chars):
  `Can't decide where to eat? Deal a card and let fate choose. 11 immersive realms,
  seasonal takeovers, hidden secrets, duels with friends, and pub crawls.`
- **Description**: reuse the Google Play long description (in /app/ForkFate_Google_Play_Copy.txt),
  it fits Apple's 4000-char limit
- **Keywords** (100 chars, comma-separated, no spaces):
  `restaurant,roulette,where to eat,food,picker,random,dinner,decide,nearby,roll,spin,date night`
- **Support URL**: https://fork-fate.com/support (or /legal)
- **Category**: Food & Drink (secondary: Lifestyle)
- **Age rating questionnaire**: everything "No" → lands at 4+ (the Reaper theme is
  cartoon/fantasy; if you answer "Infrequent/Mild Horror/Fear Themes" it becomes 9+ — either is fine)

### Screenshots (required)

- **6.9" (iPhone 16 Pro Max size), 1320x2868**: 3-10 screenshots — REQUIRED
- **6.5" (1284x2778 or 1242x2688)**: optional since 2024 (6.9" scales down)
- **13" iPad (2064x2752)**: only required if you support iPad — the shell does, so
  either provide iPad shots or untick iPad under "Pricing and Availability → device availability"
  (simpler: in Xcode, set Targeted Device Families to iPhone only)
- Capture on a real iPhone in different realms (Reaper, Tiki, Cyberscape, a seasonal takeover)

### Privacy "nutrition label" (App Privacy section)

- Data collected: **Location (Coarse/Precise)** — Purpose: App Functionality —
  **Not linked to identity** — **Not used for tracking**
- **Contact Info: none** (no accounts) · **Identifiers: none** · **Tracking: No**
- Privacy Policy URL: https://fork-fate.com/privacy

### App Review notes (paste into "Notes" — heads off the two likely questions)

> Fork-Fate is a restaurant discovery game. No login is required. Location is used
> only to find nearby restaurants via Google Places; it is never stored with identity
> or used for tracking. The app includes native haptics, motion-based shake
> interactions, share sheet integration and a native splash/status-bar treatment.
> To test: allow location (or enter ZIP 68137), tap "Deal my fate", tap the card to reveal.

### Guideline 4.2 ("minimum functionality") risk — read this

Apple sometimes rejects apps that are thin website wrappers. Mitigations already in
place: native motion permission flow, splash, status bar, haptics bridge available.
If a rejection cites 4.2, reply in Resolution Center listing the native features and
we can add more native surface (native haptic heartbeat, home-screen quick actions,
push notifications) — reply to the review rather than abandoning the submission;
wrappers routinely pass on the second exchange.

## Version bumping (future releases)

Only needed when the SHELL changes (web changes ship instantly):
Xcode → App target → General → bump Version (e.g. 1.0.1) and Build, re-archive, upload.

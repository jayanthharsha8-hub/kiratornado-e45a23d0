# Rebuild Daily Streak as a premium mobile app screen

## Goal
Replace the current Daily Streak interface with a mobile-first layout closely matching the first reference image, while preserving the existing secure streak claim flow and admin-managed rewards.

## Build
- Create a dedicated Daily Streak component set: compact header, streak hero/emblem, milestone progress, live next-reward timer, horizontal snap carousel, reward cards, milestone cards, warning card, and page-specific bottom navigation.
- Render the existing database-driven rewards through a normalized 30-day presentation model so admin changes remain supported while missing visual metadata receives polished defaults.
- Replace the vertical 30-card grid with a touch-friendly horizontal carousel that automatically centers the current/available day and exposes claimed, available, locked, and upcoming states.
- Add restrained game-style reward visuals using reusable CSS/icon compositions for tokens, XP, coupons, frames, coins, cosmetics, crates, and legendary rewards; no copyrighted assets or poster-grid layout.
- Keep claiming server-authoritative, prevent duplicate/future claims through the existing backend function, and animate successful claims briefly before refreshing state.
- Add a Daily Streak-specific five-item navigation matching the reference labels and keep Profile highlighted without changing navigation elsewhere.

## Visual system
- Introduce scoped Daily Streak tokens and styles in the global design system: deep navy-black surfaces, electric cyan accents, subtle glass, thin borders, and blue/purple/gold rarity treatments.
- Keep the app centered at mobile width on larger screens, account for safe areas, prevent page-level horizontal overflow, and preserve vertical scrolling above the fixed navigation.

## Validation
- Verify build output and browser behavior, including carousel snap/auto-position, live timer, mobile overflow, safe bottom spacing, and visual rendering at 360×800, 375×812, 390×844, 412×915, and 430×932.
- Confirm no runtime or console errors on the accessible route; authenticated claim behavior remains delegated to the existing server function.

## Technical note
The existing backend uses a rolling 24-hour claim window and a 48-hour break threshold. The rebuilt UI will display that authoritative countdown rather than introducing a client-only local-midnight rule that could allow mismatches or duplicate claims.

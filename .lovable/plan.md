# ZEOX Leaderboard Mobile Polish

## Goal
Polish the existing leaderboard into a compact, premium mobile gaming experience while preserving every query, ranking rule, tab, filter, and navigation behavior.

## Changes
- Compress the header, ZEOX emblem, title, rewards, tabs, and section gaps so rankings become visible sooner on narrow phones.
- Restyle the rewards and ranking surfaces with restrained glass depth, thin cyan borders, and controlled cyan/purple lighting.
- Introduce a compact podium treatment for the existing top-three leaderboard entries, with #1 strongest and #2/#3 secondary, without creating or changing data.
- Refine the remaining rank rows for clearer rank, avatar, player, tier, and kills hierarchy with consistent alignment and touch feedback.
- Add subtle entrance, active-tab, and top-three pulse effects, with reduced-motion fallbacks.
- Keep the current Back control, profile avatar, region control, tabs, personal-rank panel, and bottom navigation.

## Technical Details
- Limit implementation to `src/pages/Leaderboard.tsx` plus leaderboard-specific semantic tokens/animations in `src/index.css` if required.
- Preserve all existing Cloud queries, state, memoization, event handlers, and data types.
- Use mobile-first responsive tracks and constrained dimensions to prevent overflow at approximately 360–411px widths.
- Verify the final page at a narrow Android viewport, checking horizontal overflow, text clipping, card alignment, and page density.

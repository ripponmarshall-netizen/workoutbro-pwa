# WorkoutBro · Hunter System

A dark, game-style workout tracker for the gym, home equipment and bodyweight training.
Every set earns XP; level up from E-Rank to S-Rank, clear daily quests and unlock achievements.

Live: https://ripponmarshall-netizen.github.io/workoutbro-pwa/

## Features
- **Three Gate types** — Gym, Home Equipment, Bodyweight, with ~60 built-in exercises plus custom ones
- **Set logging** — weight × reps, reps only, or timed holds; rest timer; previous values pre-filled
- **XP & levels** — XP per completed set (scaled by effort), +25 per workout, +30 per personal record
- **Ranks** — E (LV1) · D (5) · C (12) · B (20) · A (30) · S (45)
- **Stats** — STR / AGI / END from the exercises you do, VIT from workouts, WIL from streaks and quests
- **Daily quests** — 3 per day, scale with level, claim bonus XP when all are done
- **Streaks** — one rest day between sessions is allowed, so shift work doesn't break it
- **40 achievements** with progress bars; unlocked ones can be equipped as titles
- **Recommended raids** — 5-exercise plan per Gate built around your most-rested muscle groups
- **Progression hints** — "Last 60 kg × 8 → try 62.5 kg × 6" (double progression), one tap to apply
- **Recovery panel** — hours/days since each muscle group was trained
- **Training heatmap** and this-week vs last-week XP in the Log
- Undo for removed sets, exercises and deleted records
- Offline PWA (add to Home Screen in Safari). Data lives on-device in `localStorage` — use Export backup.

## Develop
```
npm install
npm run dev     # local server
npm test        # engine tests
npm run build   # production build to dist/
```
Pushing to `main` deploys to GitHub Pages via `.github/workflows/deploy.yml`.

## Code map
- `src/engine/` — pure game logic (XP, levels, PRs, streaks, quests, badges), recommendations + exercise library
- `src/store.ts` — state, persistence, actions, reward events
- `src/screens/` — Home, Workout (gate select / active / cleared), Log, Awards, Profile

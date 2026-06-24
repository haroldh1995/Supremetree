# Dumare: Power Realization Tracker

Local-first campaign progression tracker for Dumare's randomized superpower acquisition across an approximately 12-month tabletop campaign.

The app preserves random advancement while preventing missed sessions, irregular attendance, or bad luck from blocking the planned reveal of The Living Answer.

## Source Of Truth

- Textual power content comes only from the uploaded `Dumare_D20_Superpower_Tree.docx` used for this build.
- The uploaded skill-tree image is stored at `public/assets/dumare-skill-tree.jpg` and is used as a visual reference.
- Canonical structured power data lives in `src/data/powers.ts`.
- The app does not parse the DOCX at runtime and does not intentionally import, preserve, or merge older power data.

## Technology

- React, TypeScript, Vite
- React Router
- IndexedDB with Dexie
- PWA generation with `vite-plugin-pwa`
- CSS custom-property design system in `src/styles.css`
- Vitest and React Testing Library
- Playwright E2E tests
- ESLint and Prettier

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

## Production Build

```bash
npm run build
npm run preview
```

The preview command serves the built app locally. The app is static and can be deployed to any static host that supports SPA fallback to `index.html`.

## Testing

```bash
npm run typecheck
npm run lint
npm run format:check
npm test
npm run test:e2e
npm run build
```

Playwright runs the seven campaign workflows on desktop Chromium and the responsive workflow on desktop, tablet, phone portrait, and phone landscape Chromium projects.

## Local-First Persistence

IndexedDB is the primary campaign database. Dexie tables persist:

- Campaign settings
- Canonical power data version
- Power progression state
- Session records
- Draw history
- Audit events
- Catch-up credits
- Narrative requirements
- Living Answer status
- UI preferences
- Backup metadata

Critical campaign state is not stored only in React state or localStorage.

## Backup And Restore

Backup export produces a JSON payload with:

- `schemaVersion`
- `exportedAt`
- `appName`
- `canonicalPowerDataVersion`
- all persisted campaign tables

Import validates the schema, rejects malformed or unsupported files, previews key counts, and asks for confirmation before overwriting local data.

## Randomization Rules

The draw engine is in `src/domain/randomizer.ts`.

- Production draws use `crypto.getRandomValues()` when available.
- Tests can inject a seeded deterministic provider.
- Fully realized powers are excluded.
- Milestone-controlled powers are excluded.
- The Living Answer is never in the random pool.
- Same-session duplicate advancement is blocked unless overridden.
- Manifested powers normally cool down until other advancements happen.
- Never-manifested and long-waiting powers gain weight.
- Behind-schedule campaigns get gentle schedule-protection weighting.

Draws are two-step: preview/reveal first, then confirm and commit. Rerolls and cancellations create audit records.

## Progression Guarantees

Each ordinary rollable power follows:

`Locked -> Manifested -> Fully Realized`

The schedule engine recalculates campaign status from current date, campaign dates, expected remaining sessions, missed sessions, catch-up credits, and remaining stages. It reports:

- Ahead
- On schedule
- Slightly behind
- Critically behind

The default plan targets ordinary power completion by Month 10, Convergence Engine completion in Month 11, and The Living Answer narrative availability in Month 12.

## Missed Sessions And Catch-Up Credits

Missed sessions do not grant hidden story advancement. They are recorded honestly and can generate explicit catch-up credit records. Credits track owed, used, and remaining stages and can be approved, rejected, deferred, converted to milestones, partially used, or reversed.

## Convergence Engine

Convergence Engine is milestone controlled in this app. It is not a normal random draw. It advances from ordinary powers becoming fully realized and represents synchronization of powers Dumare has already manifested.

## The Living Answer

The Living Answer is a final unlock, not a random roll. The app tracks mechanical availability separately from DM narrative reveal. Calendar month alone cannot reveal it.

The mana battery full function is displayed separately as emergency-only and is not automatically activated by The Living Answer.

## Responsive Behavior

The desktop layout uses persistent navigation, multi-column dashboards, adjacent session/draw panels, and visible progression summaries. Tablet and phone layouts collapse to stacked panels with bottom navigation, touch-friendly controls, and no required hover-only controls.

## Architecture

- `src/data` - canonical DOCX-derived power data
- `src/domain` - pure progression, schedule, randomizer, backup, validation, convergence, and Living Answer logic
- `src/persistence` - Dexie schema and repository transactions
- `src/state` - live IndexedDB React state and typed actions
- `src/components` - shared app shell and controls
- `src/routes` - major screens
- `tests/e2e` - Playwright workflow tests

Business rules stay outside React components wherever practical.

## Updating Canonical Power Data

1. Extract the new authoritative DOCX.
2. Update `src/data/powers.ts` with the new canonical order, descriptions, weaknesses, special rules, and final unlock text.
3. Update `POWER_DATA_VERSION`.
4. Run:

```bash
npm run typecheck
npm test
npm run test:e2e
npm run build
```

Do not merge old power arrangements into the new dataset unless a future authoritative DOCX explicitly includes them.

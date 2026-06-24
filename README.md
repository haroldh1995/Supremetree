# DUMARE — SUPREME POWER TREE

A local-first, single-page React app that turns Dumare's current D20 superpower tree into an interactive manifestation tracker. The page is intentionally focused: open the tree, press **MANIFEST**, review the dramatic reveal, acknowledge it, and export/import progress as a portable JSON save file.

## Technology Stack

- React, TypeScript, and Vite
- CSS with SVG-driven tree connections and custom SVG power emblems
- Browser localStorage autosave with strict JSON save validation
- Vitest and React Testing Library
- Playwright end-to-end tests
- ESLint and Prettier
- GitHub Actions deployment to GitHub Pages

## Canonical Sources

The current canonical text lives in `src/data/powers.ts` and was transcribed from the newest uploaded `Dumare_D20_Superpower_Tree.docx`. The supplied tree image is stored as `public/assets/dumare-supreme-power-tree-blueprint.jpg` and is used as a visual blueprint/backdrop only. The app rebuilds the tree as HTML, CSS, SVG, and React components instead of shipping the image as a flat clickable screenshot.

Canonical data metadata:

- Data version: `dumare-d20-superpower-tree-2026-06-24`
- DOCX SHA-256: `0379E4ADA4F3C15135F1017324C842136537B683AA0A909E09FF3F634A532FB7`

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

Open the printed local Vite URL.

## Testing

```bash
npm run typecheck
npm run lint
npm run format:check
npm run test
npm run test:e2e
```

`npm run test:e2e` builds and previews the app, then runs Playwright across desktop, tablet, phone portrait, and phone landscape projects.

## Production Build

```bash
npm run build
npm run preview
```

The GitHub Actions workflow builds with the `/Supremetree/` Vite base path for GitHub Pages.

## GitHub Pages Deployment

Push to `main`. The workflow in `.github/workflows/pages.yml` runs:

1. install dependencies
2. typecheck
3. lint
4. unit/component tests
5. production build
6. GitHub Pages artifact upload and deployment

The deployed URL is:

```text
https://haroldh1995.github.io/Supremetree/
```

## Manifestation Rules

Every D20 power has one of three states:

- `unmanifested`
- `first_manifestation`
- `fully_manifested`

The sequence is strict:

```text
Unmanifested -> First Manifestation -> Fully Manifested
```

The first selection records the First Manifestation timestamp and shows the first-roll backlash field. The current DOCX did not supply separate first-roll backlash text, so the app displays a neutral "not supplied" message rather than inventing lore.

The second selection records the Fully Manifested timestamp and removes that power from future random rolls. A fully manifested power cannot be selected a third time.

## Random Selection

The MANIFEST button randomly selects from eligible D20 powers:

- unmanifested powers
- powers already at First Manifestation
- powers marked selectable by the canonical data

Excluded powers:

- fully manifested powers
- The Living Answer
- milestone-only powers, if future canonical data marks any power that way
- powers blocked by the light anti-repetition rule

Production random selection uses `crypto.getRandomValues()` with unbiased integer selection. Tests can inject deterministic random providers.

## Anti-Repetition

After a power receives its First Manifestation, it is blocked from the immediately following MANIFEST press when another eligible power exists. Once any different power is selected, the earlier power becomes eligible again. If it is the only eligible power remaining, it can be selected.

## Save File Format

`SAVE PROGRESS` downloads JSON containing:

- schema version
- app version
- save timestamp
- canonical data version and hash
- all power progression states
- manifestation counts and timestamps
- history
- cooldown state
- pending unacknowledged result
- Convergence Engine state
- The Living Answer state
- user preferences

`LOAD PROGRESS` validates the file before applying it and asks for confirmation before replacing current progress. Invalid JSON, unsupported versions, unknown power IDs, invalid states, and mismatched canonical hashes are rejected without changing current progress.

## Browser Autosave

The app automatically stores progress in localStorage under a versioned key. Autosave includes pending results, so closing the page before acknowledging a result restores the uncommitted reveal instead of silently committing or losing it.

## Convergence Engine

The current DOCX lists Convergence Engine as power 20 in the D20 list and does not mark it as milestone-only. It is therefore selectable by MANIFEST. Its node separately displays how many other D20 powers are fully manifested and can be synchronized.

## The Living Answer

The Living Answer is never randomly rolled. It becomes mechanically available only when all 20 D20 powers are fully manifested. The user must explicitly confirm the narrative reveal with **REVEAL THE LIVING ANSWER**. The mana battery remains separate and emergency-only; revealing The Living Answer does not mark the battery as fully activated.

## Project Structure

```text
src/data/                 DOCX-derived canonical power data
src/domain/               pure eligibility, progression, random, save, autosave, and status logic
src/components/           React tree, nodes, overlays, controls, and dialogs
src/test/                 shared test helpers
tests/e2e/                Playwright workflow and responsive tests
public/assets/            supplied visual blueprint image
.github/workflows/        GitHub Pages CI/deploy workflow
```

## Accessibility Notes

- Every power node is a real keyboard-focusable button.
- Enter or Space opens details without advancing the power.
- Result and detail overlays use semantic dialogs and visible focus states.
- Draw results are announced through an `aria-live` region.
- Reduced-motion mode shortens the reveal cycle.
- Color is paired with state labels, runes, borders, and glow styles.

## Updating Canonical Power Data

1. Replace the DOCX source outside the app.
2. Re-transcribe the current DOCX into `src/data/powers.ts`.
3. Update `CANONICAL_DATA_VERSION` and `CANONICAL_DATA_HASH`.
4. Keep fields empty or omitted when the DOCX does not supply that lore.
5. Run the full test suite and build.

## Replacing Visual Assets

Replace `public/assets/dumare-supreme-power-tree-blueprint.jpg` with the new supplied image. Keep the filename or update the CSS variable setup in `src/App.tsx`.

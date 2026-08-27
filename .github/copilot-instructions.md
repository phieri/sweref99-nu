# Copilot Instructions for sweref99-nu

## Repository overview
This repository contains a lightweight Swedish PWA that captures GNSS coordinates and converts them to SWEREF 99 TM values for display on mobile devices. The app is browser-only: no backend service, no server-side transformation, and no requirement for a database.

The codebase is intentionally small and focused. Most changes belong in `src/script.ts`; generated site assets live under `_site/` and should be treated as build output, not source.

## First-time agent workflow
When a cloud agent sees this repo for the first time, use this sequence:

1. Install dependencies in a fresh checkout:
   ```bash
   npm ci
   ```
2. Run the actual automated verification:
   ```bash
   npm test -- --runInBand
   ```
3. Compile the TypeScript app:
   ```bash
   make script.js
   ```
   or
   ```bash
   npx tsc
   ```
4. If the task requires regenerated icons or local static assets, run:
   ```bash
   make icons
   ```
   This requires `librsvg2-bin` and `imagemagick` on the host.

This project is validated by the actual repo workflow in `.github/workflows/ci.yml`: install dependencies, run tests, compile TypeScript, generate icons, download `proj4.js` and `pico.min.css`, and deploy the built site.

## Key files
- `src/script.ts` — browser logic, coordinate validation, transformation, UI state, geolocation handling
- `tests/*.test.ts` — Jest coverage for coordinate formatting, state management, and Sweden-boundary logic
- `_site/index.html` — static app shell served by GitHub Pages
- `_site/sw.js` — service worker; bump `CACHE_VERSION` on any user-facing change
- `tsconfig.json` — TypeScript compiler config
- `Makefile` — build and icon generation tasks
- `.github/workflows/ci.yml` — authoritative CI build sequence
- `package.json` — dev dependencies and Jest scripts

## What to change and what not to change
- Prefer editing source files in `src/` and tests in `tests/`.
- Do not hand-edit generated files in `_site/` such as `script.js`, `script.js.map`, or downloaded runtime assets.
- If the user-facing app changes, update `_site/sw.js` and bump `CACHE_VERSION` so cached clients load the new version.
- Keep UI copy in Swedish unless the change is clearly technical and the surrounding file already uses English.

## Build and validation contract
Use the repo’s existing commands instead of inventing new ones:

```bash
npm ci
npm test -- --runInBand
make script.js
```

The current repo status is verified to pass:
- 5 Jest test suites passed
- 147 tests passed
- TypeScript compilation succeeded

## Known issues and workarounds
These are real repo-level pitfalls that are worth documenting for future agents:

- Fresh clone issue: `npm test` fails with `jest: not found` until dependencies are installed.
  - Workaround: run `npm ci` before the first test or build.
- Fresh clone issue: `make script.js` fails if `tsc` is unavailable.
  - Workaround: `npm ci` installs the local TypeScript compiler, or run `npx tsc`.
- Icon generation issue: `make icons` fails when `rsvg-convert` or `convert` are missing.
  - Workaround: install `librsvg2-bin` and `imagemagick` via `apt-get`.
- Runtime issue: the app depends on HTTPS or localhost for geolocation and service worker behavior in browsers.
  - Workaround: run the app via a local server or use a secure origin; do not assume `file://` will work.
- Deployment issue: `_site/proj4.js` and `_site/pico.min.css` are not committed to the repo and are downloaded during CI.
  - Workaround: use the same pinned versions from `.github/workflows/ci.yml` when validating the full site locally.
- Cache issue: stale installations continue to use old assets until the service worker cache version changes.
  - Workaround: increment `CACHE_VERSION` in `_site/sw.js` whenever user-visible behavior or assets change.

## Common pitfalls for this app
- The app checks that coordinates fall within Swedish bounds (`lat 55-69`, `lon 10-24`) before treating them as valid for SWEREF 99.
- The app includes a continental drift correction between WGS84/ITRF and SWEREF 99/ETRS89; do not “simplify away” this logic unless the task specifically requires it.
- The app’s main logic is client-side; no backend processing or server-side validation should be introduced without a clear requirement.
- The UI and comments are primarily Swedish, so preserve Swedish wording in user-facing text and keep locale-sensitive messages consistent.

## Dependency and SBOM maintenance
If dependency versions are changed, update the repository’s SBOM artifacts and related notes so they remain consistent with the actual build:
- `SBOM.spdx`
- `sbom.json`
- `SBOM-README.md`

For this repo, dependency versions must be kept aligned with both:
- `.github/workflows/ci.yml` for runtime assets like `proj4.js` and `pico.min.css`
- `package-lock.json` / `package.json` for build and test dependencies

## CI/CD pipeline summary
The GitHub Actions pipeline is the source of truth for release behavior:
1. Install Node and project dependencies with `npm ci`
2. Run `npm test`
3. Build TypeScript with `make script.js`
4. Generate icons if needed
5. Download the pinned `proj4.js` release asset and `pico.min.css`
6. Publish the generated site to GitHub Pages

There is no lint step in CI today; the meaningful validation is the existing test suite plus the TypeScript build.

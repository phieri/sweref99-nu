# Copilot Instructions for sweref99-nu

## Repository overview
This repository contains a lightweight Swedish PWA that captures GNSS coordinates and converts them to SWEREF 99 TM values for display on mobile devices. The app is browser-only: no backend service, no server-side transformation, and no requirement for a database.

The codebase is intentionally small and focused. Most application logic belongs in `src/script.ts`. `_site/` contains **both** maintained source (HTML, CSS, manifest, service worker) and generated/downloaded assets; do not treat the whole directory as build output.

## First-time agent workflow
From the repository root, use Node.js 24 (as in CI) and this sequence:

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
4. If `src/icon.svg` changes, regenerate icons with:
   ```bash
   make icons
   ```
   This requires `librsvg2-bin` and `imagemagick` on the host.

CI (`.github/workflows/ci.yml`) runs `npm ci`, `npm test`, and `make script.js`, generates icons on cache misses, downloads `proj4.js` and `pico.min.css`, injects build information into the about page, and deploys from `main`. Markdown-only changes are excluded from its triggers.

## Key files
- `src/script.ts` — browser logic, coordinate validation, transformation, UI state, geolocation handling
- `tests/*.test.ts` — Jest coverage for projection, geolocation, averaging, UI state, wake lock, and service-worker interactions
- `tests/test-helpers.ts` — shared jsdom fixtures and typed browser mocks; tests normally use real `proj4` matching the CI release
- `_site/index.html`, `_site/om.html`, `_site/stil.css`, `_site/app.webmanifest` — maintained static site source
- `_site/sw.js` — service worker; bump `CACHE_VERSION` on any user-facing change
- `src/icon.svg` — source for generated icons and splash screens
- `tsconfig.json` — TypeScript compiler config
- `Makefile` — build and icon generation tasks
- `.github/workflows/ci.yml` — authoritative CI build sequence
- `package.json` — dev dependencies and Jest scripts

## What to change and what not to change
- Edit `src/script.ts` for application logic, `tests/` for behavior coverage, and the maintained `_site/` files for markup, styles, manifest, or offline behavior.
- Do not hand-edit `_site/script.js`, `_site/script.js.map`, downloaded `_site/proj4.js` or `_site/pico.min.css`, or generated icons; `tsconfig.json` emits the browser script to `_site/`.
- If a user-facing app asset or behavior changes, bump `CACHE_VERSION` in `_site/sw.js` so cached clients load the new version. Documentation-only changes do not need a cache bump.
- Keep UI copy in Swedish unless the change is clearly technical and the surrounding file already uses English.

## Build and validation contract
Use the repo’s existing commands instead of inventing new ones:

```bash
npm ci
npm test -- --runInBand
make script.js
```

At the time these instructions were updated, `npm test -- --runInBand` passed 8 suites / 102 tests and `make script.js` succeeded. There is no lint command in this repository. The Jest suite uses Babel + jsdom; TypeScript compilation excludes `tests/`.

## Known issues and workarounds
These are real repo-level pitfalls that are worth documenting for future agents:

- Fresh clone issue (reproduced): `npm test -- --runInBand` fails with `sh: 1: jest: not found` until dependencies are installed.
  - Workaround: run `npm ci` before the first test or build.
- Fresh clone issue (reproduced): `make script.js` fails with `./node_modules/.bin/tsc: No such file or directory`.
  - Workaround: run `npm ci` to install the local TypeScript compiler, then retry `make script.js`.
- `npm ci` may print `ERESOLVE overriding peer dependency` (Babel 7 syntax plugins against Babel 8) and `install-scripts` warnings; in the verified checkout it completed successfully without flags, and tests/build passed. Do not treat these warnings as a failed install.
- Icon generation issue: `make icons` fails when `rsvg-convert` or `convert` are missing.
  - Workaround: install `librsvg2-bin` and `imagemagick` via `apt-get`.
- Runtime issue: the app depends on HTTPS or localhost for geolocation and service worker behavior in browsers.
  - Workaround: run the app via a local server or use a secure origin; do not assume `file://` will work.
- Local site issue: `make script.js` alone does not create `_site/proj4.js` or `_site/pico.min.css`, and the service worker precaches those files and icons.
  - Workaround: for a full local browser test, follow the pinned runtime downloads in `.github/workflows/ci.yml` (PROJ4JS `v2.22.0` release asset and Pico.css `v2.1.1`) and generate missing icons with `make icons` before serving `_site/`.
- Cache issue: stale installations continue to use old assets until the service worker cache version changes.
  - Workaround: increment `CACHE_VERSION` in `_site/sw.js` whenever user-visible behavior or assets change.

## Common pitfalls for this app
- The app checks approximate Swedish bounds (`lat 55-69`, `lon 10-24`) to warn users outside Sweden; do not mistake that warning for a hard rejection of otherwise valid coordinates.
- The app includes a continental drift correction between WGS84/ITRF and SWEREF 99/ETRS89; do not “simplify away” this logic unless the task specifically requires it.
- Averaging uses two decimal places for SWEREF 99 coordinates, tracks sample count and elapsed time, and requests a wake lock when supported; keep its display/share and stop-state tests aligned.
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
4. Generate icons on a cache miss
5. Download pinned `proj4.js` and `pico.min.css`, and insert build time/commit into `_site/om.html` during CI (leave its local placeholder intact)
6. Publish the site to GitHub Pages on `main`

There is no lint step in CI today; the meaningful validation is the existing test suite plus the TypeScript build.

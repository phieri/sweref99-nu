# sweref99-nu

PWA for showing current position in SWEREF 99 TM. Works offline after first visit.

## Features
- Shows GNSS-derived coordinates in SWEREF 99 TM format
- Supports long-running averaging sessions for stationary measurements
- Keeps the device screen awake during averaging when the browser supports Wake Lock
- Works offline with ServiceWorker caching
- Compensates for ITRF/ETRS89 continental drift

## Documentation
- [LLMs file](https://sweref99.nu/llms.txt) - Curated overview and documentation links for LLM and agent use
- [SWEREF 99 Definition Verification](SWEREF99-DEFINITION.md) - Complete verification of coordinate system definition with traceable references
- [Software Bill of Materials](SBOM-README.md) - Direct runtime, build, and test dependencies with license references
- [Test Suite Documentation](tests/README.md) - Overview of the current Jest-based unit test coverage

## Development and testing
- Install dependencies with `npm ci`
- Run the test suite with `npm test`
- Build the browser bundle with `make script.js`
- The browser bundle is compiled from `src/script.ts` into `_site/script.js` for local testing and deployment
- For a working local site, serve `_site/` on localhost after adding `proj4.js` and `pico.min.css` using the pinned downloads in `.github/workflows/ci.yml`; `make script.js` only compiles TypeScript. Geolocation and offline caching require localhost or HTTPS.
- The averaging button in the published UI starts a running mean over incoming SWEREF 99 samples, displays northing/easting with two decimals while active, and requests a screen wake lock when supported
- The project intentionally keeps the build/test stack minimal (TypeScript + Babel + Jest) and pins the small set of transitive overrides needed to keep the test runner secure and compatible with the supported Node runtime.

## References
- https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API
- https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
- https://picocss.com/docs
- https://github.com/proj4js/proj4js
- https://epsg.io/3006 - SWEREF 99 TM official specification

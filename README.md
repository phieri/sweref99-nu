# sweref99-nu

PWA for showing current position in SWEREF 99 TM. Works offline after first visit.

## Features
- Shows GPS coordinates in SWEREF 99 TM format
- Works offline with ServiceWorker caching
- Compensates for ITRF/ETRS89 continental drift

## Documentation
- [LLMs file](_site/llms.txt) - Curated overview and documentation links for LLM and agent use
- [SWEREF 99 Definition Verification](SWEREF99-DEFINITION.md) - Complete verification of coordinate system definition with traceable references
- [Software Bill of Materials](SBOM-README.md) - Direct runtime, build, and test dependencies with license references
- [Test Suite Documentation](tests/README.md) - Overview of the current Jest-based unit test coverage

## Development and testing
- Install dependencies with `npm ci`
- Run the test suite with `npm test`
- Build the browser bundle with `make script.js`
- The browser bundle is compiled from `src/script.ts` into `_site/script.js` for local testing and deployment

## References
- https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API
- https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
- https://picocss.com/docs
- https://github.com/proj4js/proj4js
- https://epsg.io/3006 - SWEREF 99 TM official specification

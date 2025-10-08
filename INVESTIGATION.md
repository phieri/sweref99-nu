# Investigation: CDN to GitHub Repository Migration

## Problem Statement
Both PROJ4JS and PicoCSS are pulled from a third party CDN (jsdelivr.net) during the CI build. This investigation explores if it would be possible to, in a simple manner, instead pull the files from GitHub repositories.

## Investigation Results

### Current State
The CI workflow (`.github/workflows/ci.yml`) downloads dependencies from jsdelivr.net CDN:
- PicoCSS: `https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css`
- Proj4JS: `https://cdn.jsdelivr.net/npm/proj4@2.19.10/dist/proj4.js`

### GitHub Repository Availability

#### PicoCSS v2.0.0
- **Repository**: https://github.com/picocss/pico
- **Tag**: v2.0.0
- **File Path**: `css/pico.min.css`
- **Raw URL**: https://raw.githubusercontent.com/picocss/pico/v2.0.0/css/pico.min.css
- **Status**: ✅ Available and accessible

#### Proj4JS v2.19.10
- **Repository**: https://github.com/proj4js/proj4js
- **Tag**: v2.19.10
- **File Path**: `dist/proj4.js`
- **Raw URL**: https://raw.githubusercontent.com/proj4js/proj4js/v2.19.10/dist/proj4.js
- **Status**: ✅ Available and accessible

## Proposed Changes

### 1. Update CI Workflow
Replace CDN URLs with GitHub raw content URLs:
```yaml
curl -o _site/pico.min.css https://raw.githubusercontent.com/picocss/pico/v2.0.0/css/pico.min.css
curl -o _site/proj4.js https://raw.githubusercontent.com/proj4js/proj4js/v2.19.10/dist/proj4.js
```

### 2. Update ServiceWorker Cache Version
Increment cache version in `_site/sw.js` from v9 to v10 to ensure users receive updated resources.

## Advantages

### Security & Trust
- Dependencies sourced directly from official GitHub repositories
- No reliance on third-party CDN infrastructure
- Transparent and auditable source

### Consistency
- Same exact versions maintained (no changes to v2.0.0 and v2.19.10)
- Files are identical to CDN versions
- No changes required to application code

### Reliability
- GitHub raw content is stable and reliable
- No dependency on jsdelivr.net availability
- Direct access to official source repositories

## Implementation

The implementation is simple and straightforward:
1. Update two lines in `.github/workflows/ci.yml`
2. Increment cache version in `_site/sw.js`
3. No other code changes required

## Testing

Verification performed:
- ✅ Both URLs return HTTP 200 OK
- ✅ Files contain expected content (valid CSS and JavaScript)
- ✅ TypeScript build completes successfully
- ✅ No regressions introduced

## Recommendation

**Implement the proposed changes.** The migration from CDN to GitHub repository URLs is:
- Simple to implement (2 file changes)
- No breaking changes
- Improves dependency transparency
- Reduces external dependencies on third-party CDNs

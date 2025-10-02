# Copilot Instructions for sweref99-nu

## Repository Overview
This is a Swedish Progressive Web App (PWA) that shows GPS coordinates in SWEREF 99 TM format. It's a lightweight web application for Swedish coordinate system conversion.

## Technology Stack
- **Frontend**: TypeScript, HTML, CSS with Pico.css framework
- **Build**: TypeScript compiler, Make for build orchestration

## Key Files
- `src/script.ts` - Main TypeScript application logic
- `_site/index.html` - Main HTML page
- `tsconfig.json` - TypeScript configuration
- `Makefile` - Build configuration
- `.github/workflows/ci.yml` - CI/CD pipeline

## Development Commands

### Quick Development (TypeScript only)
```bash
# Build TypeScript (fast ~1.5s)
make script.js
# or directly:
tsc
```

## Important Notes
- **TypeScript build is fast and reliable** - use for quick development
- **App works without JavaScript** but coordinate transformation will be missing and therefore not useful
- **Swedish language** - UI and comments are in Swedish
- **Target audience**: Swedish users needing their SWEREF 99 TM coordinates on mobile devices

## Development Workflow
1. Make TypeScript changes in `src/script.ts`
2. Test with `tsc` for quick validation
3. HTML/CSS changes can be tested directly in `_site/`

## Testing
- Manual testing via web browser
- Geolocation API requires HTTPS or localhost
- Test with Swedish coordinates (lat: 55-69, lon: 10-24)

# Software Bill of Materials (SBOM)

This repository contains Software Bill of Materials (SBOM) files for the sweref99-nu project. These files provide transparency about the project's direct dependencies, their roles, and their licenses.

## Files

- `SBOM.spdx` - SBOM in SPDX 2.3 format (standard text format)
- `sbom.json` - SBOM in CycloneDX 1.4 format (JSON format)

## Dependencies

The project currently uses the following direct external components:

### Runtime Dependencies
- **PROJ4JS** (v2.20.3) - MIT License - Lightweight JavaScript coordinate transformation library
- **Pico.css** (v2.1.1) - MIT License - Minimal CSS framework

### Build Dependencies
- **TypeScript** (v5.9.2) - Apache License 2.0 - TypeScript compiler

### Test Dependencies
- **Jest** (v30.3.0) - MIT License - Test runner and assertion framework
- **@types/jest** (v30.0.0) - MIT License - TypeScript type definitions for Jest
- **jest-environment-jsdom** (v30.3.0) - MIT License - Browser-like test environment for Jest
- **ts-jest** (v29.4.6) - MIT License - TypeScript transformer for Jest

## License Information

Detailed license information is also available on the project's about page (om.html) in Swedish, as this is a Swedish-language application.

All external dependencies maintain their original licenses. Full license texts are available on each respective project's website.

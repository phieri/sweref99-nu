# Software Bill of Materials (SBOM)

This repository contains Software Bill of Materials (SBOM) files for the sweref99-nu project. These files provide transparency about the project's direct dependencies, their roles, and their licenses.

## Files

- `SBOM.spdx` - SBOM in SPDX 2.3 format (standard text format)
- `sbom.json` - SBOM in CycloneDX 1.4 format (JSON format)

## Dependencies

The project currently uses the following direct external components:

### Runtime Dependencies
- **PROJ4JS** (GitHub release v2.21.0) - MIT License - Lightweight JavaScript coordinate transformation library
  - The CI workflow downloads the PROJ4JS `dist.zip` asset for the pinned release tag `v2.21.0`. Update this SBOM entry when the workflow is intentionally moved to a newer release tag.
- **Pico.css** (v2.1.1) - MIT License - Minimal CSS framework

### Build Dependencies
- **TypeScript** (v7.0.2) - Apache License 2.0 - TypeScript compiler
- **@babel/core** (v8.0.1) - MIT License - Babel compiler core
- **@babel/preset-env** (v8.0.2) - MIT License - Babel preset for environment-specific transpilation
- **@babel/preset-typescript** (v8.0.1) - MIT License - Babel preset for TypeScript syntax

### Test Dependencies
- **Jest** (v30.4.2) - MIT License - Test runner and assertion framework
- **@types/jest** (v30.0.0) - MIT License - TypeScript type definitions for Jest
- **jest-environment-jsdom** (v30.4.1) - MIT License - Browser-like test environment for Jest
- **babel-jest** (v30.4.1) - MIT License - Jest transformer for Babel

## License Information

Detailed license information is also available on the project's about page (om.html) in Swedish, as this is a Swedish-language application.

All external dependencies maintain their original licenses. Full license texts are available on each respective project's website.

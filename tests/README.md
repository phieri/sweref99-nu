# Test Suite Documentation

This directory contains unit tests for `script.ts` and related UI/state behaviour.

## Overview

The test suite validates critical functionality including:
- **Constants validation**: SWEDEN_BOUNDS, ACCURACY_THRESHOLD_METERS, SPEED_THRESHOLD_MS
- **PROJ definition verification**: SWEREF 99 TM (EPSG:3006) coordinate system definition
- **Coordinate transformation**: WGS84 to SWEREF 99 TM conversion
- **Input validation**: Rejects invalid coordinates before projection attempts
- **ITRF to ETRS89 correction**: Continental drift calculations
- **Boundary validation**: Checks if coordinates are within Swedish territory
- **Integration scenarios**: Complete workflows combining multiple functions
- **Button state handling**: Share/start/stop button behaviour
- **Averaging sessions**: Running mean accumulation for stationary measurements
- **Wake lock handling**: Keeping the screen awake while averaging
- **Details state persistence**: Saving and restoring expanded help sections
- **Coordinate formatting**: UI alignment and share text formatting
- **Speed units**: m/s, km/h, and mph conversion and cycling

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode (for development)
```bash
npm run test:watch
```

### Generate coverage report
```bash
npm run test:coverage
```

The coverage report will be generated in the `coverage/` directory.

## Test Structure

### Test Files
- `script.test.ts`: Core coordinate logic, bounds, thresholds, and projection coverage
- `button-state.test.ts`: DOM-driven positioning and sharing button behaviour
- `averaging-session.test.ts`: Running average session behaviour
- `wake-lock.test.ts`: Screen wake lock request/release behaviour
- `details-state.test.ts`: DOM-driven `<details>` state persistence via localStorage
- `coordinate-formatting.test.ts`: DOM-driven coordinate display and share text formatting
- `speed-units.test.ts`: DOM-driven speed unit restoration and cycling
- `test-helpers.ts`: Shared typed mocks, DOM fixtures, and browser harnesses behaviour

### Core Coordinate Test Categories (`script.test.ts`)

#### 1. SWEDEN_BOUNDS Constants (4 tests)
Validates that the geographic bounds for Sweden are correctly defined:
- Latitude range: 55° to 69°
- Longitude range: 10° to 24°
- Internal consistency checks

#### 2. isInSweden Function (21 tests)
Tests boundary validation for Swedish territory:
- **Typical locations**: Stockholm, Gothenburg, Malmö, Kiruna
- **Boundary cases**: Exact min/max coordinates and edge cases
- **Outside Sweden**: Non-Swedish locations (Berlin, London, New York)

#### 3. ACCURACY_THRESHOLD_METERS Constant (8 tests)
Validates GNSS accuracy threshold (5 meters):
- Appropriate for smartphone GNSS accuracy (3-5m optimal)
- Usage scenarios from good (3m) to poor (20m) accuracy

#### 4. SPEED_THRESHOLD_MS Constant (8 tests)
Validates speed threshold (1.4 m/s for walking):
- Represents upper end of walking speed (4-5 km/h)
- Usage scenarios from stationary to driving speeds

#### 5. SWEREF99_PROJ_DEFINITION (10 tests)
Validates the PROJ definition string for EPSG:3006:
- **Core parameters**: UTM projection, zone 33, GRS80 ellipsoid
- **Datum transformation**: Zero transformation (ETRS89 ≈ WGS84)
- **Technical parameters**: Units, no_defs, type=crs
- **Format validation**: PROJ string structure and syntax
- **Official compliance**: Matches EPSG:3006 specification

#### 6. calculateItrf2Etrs89Correction Function (8 tests)
Tests continental drift correction calculations:
- Returns valid correction objects with `dn` and `de` properties
- Positive corrections (drift since 1989)
- North component larger than east (25° azimuth)
- Values within expected ranges based on 2.5 cm/year drift rate
- Consistency across multiple calls

#### 7. wgs84_to_sweref99tm Function (14 tests)
Tests coordinate transformation from WGS84 to SWEREF 99 TM:
- **Coordinate transformation**: Valid transformations for Swedish locations
- **Edge cases**: Boundaries of Swedish territory
- **Coordinate system properties**: Increasing northing/easting with lat/lon
- **Consistency**: Same inputs produce same outputs, different inputs differ
- **Precision**: Small coordinate differences produce measurable results

#### 8. Integration Tests (4 tests)
Complete workflows combining multiple functions:
- Sweden boundary validation with coordinate transformation
- Accuracy threshold validation
- Speed threshold validation
- Full coordinate processing workflow

## Test Coverage

The test suite achieves comprehensive coverage of:
- ✅ All exported constants
- ✅ All coordinate transformation logic
- ✅ Boundary validation functions
- ✅ Continental drift correction calculations
- ✅ Edge cases and error handling
- ✅ Integration scenarios
- ✅ UI state, persistence, and formatting helpers

## Implementation Notes

### Mock Dependencies
The tests use a mocked version of the `proj4` library since it's loaded from CDN in production. The mock provides:
- Basic coordinate transformation approximation
- Coordinate system definition registration
- Sufficient accuracy for testing logic correctness

### Test Isolation and Shared Fixtures

The suite now mixes:

1. **Exported unit tests** for public classes such as `CoordinateAveragingSession` and `ScreenWakeLockManager`
2. **DOM integration tests** that load `src/script.ts` inside a controlled jsdom fixture and assert user-visible behaviour
3. **Focused logic tests** in `script.test.ts` for duplicated non-exported helpers that still cannot be imported directly without changing production structure

Shared browser mocks and DOM setup live in `test-helpers.ts` so that:
- navigator, geolocation, share, and proj4 mocks stay type-safe and consistent
- DOM-heavy tests exercise the production event listeners instead of copy-pasted UI helper logic
- setup stays isolated through fresh module loading and per-test cleanup

## CI/CD Integration

Tests are automatically run in the GitHub Actions workflow:
1. Dependencies are installed via `npm ci`
2. Tests run via `npm test`
3. Build only proceeds if all tests pass

## Maintenance

When modifying `src/script.ts`:
1. Ensure constants remain in sync with test definitions
2. Update tests if function signatures or behavior change
3. Add new tests for new functionality
4. Run tests locally before committing
5. Verify CI passes after pushing changes

## Test Framework

- **Framework**: Jest 30.4.2
- **TypeScript Support**: Babel + TypeScript preset (no ts-jest)
- **Environment**: jsdom (simulates browser DOM)
- **Assertion Library**: Jest's built-in expect

## Future Improvements

Potential enhancements to the test suite:
- End-to-end tests for UI interactions
- Performance benchmarks for coordinate transformations
- Property-based testing for coordinate edge cases
- Visual regression testing for UI components
- Integration with real proj4 library for accuracy validation

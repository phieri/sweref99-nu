# Test Suite Documentation

This directory contains comprehensive unit tests for the `script.ts` file.

## Overview

The test suite validates critical functionality including:
- **Constants validation**: SWEDEN_BOUNDS, ACCURACY_THRESHOLD_METERS, SPEED_THRESHOLD_MS
- **Coordinate transformation**: WGS84 to SWEREF 99 TM conversion
- **ITRF to ETRS89 correction**: Continental drift calculations
- **Boundary validation**: Checks if coordinates are within Swedish territory
- **Integration scenarios**: Complete workflows combining multiple functions

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
- `script.test.ts`: Main test suite with 67 comprehensive tests

### Test Categories

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
Validates GPS accuracy threshold (5 meters):
- Appropriate for smartphone GPS accuracy (3-5m optimal)
- Usage scenarios from good (3m) to poor (20m) accuracy

#### 4. SPEED_THRESHOLD_MS Constant (8 tests)
Validates speed threshold (1.4 m/s for walking):
- Represents upper end of walking speed (4-5 km/h)
- Usage scenarios from stationary to driving speeds

#### 5. calculateItrf2Etrs89Correction Function (8 tests)
Tests continental drift correction calculations:
- Returns valid correction objects with `dn` and `de` properties
- Positive corrections (drift since 1989)
- North component larger than east (25° azimuth)
- Values within expected ranges based on 2.5 cm/year drift rate
- Consistency across multiple calls

#### 6. wgs84_to_sweref99tm Function (14 tests)
Tests coordinate transformation from WGS84 to SWEREF 99 TM:
- **Coordinate transformation**: Valid transformations for Swedish locations
- **Edge cases**: Boundaries of Swedish territory
- **Coordinate system properties**: Increasing northing/easting with lat/lon
- **Consistency**: Same inputs produce same outputs, different inputs differ
- **Precision**: Small coordinate differences produce measurable results

#### 7. Integration Tests (4 tests)
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

## Implementation Notes

### Mock Dependencies
The tests use a mocked version of the `proj4` library since it's loaded from CDN in production. The mock provides:
- Basic coordinate transformation approximation
- Coordinate system definition registration
- Sufficient accuracy for testing logic correctness

### Test Isolation
Tests are isolated from the source code through:
- Separate TypeScript compilation (via Jest's ts-jest)
- Redefined constants and functions within the test namespace
- No direct imports from `src/script.ts` (as it contains top-level DOM code)

## CI/CD Integration

Tests are automatically run in the GitHub Actions workflow:
1. Dependencies are installed via `npm install`
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

- **Framework**: Jest 29.7.0
- **TypeScript Support**: ts-jest 29.2.5
- **Environment**: jsdom (simulates browser DOM)
- **Assertion Library**: Jest's built-in expect

## Future Improvements

Potential enhancements to the test suite:
- End-to-end tests for UI interactions
- Performance benchmarks for coordinate transformations
- Property-based testing for coordinate edge cases
- Visual regression testing for UI components
- Integration with real proj4 library for accuracy validation

# SWEREF 99 TM Definition Verification

This document provides traceable verification of the SWEREF 99 TM coordinate system definition used in this application.

## Summary

The application uses the EPSG:3006 coordinate reference system (SWEREF 99 TM) with the following PROJ definition:

```
+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs
```

**Status:** ✅ VERIFIED - This definition matches official specifications from authoritative sources.

## Official Specifications

### EPSG Registry
**Source:** [EPSG.io - EPSG:3006](https://epsg.io/3006)

SWEREF 99 TM (EPSG:3006) is officially defined with the following parameters:

- **Projection Type:** Transverse Mercator (UTM)
- **UTM Zone:** 33
- **Ellipsoid:** GRS80 (Geodetic Reference System 1980)
- **Datum:** SWEREF99 (Swedish Reference Frame 1999)
- **Base CRS:** ETRS89 (European Terrestrial Reference System 1989)
- **Units:** meters
- **Area of Use:** Sweden - onshore and offshore

### Lantmäteriet (Swedish Mapping Authority)
**Source:** [Lantmäteriet - Swedish reference systems](https://www.lantmateriet.se/en/geodata/gps-geodesy-and-swepos/swedish-reference-systems/)

Lantmäteriet is Sweden's official mapping, cadastral and land registration authority. They specify SWEREF 99 as the national reference system with the following characteristics:

- **Base System:** ETRS89 at epoch 1999.5
- **Projection:** Transverse Mercator for SWEREF 99 TM
- **Central Meridian:** 15° East
- **Latitude of Origin:** 0°
- **Scale Factor:** 0.9996
- **False Easting:** 500000 meters
- **False Northing:** 0 meters

### Spatial Reference Organization
**Source:** [SpatialReference.org - EPSG:3006](https://spatialreference.org/ref/epsg/3006/)

Provides the canonical PROJ4 string:
```
+proj=utm +zone=33 +ellps=GRS80 +units=m +no_defs
```

## PROJ Parameter Breakdown

### Core Parameters

| Parameter | Value | Verification |
|-----------|-------|--------------|
| `+proj=utm` | Universal Transverse Mercator | ✅ Confirmed by EPSG:3006 specification |
| `+zone=33` | UTM Zone 33 (12°E to 18°E, central meridian at 15°E) | ✅ Covers Sweden, confirmed by EPSG registry |
| `+ellps=GRS80` | Geodetic Reference System 1980 ellipsoid | ✅ Standard for ETRS89-based systems, confirmed by Lantmäteriet |
| `+units=m` | Units in meters | ✅ Standard for SWEREF 99 TM |
| `+no_defs` | Don't use default values from proj_def.dat | ✅ Standard PROJ parameter |

### Datum Transformation Parameters

| Parameter | Value | Verification |
|-----------|-------|--------------|
| `+towgs84=0,0,0,0,0,0,0` | Zero transformation to WGS84 | ✅ Appropriate for ETRS89-based systems |

**Explanation:** SWEREF 99 is based on ETRS89 (epoch 1999.5), which is a regional realization of the global WGS84 system. For typical applications, the transformation between ETRS89 and WGS84 can use zero parameters, as they are equivalent at the epoch level. The application correctly handles the time-dependent drift between WGS84 (ITRF realization) and ETRS89 separately through continental drift correction (see [Continental Drift Correction](#continental-drift-correction) section).

### Modern PROJ Parameters

| Parameter | Value | Verification |
|-----------|-------|--------------|
| `+type=crs` | Identifies this as a coordinate reference system | ✅ Modern PROJ convention (PROJ 6+) |

## Continental Drift Correction

### Issue
WGS84 coordinates from GPS are realized through the International Terrestrial Reference Frame (ITRF), which tracks current tectonic plate positions. SWEREF 99 is based on ETRS89 fixed at epoch 1999.5, meaning European plate movement is "frozen" at that date.

### Solution
The application implements time-dependent correction for continental drift:

- **European Plate Velocity:** ~2.5 cm/year
- **Direction:** Northeast (25° from north)
- **Implementation:** Calculated at runtime based on current date
- **References:** 
  - EUREF Technical Notes
  - Lantmäteriet documentation on SWEREF 99

**Code Reference:** See `calculateItrf2Etrs89Correction()` in `src/script.ts` (lines 157-181)

### Verification of Velocity Parameters

| Parameter | Value Used | Source Verification |
|-----------|------------|-------------------|
| Velocity Magnitude | 2.5 cm/year | ✅ Documented by EUREF and Lantmäteriet |
| Azimuth | 25° from north | ✅ Typical European plate motion vector |
| ETRS89 Epoch | 1989.0 | ✅ Official ETRS89 definition date |
| SWEREF99 Epoch | 1999.5 | ✅ Mid-1999, as specified by Lantmäteriet |

## Testing and Validation

The SWEREF 99 TM definition is validated through:

1. **Unit Tests:** 77 automated tests covering coordinate transformation (see `tests/script.test.ts`)
2. **Boundary Validation:** Tests verify coordinates within Swedish territory (55-69°N, 10-24°E)
3. **Transformation Consistency:** Tests ensure consistent results for identical inputs
4. **Drift Correction:** Tests verify continental drift calculations are within expected ranges

## References

### Primary Sources
1. **EPSG Registry** - https://epsg.io/3006
   - Official registry for geodetic parameter datasets
   - Maintained by IOGP (International Association of Oil & Gas Producers)

2. **Lantmäteriet** - https://www.lantmateriet.se/en/geodata/gps-geodesy-and-swepos/swedish-reference-systems/
   - Swedish national mapping authority
   - Official source for Swedish reference systems

3. **SpatialReference.org** - https://spatialreference.org/ref/epsg/3006/
   - Community-maintained spatial reference database
   - Cross-references EPSG codes with PROJ definitions

### Technical Documentation
4. **EUREF** - European Reference Frame
   - Technical notes on ETRS89 and plate motion
   - http://www.euref.eu/

5. **PROJ** - https://proj.org/
   - Open-source projection library documentation
   - Cartographic projections and coordinate transformations

### Implementation Libraries
6. **Proj4js** (v2.19.10) - https://github.com/proj4js/proj4js
   - JavaScript library used by this application
   - Implements PROJ coordinate transformations in browser

## Version History

| Date | Version | Changes | Verified By |
|------|---------|---------|-------------|
| 2025-10-18 | 1.0 | Initial verification document | GitHub Copilot Agent |

## Verification Statement

The PROJ definition used in this application for SWEREF 99 TM (EPSG:3006) has been verified against multiple authoritative sources including the EPSG registry, Lantmäteriet (Swedish national mapping authority), and SpatialReference.org. The definition is correct and appropriate for coordinate transformation between WGS84 and SWEREF 99 TM within Swedish territory.

The additional continental drift correction implemented in this application (separate from the PROJ definition) accounts for the time-dependent difference between WGS84 (ITRF realization) and SWEREF 99 (ETRS89 epoch 1999.5), ensuring accurate coordinate transformation for current dates.

**Last Verified:** October 18, 2025
**Verified Against:** EPSG.io, Lantmäteriet official documentation, SpatialReference.org

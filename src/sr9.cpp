#include <emscripten.h>
#include <proj.h>
#include <stdio.h>
#include <string.h>
#include <stdlib.h>

#ifdef __cplusplus
extern "C" {
#endif

struct SwerefResult {
    double north;
    double east;
};

// Global PROJ objects for reuse across transformations
static PJ_CONTEXT *global_context = NULL;
static PJ *global_projection = NULL;
static int proj_initialized = 0;

// Initialize PROJ context and projection for reuse
EMSCRIPTEN_KEEPALIVE
int init_proj() {
    if (proj_initialized) {
        return 1; // Already initialized
    }
    
    global_context = proj_context_create();
    if (!global_context) {
        return 0;
    }
    
    PJ *P = proj_create_crs_to_crs(
        global_context, "EPSG:4326", "EPSG:3006", NULL);
    if (!P) {
        proj_context_destroy(global_context);
        global_context = NULL;
        return 0;
    }
    
    global_projection = proj_normalize_for_visualization(global_context, P);
    if (!global_projection) {
        proj_destroy(P);
        proj_context_destroy(global_context);
        global_context = NULL;
        return 0;
    }
    
    proj_destroy(P); // Destroy the original, keep the normalized version
    proj_initialized = 1;
    return 1;
}

// Cleanup PROJ resources (optional, for good practice)
EMSCRIPTEN_KEEPALIVE
void cleanup_proj() {
    if (global_projection) {
        proj_destroy(global_projection);
        global_projection = NULL;
    }
    if (global_context) {
        proj_context_destroy(global_context);
        global_context = NULL;
    }
    proj_initialized = 0;
}

EMSCRIPTEN_KEEPALIVE
double* wgs84_to_sweref99tm(double lat, double lon, double epoch) {
    // Allocate memory for the result (caller must free this)
    double* result = (double*)malloc(2 * sizeof(double));
    if (!result) {
        return NULL;
    }
    
    // Initialize with zeros in case of error
    result[0] = 0.0; // north
    result[1] = 0.0; // east
    
    // Initialize PROJ if not already done
    if (!proj_initialized && !init_proj()) {
        return result; // Return zeros on initialization failure
    }

    // Use epoch-aware coordinate transformation
    // The 4th parameter (time) should be in decimal years for time-dependent transformations
    PJ_COORD a = proj_coord(lon, lat, 0, epoch); // Note: lon, lat, height, time order
    PJ_COORD b = proj_trans(global_projection, PJ_FWD, a);

    result[0] = b.xy.y; // north
    result[1] = b.xy.x; // east
    
    return result;
}

#ifdef __cplusplus
}
#endif

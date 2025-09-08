#include <emscripten.h>
#include <proj.h>
#include <stdio.h>
#include <string.h>
#include <stdlib.h>

#ifdef __cplusplus
extern "C" {
#endif

// Global PROJ context and transformation objects to reuse
static PJ_CONTEXT *global_context = NULL;
static PJ *global_transformation = NULL;

struct SwerefResult {
    double north;
    double east;
};

// Initialize PROJ context and transformation (call once)
EMSCRIPTEN_KEEPALIVE
int init_proj_context() {
    if (global_context && global_transformation) {
        return 1; // Already initialized
    }
    
    // Clean up any existing context first
    if (global_transformation) {
        proj_destroy(global_transformation);
        global_transformation = NULL;
    }
    if (global_context) {
        proj_context_destroy(global_context);
        global_context = NULL;
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
    
    global_transformation = proj_normalize_for_visualization(global_context, P);
    if (!global_transformation) {
        proj_destroy(P);
        proj_context_destroy(global_context);
        global_context = NULL;
        return 0;
    }
    
    proj_destroy(P); // Clean up the intermediate transformation
    return 1;
}

// Clean up PROJ context (call when done)
EMSCRIPTEN_KEEPALIVE
void destroy_proj_context() {
    if (global_transformation) {
        proj_destroy(global_transformation);
        global_transformation = NULL;
    }
    if (global_context) {
        proj_context_destroy(global_context);
        global_context = NULL;
    }
}

EMSCRIPTEN_KEEPALIVE
double* wgs84_to_sweref99tm(double lat, double lon) {
    // Allocate memory for the result (caller must free this)
    double* result = (double*)malloc(2 * sizeof(double));
    if (!result) {
        return NULL;
    }
    
    // Initialize with zeros in case of error
    result[0] = 0.0; // north
    result[1] = 0.0; // east
    
    // Initialize PROJ context if not already done
    if (!global_context || !global_transformation) {
        if (!init_proj_context()) {
            return result; // Return zeros on initialization failure
        }
    }
    
    // Perform the coordinate transformation
    PJ_COORD a = proj_coord(lon, lat, 0, 0); // Note: lon, lat order
    PJ_COORD b = proj_trans(global_transformation, PJ_FWD, a);
    
    // Check for transformation errors
    if (b.xy.x == HUGE_VAL || b.xy.y == HUGE_VAL) {
        // Transformation failed, return zeros
        return result;
    }
    
    result[0] = b.xy.y; // north
    result[1] = b.xy.x; // east
    
    return result;
}

#ifdef __cplusplus
}
#endif

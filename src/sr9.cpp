#include <emscripten.h>
#include <proj.h>
#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <math.h>

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
static PJ *fallback_projection = NULL;
static int proj_initialized = 0;
static int use_time_dependent = 1; // Flag to track if time-dependent transformation is available

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
    
    // Try time-dependent transformation first
    PJ *P = proj_create_crs_to_crs(
        global_context, "EPSG:4326+time", "EPSG:3006+time", NULL);
    if (P) {
        global_projection = proj_normalize_for_visualization(global_context, P);
        proj_destroy(P);
        if (global_projection) {
            use_time_dependent = 1;
        }
    }
    
    // If time-dependent transformation failed, fall back to standard transformation
    if (!global_projection) {
        PJ *P_fallback = proj_create_crs_to_crs(
            global_context, "EPSG:4326", "EPSG:3006", NULL);
        if (!P_fallback) {
            proj_context_destroy(global_context);
            global_context = NULL;
            return 0;
        }
        
        fallback_projection = proj_normalize_for_visualization(global_context, P_fallback);
        proj_destroy(P_fallback);
        if (!fallback_projection) {
            proj_context_destroy(global_context);
            global_context = NULL;
            return 0;
        }
        use_time_dependent = 0;
    }
    
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
    if (fallback_projection) {
        proj_destroy(fallback_projection);
        fallback_projection = NULL;
    }
    if (global_context) {
        proj_context_destroy(global_context);
        global_context = NULL;
    }
    proj_initialized = 0;
    use_time_dependent = 1;
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

    PJ_COORD a, b;
    PJ *active_projection = NULL;
    
    // Choose which projection to use based on initialization success
    if (use_time_dependent && global_projection) {
        // Use epoch-aware coordinate transformation
        a = proj_coord(lon, lat, 0, epoch); // lon, lat, height, time order
        active_projection = global_projection;
    } else if (fallback_projection) {
        // Use standard coordinate transformation without time
        a = proj_coord(lon, lat, 0, 0); // lon, lat, height, time=0
        active_projection = fallback_projection;
    } else {
        // No valid projection available
        return result; // Return zeros
    }
    
    b = proj_trans(active_projection, PJ_FWD, a);
    
    // Check if transformation was successful
    if (b.xy.x != HUGE_VAL && b.xy.y != HUGE_VAL) {
        result[0] = b.xy.y; // north
        result[1] = b.xy.x; // east
    }
    // If transformation failed, result remains zeros
    
    return result;
}

// Helper function to check which transformation mode is active
EMSCRIPTEN_KEEPALIVE
int get_transformation_mode() {
    if (!proj_initialized) {
        return -1; // Not initialized
    }
    return use_time_dependent; // 1 = time-dependent, 0 = fallback
}

#ifdef __cplusplus
}
#endif

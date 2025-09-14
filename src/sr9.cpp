#include <emscripten.h>
#include <proj.h>
#include <cstdlib>
#include <cmath>

#ifdef __cplusplus
extern "C" {
#endif

// Global PROJ objects for reuse across transformations
static PJ_CONTEXT *global_context = nullptr;
static PJ *global_projection = nullptr;
static bool proj_initialized = false;

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
    
    // Create transformation from WGS84 to SWEREF 99 TM
    PJ *P = proj_create_crs_to_crs(
        global_context, "EPSG:4326", "EPSG:3006", NULL);
    if (!P) {
        proj_context_destroy(global_context);
        global_context = NULL;
        return 0;
    }
    
    global_projection = proj_normalize_for_visualization(global_context, P);
    proj_destroy(P);
    if (!global_projection) {
        proj_context_destroy(global_context);
        global_context = NULL;
        return 0;
    }
    
    proj_initialized = true;
    return 1;
}

// Cleanup PROJ resources (optional, for good practice)
EMSCRIPTEN_KEEPALIVE
void cleanup_proj() {
    if (global_projection) {
        proj_destroy(global_projection);
        global_projection = nullptr;
    }
    if (global_context) {
        proj_context_destroy(global_context);
        global_context = nullptr;
    }
    proj_initialized = false;
}

EMSCRIPTEN_KEEPALIVE
int wgs84_to_sweref99tm_buf(double lat, double lon, double* out, int out_len) {
    if (!out || out_len < 2) return 0;
    out[0] = 0.0; // north
    out[1] = 0.0; // east

    if (!proj_initialized && !init_proj()) return 0;
    if (!global_projection) return 0;

    PJ_COORD a = proj_coord(lon, lat, 0, 0); // lon, lat, height, time=0
    PJ_COORD b = proj_trans(global_projection, PJ_FWD, a);

    if (std::isfinite(b.xy.x) && std::isfinite(b.xy.y)) {
        out[0] = b.xy.y; // north
        out[1] = b.xy.x; // east
        return 1;
    }
    return 0;
}

#ifdef __cplusplus
}
#endif

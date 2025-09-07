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
    
    PJ_CONTEXT *C = proj_context_create();
    PJ *P = proj_create_crs_to_crs(
        C, "EPSG:4326", "EPSG:3006", NULL);
    if (!P) {
        proj_context_destroy(C);
        return result;
    }
    PJ *norm = proj_normalize_for_visualization(C, P);
    if (!norm) {
        proj_destroy(P);
        proj_context_destroy(C);
        return result;
    }
    proj_destroy(P);
    P = norm;
    PJ_COORD a = proj_coord(lon, lat, 0, 0); // Note: lon, lat order
    PJ_COORD b = proj_trans(P, PJ_FWD, a);
    result[0] = b.xy.y; // north
    result[1] = b.xy.x; // east
    proj_destroy(P);
    proj_context_destroy(C);
    return result;
}

#ifdef __cplusplus
}
#endif

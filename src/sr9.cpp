#include <emscripten.h>
#include <proj.h>
#include <stdio.h>
#include <string.h>

#ifdef __cplusplus
extern "C" {
#endif

// Struct to hold SWEREF 99 TM coordinates
struct SwerefResult {
    double north;
    double east;
};

// Exposed function for WebAssembly
EMSCRIPTEN_KEEPALIVE
SwerefResult wgs84_to_sweref99tm(double lat, double lon) {
    SwerefResult result = {0, 0};
    PJ_CONTEXT *C = PJ_DEFAULT_CTX;
    PJ *P = proj_create_crs_to_crs(
        C, "EPSG:4326", "EPSG:3006", NULL);
    if (!P) {
        return result;
    }
    PJ *norm = proj_normalize_for_visualization(C, P);
    if (!norm) {
        proj_destroy(P);
        return result;
    }
    proj_destroy(P);
    P = norm;
    PJ_COORD a = proj_coord(lon, lat, 0, 0); // Note: lon, lat order
    PJ_COORD b = proj_trans(P, PJ_FWD, a);
    result.north = b.enu.n;
    result.east = b.enu.e;
    proj_destroy(P);
    return result;
}

#ifdef __cplusplus
}
#endif

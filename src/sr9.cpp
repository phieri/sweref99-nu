#include <emscripten.h>
#include <proj.h>

EMSCRIPTEN_KEEPALIVE
string sr9(float north, float east) {
    PJ_CONTEXT *C;
    PJ *P;
    PJ *norm;
    PJ_COORD a, b;

    C = PJ_DEFAULT_CTX;

    P = proj_create_crs_to_crs(
        C, "EPSG:4326", "+proj=utm +zone=32 +datum=WGS84 +to +epsg:3006", NULL);

    /* This will ensure that the order of coordinates for the input CRS */
    /* will be longitude, latitude, whereas EPSG:4326 mandates latitude, */
    /* longitude */
    norm = proj_normalize_for_visualization(C, P);
    if (0 == norm) {
        fprintf(stderr, "Failed to normalize transformation object.\n");
        return 1;
    }
    proj_destroy(P);
    P = norm;

    a = proj_coord(12, 55, 0, 0);
    b = proj_trans(P, PJ_FWD, a);
    printf("easting: %.3f, northing: %.3f\n", b.enu.e, b.enu.n);

    proj_destroy(P);
    return "0";
}

// These are affine transforms. See explanation of every cell here:
// https://en.wikipedia.org/wiki/Transformation_matrix#/media/File:2D_affine_transformation_matrix.svg
export function createTransform() {
    'worklet';
    return [1, 0, 0, 0, 1, 0, 0, 0, 1];
}
export function applyRounding(t) {
    'worklet';
    t[2] = Math.round(t[2]);
    t[5] = Math.round(t[5]);
    // For example: 0.985, 0.99, 0.995, then 1:
    t[0] = Math.round(t[0] * 200) / 200;
    t[4] = Math.round(t[0] * 200) / 200;
}
// We're using a limited subset (always scaling and translating while keeping aspect ratio) so
// we can assume the transform doesn't encode have skew, rotation, or non-uniform stretching.
// All write operations are applied in-place to avoid unnecessary allocations.
export function readTransform(t) {
    'worklet';
    var scale = t[0];
    var translateX = t[2];
    var translateY = t[5];
    return [translateX, translateY, scale];
}
export function prependTranslate(t, x, y) {
    'worklet';
    t[2] += t[0] * x + t[1] * y;
    t[5] += t[3] * x + t[4] * y;
}
export function prependScale(t, value) {
    'worklet';
    t[0] *= value;
    t[1] *= value;
    t[3] *= value;
    t[4] *= value;
}
export function prependTransform(ta, tb) {
    'worklet';
    // In-place matrix multiplication.
    var a00 = ta[0], a01 = ta[1], a02 = ta[2];
    var a10 = ta[3], a11 = ta[4], a12 = ta[5];
    var a20 = ta[6], a21 = ta[7], a22 = ta[8];
    ta[0] = a00 * tb[0] + a01 * tb[3] + a02 * tb[6];
    ta[1] = a00 * tb[1] + a01 * tb[4] + a02 * tb[7];
    ta[2] = a00 * tb[2] + a01 * tb[5] + a02 * tb[8];
    ta[3] = a10 * tb[0] + a11 * tb[3] + a12 * tb[6];
    ta[4] = a10 * tb[1] + a11 * tb[4] + a12 * tb[7];
    ta[5] = a10 * tb[2] + a11 * tb[5] + a12 * tb[8];
    ta[6] = a20 * tb[0] + a21 * tb[3] + a22 * tb[6];
    ta[7] = a20 * tb[1] + a21 * tb[4] + a22 * tb[7];
    ta[8] = a20 * tb[2] + a21 * tb[5] + a22 * tb[8];
}
export function prependPan(t, translation) {
    'worklet';
    prependTranslate(t, translation.x, translation.y);
}
export function prependPinch(t, scale, origin, translation) {
    'worklet';
    prependTranslate(t, translation.x, translation.y);
    prependTranslate(t, origin.x, origin.y);
    prependScale(t, scale);
    prependTranslate(t, -origin.x, -origin.y);
}

var latestBandwidthEstimate;
export function get() {
    return latestBandwidthEstimate;
}
export function set(estimate) {
    if (!isNaN(estimate)) {
        latestBandwidthEstimate = estimate;
    }
}

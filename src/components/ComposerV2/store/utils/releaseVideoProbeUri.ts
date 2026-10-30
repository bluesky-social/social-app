/**
 * Native: the metadata helper returns the source URI it was given, which the
 * caller owns, so there is nothing to release.
 */
export function releaseVideoProbeUri(_: {uri: string}) {}

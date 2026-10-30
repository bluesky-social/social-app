/**
 * Web: the shared metadata helper creates a fresh object URL for each probe.
 * That contract, not the `blob:` prefix, makes it ours to revoke.
 */
export function releaseVideoProbeUri({uri}: {uri: string}) {
  URL.revokeObjectURL(uri)
}

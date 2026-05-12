/**
 * Extract the DID from an at-uri of the form `at://did:<method>:<id>/<nsid>/<rkey>`.
 * Returns undefined if the input is falsy, not an at-uri, or the authority is not a DID.
 */
export function parseDidFromAtUri(uri: string | undefined): string | undefined {
  if (!uri || !uri.startsWith('at://')) return undefined
  const authority = uri.slice('at://'.length).split('/')[0]
  if (!authority || !authority.startsWith('did:')) return undefined
  return authority
}

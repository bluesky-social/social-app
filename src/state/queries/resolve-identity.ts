/**
 * Fetches DID document from a DID. Based on {@link https://github.com/a-viv-a/deer-social/blob/main/src/state/queries/direct-fetch-record.ts#L125}
 * @returns DID document
 */
export async function resolvePdsServiceUrl(did: `did:${string}`) {
  const docUrl = did.startsWith('did:plc:')
    ? `https://plc.directory/${did}`
    : `https://${did.substring(8)}/.well-known/did.json`

  // TODO: validate!
  const doc: {
    service: {
      serviceEndpoint: string
      type: 'AtprotoPersonalDataServer'
    }[]
  } = await (await fetch(docUrl)).json()
  const service = doc.service.find(
    s => s.type === 'AtprotoPersonalDataServer',
  )?.serviceEndpoint

  if (service === undefined)
    throw new Error(`could not find a service for ${did}`)
  return service
}

import {LRU} from './direct-fetch-record'

const serviceCache = new LRU<`did:${string}`, string>()

export async function resolvePdsServiceUrl(did: `did:${string}`) {
  return await serviceCache.getOrTryInsertWith(did, async () => {
    const docUrl = did.startsWith('did:plc:')
      ? `https://plc.directory/${did}`
      : `https://${did.substring(8)}/.well-known/did.json`

    // TODO: validate!
    const doc: {
      service: {
        serviceEndpoint: string
        type: string
      }[]
    } = await (await fetch(docUrl)).json()
    const service = doc.service.find(
      s => s.type === 'AtprotoPersonalDataServer',
    )?.serviceEndpoint

    if (service === undefined)
      throw new Error(`could not find a service for ${did}`)
    return service
  })
}

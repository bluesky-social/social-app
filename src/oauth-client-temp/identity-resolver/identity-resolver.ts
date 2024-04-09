import { DidResolver } from '@atproto/did'
import {
  HandleResolver,
  ResolvedHandle,
  isResolvedHandle,
} from '@atproto/handle-resolver'
import { normalizeAndEnsureValidHandle } from '@atproto/syntax'

export type ResolvedIdentity = {
  did: NonNullable<ResolvedHandle>
  url: URL
}

export class IdentityResolver {
  constructor(
    readonly handleResolver: HandleResolver,
    readonly didResolver: DidResolver<'plc' | 'web'>,
  ) {}

  public async resolve(
    input: string,
    serviceType = 'AtprotoPersonalDataServer',
  ): Promise<ResolvedIdentity> {
    const did = isResolvedHandle(input)
      ? input // Already a did
      : await this.handleResolver.resolve(normalizeAndEnsureValidHandle(input))
    if (!did) throw new Error(`Handle ${input} does not resolve to a DID`)

    const url = await this.didResolver.resolveServiceEndpoint(did, {
      type: serviceType,
    })

    return { did, url }
  }
}

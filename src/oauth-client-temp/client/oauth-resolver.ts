import {IdentityResolver, ResolvedIdentity} from '@atproto/identity-resolver'
import {
  OAuthServerMetadata,
  OAuthServerMetadataResolver,
} from '@atproto/oauth-server-metadata-resolver'

export class OAuthResolver {
  constructor(
    readonly metadataResolver: OAuthServerMetadataResolver,
    readonly identityResolver: IdentityResolver,
  ) {}

  public async resolve(input: string): Promise<
    Partial<ResolvedIdentity> & {
      url: URL
      metadata: OAuthServerMetadata
    }
  > {
    const identity = /^https?:\/\//.test(input)
      ? // Allow using a PDS url directly as login input (e.g. when the handle does not resolve to a DID)
        {url: new URL(input)}
      : await this.identityResolver.resolve(input, 'AtprotoPersonalDataServer')

    const metadata = await this.metadataResolver.resolve(identity.url.origin)

    return {...identity, metadata}
  }
}

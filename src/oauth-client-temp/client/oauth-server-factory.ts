import {GenericStore, MemoryStore} from '@atproto/caching'
import {Fetch} from '@atproto/fetch'
import {IdentityResolver} from '@atproto/identity-resolver'
import {OAuthClientMetadata} from '@atproto/oauth-client-metadata'
import {OAuthServerMetadata} from '@atproto/oauth-server-metadata'
import {OAuthServerMetadataResolver} from '@atproto/oauth-server-metadata-resolver'

import {Key, Keyset} from '#/oauth-client-temp/jwk'
import {CryptoImplementation} from './crypto-implementation'
import {CryptoWrapper} from './crypto-wrapper'
import {OAuthResolver} from './oauth-resolver'
import {OAuthServer} from './oauth-server'
import {OAuthClientMetadataId} from './oauth-types'
import {validateClientMetadata} from './validate-client-metadata'

export type OAuthServerFactoryOptions = {
  clientMetadata: OAuthClientMetadata
  metadataResolver: OAuthServerMetadataResolver
  cryptoImplementation: CryptoImplementation
  identityResolver: IdentityResolver
  fetch?: Fetch
  keyset?: Keyset
  dpopNonceCache?: GenericStore<string, string>
}

export class OAuthServerFactory {
  readonly clientMetadata: OAuthClientMetadataId
  readonly metadataResolver: OAuthServerMetadataResolver
  readonly crypto: CryptoWrapper
  readonly resolver: OAuthResolver
  readonly fetch: Fetch
  readonly keyset?: Keyset
  readonly dpopNonceCache: GenericStore<string, string>

  constructor({
    metadataResolver,
    identityResolver,
    clientMetadata,
    cryptoImplementation,
    keyset,
    fetch = globalThis.fetch,
    dpopNonceCache = new MemoryStore<string, string>({
      ttl: 60e3,
      max: 100,
    }),
  }: OAuthServerFactoryOptions) {
    validateClientMetadata(clientMetadata, keyset)

    if (!clientMetadata.client_id) {
      throw new TypeError('A client_id property must be specified')
    }

    this.clientMetadata = clientMetadata
    this.metadataResolver = metadataResolver
    this.keyset = keyset
    this.fetch = fetch
    this.dpopNonceCache = dpopNonceCache

    this.crypto = new CryptoWrapper(cryptoImplementation)
    this.resolver = new OAuthResolver(metadataResolver, identityResolver)
  }

  async fromIssuer(issuer: string, dpopKey: Key) {
    const {origin} = new URL(issuer)
    const serverMetadata = await this.metadataResolver.resolve(origin)
    return this.fromMetadata(serverMetadata, dpopKey)
  }

  async fromMetadata(serverMetadata: OAuthServerMetadata, dpopKey: Key) {
    return new OAuthServer(
      dpopKey,
      serverMetadata,
      this.clientMetadata,
      this.dpopNonceCache,
      this.resolver,
      this.crypto,
      this.keyset,
      this.fetch,
    )
  }
}

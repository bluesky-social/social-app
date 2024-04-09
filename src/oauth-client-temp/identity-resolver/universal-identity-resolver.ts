import {
  DidCache,
  IsomorphicDidResolver,
  IsomorphicDidResolverOptions,
} from '@atproto/did'
import {Fetch} from '@atproto/fetch'
import UniversalHandleResolver, {
  HandleResolverCache,
  UniversalHandleResolverOptions,
} from '@atproto/handle-resolver'

import {IdentityResolver} from './identity-resolver'

export type UniversalIdentityResolverOptions = {
  fetch?: Fetch

  didCache?: DidCache
  handleCache?: HandleResolverCache

  /**
   * @see {@link IsomorphicDidResolverOptions.plcDirectoryUrl}
   */
  plcDirectoryUrl?: IsomorphicDidResolverOptions['plcDirectoryUrl']

  /**
   * @see {@link UniversalHandleResolverOptions.atprotoLexiconUrl}
   */
  atprotoLexiconUrl?: UniversalHandleResolverOptions['atprotoLexiconUrl']
}

export class UniversalIdentityResolver extends IdentityResolver {
  static from({
    fetch = globalThis.fetch,
    didCache,
    handleCache,
    plcDirectoryUrl,
    atprotoLexiconUrl,
  }: UniversalIdentityResolverOptions) {
    return new this(
      new UniversalHandleResolver({
        fetch,
        cache: handleCache,
        atprotoLexiconUrl,
      }),
      new IsomorphicDidResolver({
        fetch, //
        cache: didCache,
        plcDirectoryUrl,
      }),
    )
  }
}

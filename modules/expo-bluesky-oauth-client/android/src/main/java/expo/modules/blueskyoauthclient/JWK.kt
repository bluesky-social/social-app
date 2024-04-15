package expo.modules.blueskyoauthclient

import expo.modules.kotlin.records.Record
import expo.modules.kotlin.records.Field

class JWKPair(
  @Field val privateKey: String,
  @Field val publicKey: String
) : Record
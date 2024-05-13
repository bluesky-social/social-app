package expo.modules.blueskyoauthclient

import expo.modules.kotlin.records.Record
import expo.modules.kotlin.records.Field

class JWTVerifyResponse(
  @Field var protectedHeader: String,
  @Field var payload: String,
) : Record
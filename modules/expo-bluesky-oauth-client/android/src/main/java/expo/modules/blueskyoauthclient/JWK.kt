package expo.modules.blueskyoauthclient

import expo.modules.kotlin.records.Record
import expo.modules.kotlin.records.Field

class JWK(
  @Field var alg: String = "",
  @Field var kty: String = "",
  @Field var crv: String? = null,
  @Field var x: String? = null,
  @Field var y: String? = null,
  @Field var e: String? = null,
  @Field var n: String? = null,
  @Field var d: String? = null,
  @Field var use: String? = null,
  @Field var kid: String? = null
) : Record {
  fun toJson(): String {
    val parts = mutableListOf<String>()
    if (alg.isNotEmpty()) parts.add("\"alg\": \"$alg\"")
    if (kty.isNotEmpty()) parts.add("\"kty\": \"$kty\"")
    if (crv != null) parts.add("\"crv\": \"$crv\"")
    if (x != null) parts.add("\"x\": \"$x\"")
    if (y != null) parts.add("\"y\": \"$y\"")
    if (e != null) parts.add("\"e\": \"$e\"")
    if (n != null) parts.add("\"n\": \"$n\"")
    if (d != null) parts.add("\"d\": \"$d\"")
    if (use != null) parts.add("\"use\": \"$use\"")
    if (kid != null) parts.add("\"kid\": \"$kid\"")
    return "{ ${parts.joinToString()} }"
  }
}

class JWKPair(@Field val privateKey: JWK, @Field val publicKey: JWK) : Record
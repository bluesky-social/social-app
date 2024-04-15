package expo.modules.blueskyoauthclient

import expo.modules.kotlin.records.Record
import expo.modules.kotlin.records.Field

class JWK : Record {
  @Field
  var alg: String = ""
  @Field
  var kty: String = ""
  @Field
  var crv: String? = null
  @Field
  var x: String? = null
  @Field
  var y: String? = null
  @Field
  var e: String? = null
  @Field
  var n: String? = null
  @Field
  var d: String? = null
  @Field
  var use: String? = null
  @Field
  var kid: String? = null
}

class JWKPair : Record {
  @Field
  val privateKey: JWK = JWK()
  @Field
  val publicKey: JWK = JWK()
}
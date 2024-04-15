package expo.modules.blueskyoauthclient

import expo.modules.kotlin.records.Record
import expo.modules.kotlin.records.Field

class JWTHeader : Record {
  @Field
  val alg: String = ""
  @Field
  var jku: String? = null
  @Field
  var jwk: JWK = JWK()
  @Field
  var kid: String? = null
  @Field
  var typ: String? = null
  @Field
  var cty: String? = null
  @Field
  var crit: String? = null
}

class JWTPayload : Record {
  @Field
  var iss: String? = null
  @Field
  var aud: String? = null
  @Field
  var sub: String? = null
  @Field
  var exp: Int? = null
  @Field
  var nbr: Int? = null
  @Field
  var iat: Int? = null
  @Field
  var jti: String? = null
  @Field
  var htm: String? = null
  @Field
  var htu: String? = null
  @Field
  var ath: String? = null
  @Field
  var acr: String? = null
  @Field
  var azp: String? = null
  @Field
  var amr: String? = null
  @Field
  var cnf: JWTPayloadCNF? = null
  @Field
  var client_id: String? = null
  @Field
  var scope: String? = null
  @Field
  var nonce: String? = null
  @Field
  var at_hash: String? = null
  @Field
  var c_hash: String? = null
  @Field
  var s_hash: String? = null
  @Field
  var auth_time: Int? = null
  @Field
  var name: String? = null
  @Field
  var family_name: String? = null
  @Field
  var given_name: String? = null
  @Field
  var middle_name: String? = null
  @Field
  var nickname: String? = null
  @Field
  var preferred_username: String? = null
  @Field
  var gender: String? = null
  @Field
  var picture: String? = null
  @Field
  var profile: String? = null
  @Field
  var website: String? = null
  @Field
  var birthdate: String? = null
  @Field
  var zoneinfo: String? = null
  @Field
  var locale: String? = null
  @Field
  var updated_at: Int? = null
  @Field
  var email: String? = null
  @Field
  var email_verified: String? = null
  @Field
  var phone_number: String? = null
  @Field
  var phone_number_verified: Boolean? = null
  @Field
  var address: JWTPayloadAddress? = null
  @Field
  var authorization_details: JWTPayloadAuthorizationDetails? = null
}

class JWTPayloadCNF : Record {
  @Field
  var kid: String? = null
  @Field
  var jwk: JWK? = null
  @Field
  var jwe: String? = null
  @Field
  var jku: String? = null
  @Field
  var jkt: String? = null
  @Field
  var osc: String? = null
}

class JWTPayloadAddress : Record {
  @Field
  var formatted: String? = null
  @Field
  var street_address: String? = null
  @Field
  var locality: String? = null
  @Field
  var region: String? = null
  @Field
  var postal_code: String? = null
  @Field
  var country: String? = null
}

class JWTPayloadAuthorizationDetails : Record {
  @Field
  var type: String = ""
  @Field
  var locations: Array<String>? = null
  @Field
  var actions: Array<String>? = null
  @Field
  var datatypes: Array<String>? = null
  @Field
  var identifier: String? = null
  @Field
  var privileges: Array<String>? = null
}

class JWTVerifyResponse : Record {
  @Field
  var protectedHeader: JWTHeader = JWTHeader()
  @Field
  var payload: String = ""
}

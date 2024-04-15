package expo.modules.blueskyoauthclient

import expo.modules.kotlin.records.Record
import expo.modules.kotlin.records.Field

class JWTHeader(
  @Field var alg: String = "",
  @Field var jku: String? = null,
  @Field var jwk: JWK? = null,
  @Field var kid: String? = null,
  @Field var typ: String? = null,
  @Field var cty: String? = null,
  @Field var crit: String? = null
) : Record {
  fun toJson(): String {
    val parts = mutableListOf<String>()
    if (alg.isNotEmpty()) parts.add("\"alg\": \"$alg\"")
    if (jku != null) parts.add("\"jku\": \"$jku\"")
    if (jwk != null) parts.add("\"jwk\": ${jwk?.toJson()}")
    if (kid != null) parts.add("\"kid\": \"$kid\"")
    if (typ != null) parts.add("\"typ\": \"$typ\"")
    if (cty != null) parts.add("\"cty\": \"$cty\"")
    if (crit != null) parts.add("\"crit\": \"$crit\"")
    return "{ ${parts.joinToString()} }"
  }
}

class JWTPayload(
  @Field var iss: String? = null,
  @Field var aud: String? = null,
  @Field var sub: String? = null,
  @Field var exp: Int? = null,
  @Field var nbr: Int? = null,
  @Field var iat: Int? = null,
  @Field var jti: String? = null,
  @Field var htm: String? = null,
  @Field var htu: String? = null,
  @Field var ath: String? = null,
  @Field var acr: String? = null,
  @Field var azp: String? = null,
  @Field var amr: String? = null,
  @Field var cnf: JWTPayloadCNF? = null,
  @Field var client_id: String? = null,
  @Field var scope: String? = null,
  @Field var nonce: String? = null,
  @Field var at_hash: String? = null,
  @Field var c_hash: String? = null,
  @Field var s_hash: String? = null,
  @Field var auth_time: Int? = null,
  @Field var name: String? = null,
  @Field var family_name: String? = null,
  @Field var given_name: String? = null,
  @Field var middle_name: String? = null,
  @Field var nickname: String? = null,
  @Field var preferred_username: String? = null,
  @Field var gender: String? = null,
  @Field var picture: String? = null,
  @Field var profile: String? = null,
  @Field var birthdate: String? = null,
  @Field var zoneinfo: String? = null,
  @Field var updated_at: Int? = null,
  @Field var email: String? = null,
  @Field var email_verified: Boolean? = null,
  @Field var phone_number: String? = null,
  @Field var phone_number_verified: Boolean? = null,
  @Field var address: JWTPayloadAddress? = null,
  @Field var authorization_details: JWTPayloadAuthorizationDetails? = null
) : Record {
  fun toJson(): String {
    val parts = mutableListOf<String>()
    if (iss != null) parts.add("\"iss\": \"$iss\"")
    if (aud != null) parts.add("\"aud\": \"$aud\"")
    if (sub != null) parts.add("\"sub\": \"$sub\"")
    if (exp != null) parts.add("\"exp\": $exp")
    if (nbr != null) parts.add("\"nbr\": $nbr")
    if (iat != null) parts.add("\"iat\": $iat")
    if (jti != null) parts.add("\"jti\": \"$jti\"")
    if (htm != null) parts.add("\"htm\": \"$htm\"")
    if (htu != null) parts.add("\"htu\": \"$htu\"")
    if (ath != null) parts.add("\"ath\": \"$ath\"")
    if (acr != null) parts.add("\"acr\": \"$acr\"")
    if (azp != null) parts.add("\"azp\": \"$azp\"")
    if (amr != null) parts.add("\"amr\": \"$amr\"")
    if (cnf != null) parts.add("\"cnf\": ${cnf?.toJson()}")
    if (client_id != null) parts.add("\"client_id\": \"$client_id\"")
    if (scope != null) parts.add("\"scope\": \"$scope\"")
    if (nonce != null) parts.add("\"nonce\": \"$nonce\"")
    if (at_hash != null) parts.add("\"at_hash\": \"$at_hash\"")
    if (c_hash != null) parts.add("\"c_hash\": \"$c_hash\"")
    if (s_hash != null) parts.add("\"s_hash\": \"$s_hash\"")
    if (auth_time != null) parts.add("\"auth_time\": $auth_time")
    if (name != null) parts.add("\"name\": \"$name\"")
    if (family_name != null) parts.add("\"family_name\": \"$family_name\"")
    if (given_name != null) parts.add("\"given_name\": \"$given_name\"")
    if (middle_name != null) parts.add("\"middle_name\": \"$middle_name\"")
    if (nickname != null) parts.add("\"nickname\": \"$nickname\"")
    if (preferred_username != null) parts.add("\"preferred_username\": \"$preferred_username\"")
    if (gender != null) parts.add("\"gender\": \"$gender\"")
    if (picture != null) parts.add("\"picture\": \"$picture\"")
    if (profile != null) parts.add("\"profile\": \"$profile\"")
    if (birthdate != null) parts.add("\"birthdate\": \"$birthdate\"")
    if (zoneinfo != null) parts.add("\"zoneinfo\": \"$zoneinfo\"")
    if (updated_at != null) parts.add("\"updated_at\": $updated_at")
    if (email != null) parts.add("\"email\": \"$email\"")
    if (email_verified != null) parts.add("\"email_verified\": $email_verified")
    if (phone_number != null) parts.add("\"phone_number\": \"$phone_number\"")
    if (phone_number_verified != null) parts.add("\"phone_number_verified\": $phone_number_verified")
    if (address != null) parts.add("\"address\": ${address?.toJson()}")
    if (authorization_details != null) parts.add("\"authorization_details\": ${authorization_details?.toJson()}")
    return "{ ${parts.joinToString()} }"
  }
}

class JWTPayloadCNF(
  @Field var jwk: JWK? = null,
  @Field var jwe: String? = null,
  @Field var jku: String? = null,
  @Field var jkt: String? = null,
  @Field var osc: String? = null
) : Record {
  fun toJson(): String {
    val parts = mutableListOf<String>()
    if (jwk != null) parts.add("\"jwk\": ${jwk?.toJson()}")
    if (jwe != null) parts.add("\"jwe\": \"$jwe\"")
    if (jku != null) parts.add("\"jku\": \"$jku\"")
    if (jkt != null) parts.add("\"jkt\": \"$jkt\"")
    if (osc != null) parts.add("\"osc\": \"$osc\"")
    return "{ ${parts.joinToString()} }"
  }
}

class JWTPayloadAddress(
  @Field var formatted: String? = null,
  @Field var street_address: String? = null,
  @Field var locality: String? = null,
  @Field var region: String? = null,
  @Field var postal_code: String? = null,
  @Field var country: String? = null
) : Record {
  fun toJson(): String {
    val parts = mutableListOf<String>()
    if (formatted != null) parts.add("\"formatted\": \"$formatted\"")
    if (street_address != null) parts.add("\"street_address\": \"$street_address\"")
    if (locality != null) parts.add("\"locality\": \"$locality\"")
    if (region != null) parts.add("\"region\": \"$region\"")
    if (postal_code != null) parts.add("\"postal_code\": \"$postal_code\"")
    if (country != null) parts.add("\"country\": \"$country\"")
    return "{ ${parts.joinToString()} }"
  }
}

class JWTPayloadAuthorizationDetails(
  @Field var type: String? = null,
  @Field var locations: Array<String>? = null,
  @Field var actions: Array<String>? = null,
  @Field var datatypes: Array<String>? = null,
  @Field var identifier: String? = null,
  @Field var privileges: Array<String>? = null
) : Record {
  fun toJson(): String {
    val parts = mutableListOf<String>()
    if (type != null) parts.add("\"type\": \"$type\"")
    if (locations != null) parts.add("\"locations\": [${locations?.joinToString()}]")
    if (actions != null) parts.add("\"actions\": [${actions?.joinToString()}]")
    if (datatypes != null) parts.add("\"datatypes\": [${datatypes?.joinToString()}]")
    if (identifier != null) parts.add("\"identifier\": \"$identifier\"")
    if (privileges != null) parts.add("\"privileges\": [${privileges?.joinToString()}]")
    return "{ ${parts.joinToString()} }"
  }
}

class JWTVerifyResponse(
  @Field var protectedHeader: JWTHeader = JWTHeader(),
  @Field var payload: String = "",
) : Record
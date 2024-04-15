package expo.modules.blueskyoauthclient

import com.nimbusds.jose.JWSHeader
import com.nimbusds.jose.crypto.ECDSASigner
import com.nimbusds.jose.crypto.ECDSAVerifier
import com.nimbusds.jose.jwk.ECKey
import com.nimbusds.jwt.JWTClaimsSet
import com.nimbusds.jwt.SignedJWT

class JWTUtil {
  fun createJwt(header: JWTHeader, payload: JWTPayload, jwk: JWK): String {
    val parsedKey = ECKey.parse(jwk.toJson())
    val parsedHeader = JWSHeader.parse(header.toJson())
    val parsedPayload = JWTClaimsSet.parse(payload.toJson())

    val signer = ECDSASigner(parsedKey)
    val jwt = SignedJWT(parsedHeader, parsedPayload)
    jwt.sign(signer)

    return jwt.serialize()
  }

  fun verifyJwt(token: String, jwk: JWK): JWTVerifyResponse {
    try {
      val parsedKey = ECKey.parse(jwk.toJson())
      val jwt = SignedJWT.parse(token)
      val verifier = ECDSAVerifier(parsedKey)

      if (!jwt.verify(verifier)) {
        throw Exception("Invalid signature")
      }

      val header = jwt.header
      val payload = jwt.payload
      val ecKey = header.jwk?.toECKey()
      val serializedJwk = if (ecKey != null) {
        JWK(
          alg = ecKey.algorithm.toString(),
          kty = ecKey.keyType.toString(),
          crv = ecKey.curve.toString(),
          x = ecKey.x.toString(),
          y = ecKey.y.toString(),
          d = ecKey.d.toString(),
          use = ecKey.keyUse.toString(),
          kid = ecKey.keyID
        )
      } else {
        null
      }

      val serializedHeader = JWTHeader(
        alg = header.algorithm.toString(),
        jku = header.jwkurl?.toString(),
        jwk = serializedJwk,
        kid = header.keyID,
        typ = header.type?.toString(),
        cty = header.contentType,
        crit = header.criticalParams?.joinToString()
      )
      val serializedPayload = payload.toString()

      return JWTVerifyResponse(
        protectedHeader = serializedHeader,
        payload = serializedPayload,
      )
    } catch(e: Exception) {
      throw e
    }
  }
}

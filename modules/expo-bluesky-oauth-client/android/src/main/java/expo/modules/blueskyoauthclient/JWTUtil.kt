package expo.modules.blueskyoauthclient

import com.nimbusds.jose.JWSHeader
import com.nimbusds.jose.crypto.ECDSASigner
import com.nimbusds.jose.crypto.ECDSAVerifier
import com.nimbusds.jose.jwk.ECKey
import com.nimbusds.jwt.JWTClaimsSet
import com.nimbusds.jwt.SignedJWT

class JWTUtil {
  fun createJwt(header: String, payload: String, jwk: String): String {
    val parsedKey = ECKey.parse(jwk)
    val parsedHeader = JWSHeader.parse(header)
    val parsedPayload = JWTClaimsSet.parse(payload)

    val signer = ECDSASigner(parsedKey)
    val jwt = SignedJWT(parsedHeader, parsedPayload)
    jwt.sign(signer)

    return jwt.serialize()
  }

  fun verifyJwt(token: String, jwk: String): Map<String, String> {
    try {
      val parsedKey = ECKey.parse(jwk)
      val jwt = SignedJWT.parse(token)
      val verifier = ECDSAVerifier(parsedKey)

      if (!jwt.verify(verifier)) {
        throw Exception("Invalid signature")
      }

      val header = jwt.header
      val payload = jwt.payload

      return mapOf(
        "payload" to payload.toString(),
        "protectedHeader" to header.toString()
      )
    } catch(e: Exception) {
      throw e
    }
  }
}

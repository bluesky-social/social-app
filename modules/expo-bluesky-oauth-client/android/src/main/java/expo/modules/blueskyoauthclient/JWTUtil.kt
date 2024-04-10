package expo.modules.blueskyoauthclient

import com.nimbusds.jose.JWSHeader
import com.nimbusds.jose.crypto.ECDSASigner
import com.nimbusds.jose.crypto.ECDSAVerifier
import com.nimbusds.jose.jwk.ECKey
import com.nimbusds.jwt.JWTClaimsSet
import com.nimbusds.jwt.SignedJWT


class JWTUtil {
  fun createJwt(jwkString: String, headerString: String, payloadString: String): String {
    val key = ECKey.parse(jwkString)
    val header = JWSHeader.parse(headerString)
    val payload = JWTClaimsSet.parse(payloadString)

    val signer = ECDSASigner(key)
    val jwt = SignedJWT(header, payload)
    jwt.sign(signer)

    return jwt.serialize()
  }

  fun verifyJwt(jwkString: String, tokenString: String, options: String?): Boolean {
    return try {
      val key = ECKey.parse(jwkString)
      val jwt = SignedJWT.parse(tokenString)
      val verifier = ECDSAVerifier(key)

      jwt.verify(verifier)
    } catch(e: Exception) {
      false
    }
  }
}

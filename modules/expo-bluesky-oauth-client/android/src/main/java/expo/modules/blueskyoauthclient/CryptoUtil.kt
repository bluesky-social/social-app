package expo.modules.blueskyoauthclient

import com.nimbusds.jose.Algorithm
import java.security.KeyPairGenerator
import java.security.MessageDigest
import java.security.interfaces.ECPublicKey
import java.security.interfaces.ECPrivateKey
import com.nimbusds.jose.jwk.Curve
import com.nimbusds.jose.jwk.ECKey
import com.nimbusds.jose.jwk.KeyUse
import java.util.UUID

class CryptoUtil {
  fun digest(data: ByteArray, algorithmName: String): ByteArray {
    if(algorithmName != "sha256") throw Exception("Unsupported algorithm")
    val digest = MessageDigest.getInstance("sha256")
    return digest.digest(data)
  }

  fun getRandomValues(byteLength: Int): ByteArray {
    val random = ByteArray(byteLength)
    java.security.SecureRandom().nextBytes(random)
    return random
  }

  fun generateKeyPair(): Any {
    val keyIdString = UUID.randomUUID().toString()

    val keyPairGen = KeyPairGenerator.getInstance("EC")
    keyPairGen.initialize(Curve.P_256.toECParameterSpec())
    val keyPair = keyPairGen.generateKeyPair()

    val publicKey = keyPair.public as ECPublicKey
    val privateKey = keyPair.private as ECPrivateKey

    val publicJwk = ECKey.Builder(Curve.P_256, publicKey)
      .keyUse(KeyUse.SIGNATURE)
      .algorithm(Algorithm.parse("ES256"))
      .keyID(keyIdString)
      .build()
    val privateJwk = ECKey.Builder(Curve.P_256, publicKey)
      .privateKey(privateKey)
      .keyUse(KeyUse.SIGNATURE)
      .keyID(keyIdString)
      .algorithm(Algorithm.parse("ES256"))
      .build()


    return JWKPair(
      JWK(
        alg = privateJwk.algorithm.toString(),
        kty = privateJwk.keyType.toString(),
        crv = privateJwk.curve.toString(),
        x = privateJwk.x.toString(),
        y = privateJwk.y.toString(),
        d = privateJwk.d.toString(),
        use = privateJwk.keyUse.toString(),
        kid = privateJwk.keyID
      ),
      JWK(
        alg = publicJwk.algorithm.toString(),
        kty = publicJwk.keyType.toString(),
        crv = publicJwk.curve.toString(),
        x = publicJwk.x.toString(),
        y = publicJwk.y.toString(),
        use = publicJwk.keyUse.toString(),
        kid = publicJwk.keyID
      )
    )
  }
}

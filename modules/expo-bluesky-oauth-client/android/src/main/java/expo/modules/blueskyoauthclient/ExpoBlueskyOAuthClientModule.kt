package expo.modules.blueskyoauthclient

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoBlueskyOAuthClientModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoBlueskyOAuthClient")

    AsyncFunction("digest") { value: ByteArray ->
      return@AsyncFunction CryptoUtil().digest(value)
    }

    Function("getRandomValues") { byteLength: Int ->
      return@Function CryptoUtil().getRandomValues(byteLength)
    }

    AsyncFunction("generateKeyPair") { keyId: String? ->
      val res = CryptoUtil().generateKeyPair(keyId)

      return@AsyncFunction mapOf(
        "publicKey" to res.first,
        "privateKey" to res.second
      )
    }

    AsyncFunction("createJwt") { jwkString: String, headerString: String, payloadString: String ->
      return@AsyncFunction JWTUtil().createJwt(jwkString, headerString, payloadString)
    }

    AsyncFunction("verifyJwt") { jwkString: String, tokenString: String, options: String? ->
      return@AsyncFunction JWTUtil().verifyJwt(jwkString, tokenString, options)
    }
  }
}

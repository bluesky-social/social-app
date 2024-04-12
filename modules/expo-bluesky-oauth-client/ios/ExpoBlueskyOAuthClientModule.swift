import ExpoModulesCore
import JOSESwift

public class ExpoBlueskyOAuthClientModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoBlueskyOAuthClient")

    AsyncFunction("digest") { (data: Data, promise: Promise) in
      promise.resolve(CryptoUtil.digest(data: data))
    }

    // We are going to leave this as sync to line up the APIs. It's fast, so not a big deal.
    Function("getRandomValues") { (byteLength: Int) in
      return CryptoUtil.getRandomValues(byteLength: byteLength)
    }

    AsyncFunction ("generateKeyPair") { (kid: String?, promise: Promise) in
      let keypair = try? CryptoUtil.generateKeyPair(kid: kid)

      guard let keypair = keypair else {
        promise.reject("GenerateKeyError", "Error generating JWK.")
        return
      }

      promise.resolve([
        "publicKey": keypair.publicJWK.toJson(),
        "privateKey": keypair.privateJWK.toJson()
      ])
    }

    AsyncFunction("createJwt") { (jwk: String, header: String, payload: String, promise: Promise) in
      guard let jwt = JWTUtil.createJwt(jwk, header: header, payload: payload) else {
        promise.reject("JWTError", "Error creating JWT.")
        return
      }
      promise.resolve(jwt)
    }

    AsyncFunction("verifyJwt") { (jwk: String, token: String, options: String?, promise: Promise) in
      promise.resolve(JWTUtil.verifyJwt(jwk, token: token, options: options))
    }
  }
}

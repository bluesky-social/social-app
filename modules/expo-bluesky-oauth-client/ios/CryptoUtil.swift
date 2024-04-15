import CryptoKit
import JOSESwift
import ExpoModulesCore

class CryptoUtil {
  // The equivalent of crypto.subtle.digest() with JS on web
  public static func digest(data: Data) -> Data {
    let hash = SHA256.hash(data: data)
    return Data(hash)
  }
  
  public static func getRandomValues(byteLength: Int) -> Data {
    let bytes = (0..<byteLength).map { _ in UInt8.random(in: UInt8.min...UInt8.max) }
    return Data(bytes)
  }
  
  public static func generateKeyPair() throws -> JWKPair? {
    let keyIdString = UUID().uuidString
    
    let privateKey = P256.Signing.PrivateKey()
    let publicKey = privateKey.publicKey
    
    let x = publicKey.x963Representation[1..<33].base64URLEncodedString()
    let y = publicKey.x963Representation[33...].base64URLEncodedString()
    let d = privateKey.rawRepresentation.base64URLEncodedString()
    
    let publicJWK = JWK(
      alg: "ES256".toField(),
      kty: "EC".toField(),
      crv: "P-256".toNullableField(),
      x: x.toNullableField(),
      y: y.toNullableField(),
      use: "sig".toNullableField(),
      kid: keyIdString.toNullableField()
    )
    let privateJWK = JWK(
      alg: "ES256".toField(),
      kty: "EC".toField(),
      crv: "P-256".toNullableField(),
      x: x.toNullableField(),
      y: y.toNullableField(),
      d: d.toNullableField(),
      use: "sig".toNullableField(),
      kid: keyIdString.toNullableField()
    )
    
    return JWKPair(privateKey: privateJWK.toField(), publicKey: publicJWK.toField())
  }
}

extension Data {
  func base64URLEncodedString() -> String {
    return self.base64EncodedString().replacingOccurrences(of: "+", with: "-").replacingOccurrences(of: "/", with: "_").replacingOccurrences(of: "=", with: "")
  }
}

extension String {
  func toField() -> Field<String> {
    return Field(wrappedValue: self)
  }
  func toNullableField() -> Field<String?> {
    return Field(wrappedValue: self)
  }
}

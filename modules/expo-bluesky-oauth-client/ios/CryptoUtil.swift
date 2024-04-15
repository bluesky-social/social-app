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
  
  public static func generateKeyPair() throws -> [String:String] {
    let keyIdString = UUID().uuidString
    
    let privateKey = P256.Signing.PrivateKey()
    let publicKey = privateKey.publicKey
    
    let x = publicKey.x963Representation[1..<33].base64URLEncodedString()
    let y = publicKey.x963Representation[33...].base64URLEncodedString()
    let d = privateKey.rawRepresentation.base64URLEncodedString()
        
    let publicJWK = JWK(kty: "EC", use: "sig", crv: "P-256", kid: keyIdString, x: x, y: y, alg: "ES256")
    let privateJWK = JWK(kty: "EC", use: "sig", crv: "P-256", kid: keyIdString, x: x, y: y, d: d, alg: "ES256")
    
    return [
      "privateKey": privateJWK.toJson(),
      "publicKey": publicJWK.toJson()
    ]
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

import ExpoModulesCore
import JOSESwift

class JWTUtil {
  static func jsonToPrivateKey(_ jwkString: String) throws -> SecKey? {
    guard let jsonData = jwkString.data(using: .utf8),
          let jwk = try? JSONDecoder().decode(ECPrivateKey.self, from: jsonData),
          let key = try? jwk.converted(to: SecKey.self)
    else {
      print("Error creating JWK from JWK string.")
      return nil
    }
    
    return key
  }
  
  static func jsonToPublicKey(_ jwkString: String) throws -> SecKey? {
    guard let jsonData = jwkString.data(using: .utf8),
          let jwk = try? JSONDecoder().decode(ECPublicKey.self, from: jsonData),
          let key = try? jwk.converted(to: SecKey.self)
    else {
      print("Error creating JWK from JWK string.")
      return nil
    }
    
    return key
  }
  
  static func payloadStringToPayload(_ payloadString: String) -> Payload? {
    guard let payloadData = payloadString.data(using: .utf8) else {
      print("Error converting payload to data.")
      return nil
    }
    
    return Payload(payloadData)
  }
  
  static func headerStringToPayload(_ headerString: String) -> JWSHeader? {
    guard let headerData = headerString.data(using: .utf8) else {
      print("Error converting header to data.")
      return nil
    }
    
    return JWSHeader(headerData)
  }
  
  public static func createJwt(header: String, payload: String, jwk: String) -> String? {
    guard let header = headerStringToPayload(header),
          let payload = payloadStringToPayload(payload),
          let key = try? jsonToPrivateKey(jwk)
    else {
      return nil
    }
    
    let signer = Signer(signingAlgorithm: .ES256, key: key)
    
    guard let signer = signer,
          let jws = try? JWS(header: header, payload: payload, signer: signer)
    else {
      print("Error creating JWS.")
      return nil
    }
    
    return jws.compactSerializedString
  }
  
  public static func verifyJwt(token: String, jwk: String) -> [String: Any]? {
    guard let key = try? jsonToPublicKey(jwk),
          let jws = try? JWS(compactSerialization: token),
          let verifier = Verifier(verifyingAlgorithm: .ES256, key: key),
          let validation = try? jws.validate(using: verifier)
    else {
      return nil
    }
    
    let header = validation.header
    let payload = String(data: validation.payload.data(), encoding: .utf8)
    
    guard let payload = payload else {
      return nil
    }
    
    var protectedHeader: [String:Any] = [:]
    protectedHeader["alg"] = "ES256"
    if header.jku != nil {
      protectedHeader["jku"] = header.jku?.absoluteString
    }
    if header.kid != nil {
      protectedHeader["kid"] = header.kid
    }
    if header.typ != nil {
      protectedHeader["typ"] = header.typ
    }
    if header.cty != nil {
      protectedHeader["cty"] = header.cty
    }
    if header.crit != nil {
      protectedHeader["crit"] = header.crit
    }
    
    return [
      "payload": payload,
      "protectedHeader": protectedHeader
    ]
  }
}

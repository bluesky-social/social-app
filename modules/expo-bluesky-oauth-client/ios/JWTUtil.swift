import JOSESwift

class JWTUtil {
  static func jsonToPrivateKey(_ jwkString: String) throws -> SecKey? {
    guard let jsonData = jwkString.data(using: .utf8),
          let jwk = try? JSONDecoder().decode(ECPrivateKey.self, from: jsonData),
          let key = try? jwk.converted(to: SecKey.self)
    else {
      let jsonData = jwkString.data(using: .utf8)!
      let jwk = try! JSONDecoder().decode(ECPrivateKey.self, from: jsonData)
//      let key = try! jwk.converted(to: SecKey.self)
      print("Error creating JWK from JWK string \(jwkString).")
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
  
  public static func createJwt(_ jwkString: String, header headerString: String, payload payloadString: String) -> String? {
    guard let key = try? jsonToPrivateKey(jwkString),
          let payload = payloadStringToPayload(payloadString),
          let header = headerStringToPayload(headerString)
    else
    {
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
  
  public static func verifyJwt(_ jwkString: String, token tokenString: String, options optionsString: String?) -> Bool {
    guard let key = try? jsonToPublicKey(jwkString),
          let jws = try? JWS(compactSerialization: tokenString),
          let verifier = Verifier(verifyingAlgorithm: .ES256, key: key),
          let isVerified = try? jws.validate(using: verifier).isValid(for: verifier)
    else {
      return false
    }
    
    return isVerified
  }
}

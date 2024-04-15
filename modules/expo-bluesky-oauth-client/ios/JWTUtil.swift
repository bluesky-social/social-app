import ExpoModulesCore
import JOSESwift

class JWTUtil {
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
  
  public static func createJwt(header: JWTHeader, payload: JWTPayload, jwk: JWK) -> String? {
    guard let header = try? header.toJWSHeader(),
          let payload = try? payload.toPayload(),
          let key = try? jwk.toPrivateSecKey()
    else {
      print("didn't have one")
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
  
  public static func verifyJwt(token: String, jwk: JWK) -> JWTVerifyResponse? {
    guard let key = try? jwk.toPublicSecKey(),
          let jws = try? JWS(compactSerialization: token),
          let verifier = Verifier(verifyingAlgorithm: .ES256, key: key),
          let validation = try? jws.validate(using: verifier)
    else {
      return nil
    }
    
    let header = validation.header
    let serializedHeader = JWTHeader(
      alg: "ES256",
      jku: Field(wrappedValue: header.jku?.absoluteString),
      kid: Field(wrappedValue:header.kid),
      typ: Field(wrappedValue: header.typ),
      cty: Field(wrappedValue: header.cty),
      crit: Field(wrappedValue: header.cty)
    )
    
    let payload = String(data: validation.payload.data(), encoding: .utf8)
    
    guard let payload = payload else {
      return nil
    }
    
    return JWTVerifyResponse(
      protectedHeader: serializedHeader.toField(),
      payload: payload.toField()
    )
  }
}

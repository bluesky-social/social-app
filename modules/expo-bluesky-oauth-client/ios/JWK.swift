import ExpoModulesCore
import JOSESwift

struct JWK : Record {
  @Field
  var alg: String
  @Field
  var kty: String
  @Field
  var crv: String?
  @Field
  var x: String?
  @Field
  var y: String?
  @Field
  var e: String?
  @Field
  var n: String?
  @Field
  var d: String?
  @Field
  var use: String?
  @Field
  var kid: String?
  
  func toField() -> Field<JWK> {
    return Field(wrappedValue: self)
  }
  
  func toSecKey() throws -> SecKey? {
    let jsonData = try JSONSerialization.data(withJSONObject: self.toDictionary())
    guard let jwk = try? JSONDecoder().decode(ECPrivateKey.self, from: jsonData),
          let key = try? jwk.converted(to: SecKey.self)
    else {
      print("Error creating SecKey.")
      return nil
    }
    return key
  }
}

struct JWKPair : Record {
  @Field
  var privateKey: JWK
  @Field
  var publicKey: JWK
}

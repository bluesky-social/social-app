import ExpoModulesCore

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
}

struct JWKPair : Record {
  @Field
  var privateKey: JWK
  @Field
  var publicKey: JWK
}
